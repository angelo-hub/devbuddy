const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
  name: "esbuild-problem-matcher",

  setup(build) {
    build.onStart(() => {
      console.log("[watch] build started");
    });
    build.onEnd((result) => {
      result.errors.forEach(({ text, location }) => {
        console.error(`✘ [ERROR] ${text}`);
        console.error(
          `    ${location.file}:${location.line}:${location.column}:`
        );
      });
      console.log("[watch] build finished");
    });
  },
};

/**
 * CSS Modules plugin for esbuild
 * @type {import('esbuild').Plugin}
 */
const cssModulesPlugin = {
  name: "css-modules",
  setup(build) {
    build.onResolve({ filter: /\.module\.css$/ }, (args) => ({
      path: path.resolve(args.resolveDir, args.path),
      namespace: "css-module",
    }));

    build.onLoad({ filter: /.*/, namespace: "css-module" }, async (args) => {
      const css = await fs.promises.readFile(args.path, "utf8");
      
      // Simple CSS modules implementation: generate class name map
      const classNames = {};
      const classNameRegex = /\.([a-zA-Z_][a-zA-Z0-9_-]*)/g;
      let match;
      
      while ((match = classNameRegex.exec(css)) !== null) {
        const className = match[1];
        // Generate unique class name
        const hash = args.path.split("/").pop().replace(".module.css", "");
        classNames[className] = `${className}_${hash}`;
      }

      // Transform CSS with scoped class names
      let transformedCSS = css;
      Object.keys(classNames).forEach((className) => {
        const regex = new RegExp(`\\.${className}(?![a-zA-Z0-9_-])`, "g");
        transformedCSS = transformedCSS.replace(regex, `.${classNames[className]}`);
      });

      return {
        contents: `
          const style = document.createElement('style');
          style.textContent = ${JSON.stringify(transformedCSS)};
          document.head.appendChild(style);
          export default ${JSON.stringify(classNames)};
        `,
        loader: "js",
      };
    });
  },
};

/**
 * Path alias plugin for esbuild
 * Resolves @shared, @core, @pro, @linear, @jira to webview-ui/src/* directories
 * @type {import('esbuild').Plugin}
 */
const pathAliasPlugin = {
  name: "path-alias",
  setup(build) {
    const aliases = {
      "@shared": path.resolve(__dirname, "src/shared"),
      "@core": path.resolve(__dirname, "src/core"),
      "@pro": path.resolve(__dirname, "src/pro"),
      "@linear": path.resolve(__dirname, "src/linear"),
      "@jira": path.resolve(__dirname, "src/jira"),
    };

    build.onResolve({ filter: /^@(shared|core|pro|linear|jira)/ }, (args) => {
      for (const [alias, aliasPath] of Object.entries(aliases)) {
        if (args.path.startsWith(alias)) {
          const relativePath = args.path.replace(alias, "");
          return {
            path: path.join(aliasPath, relativePath),
          };
        }
      }
      return null;
    });
  },
};

async function main() {
  // Ensure output directory exists
  const outDir = path.resolve(__dirname, "build");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const ctx = await esbuild.context({
    entryPoints: {
      // Linear webviews
      "linear-standup-builder": path.resolve(__dirname, "src/linear/standup-builder/index.tsx"),
      "linear-ticket-panel": path.resolve(__dirname, "src/linear/ticket-panel/index.tsx"),
      "linear-create-ticket": path.resolve(__dirname, "src/linear/create-ticket/index.tsx"),
      // Jira webviews
      "jira-ticket-panel": path.resolve(__dirname, "src/jira/ticket-panel/index.tsx"),
      "jira-create-ticket": path.resolve(__dirname, "src/jira/create-ticket/index.tsx"),
    },
    bundle: true,
    format: "iife",
    minify: production,
    sourcemap: false, // Disabled to prevent corruption issues in Cursor
    sourcesContent: false,
    platform: "browser",
    outdir: outDir,
    external: ["vscode"],
    logLevel: "silent",
    plugins: [
      pathAliasPlugin,
      cssModulesPlugin,
      esbuildProblemMatcherPlugin,
    ],
    loader: {
      ".css": "css",
      ".tsx": "tsx",
      ".ts": "ts",
    },
    jsx: "automatic",
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".json"],
  });

  if (watch) {
    await ctx.watch();
  } else {
    await ctx.rebuild();
    await ctx.dispose();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

