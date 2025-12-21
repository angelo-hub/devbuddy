const esbuild = require("esbuild");
const path = require("path");
const fs = require("fs");
const babel = require("@babel/core");

const production = process.argv.includes("--production");
const watch = process.argv.includes("--watch");
const analyze = process.argv.includes("--analyze");
// Use ESM with code splitting for smaller total bundle size (~77% reduction)
const useCodeSplitting = process.argv.includes("--split");
// Enable React Compiler (can be disabled for debugging)
const useReactCompiler = !process.argv.includes("--no-compiler");

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
          const fullPath = path.join(aliasPath, relativePath);
          
          // Try common extensions if the path doesn't have one
          const extensions = [".tsx", ".ts", ".jsx", ".js", "/index.tsx", "/index.ts", "/index.jsx", "/index.js"];
          
          // If path already has an extension, try it directly
          if (path.extname(fullPath)) {
            if (fs.existsSync(fullPath)) {
              return { path: fullPath };
            }
          }
          
          // Try adding extensions
          for (const ext of extensions) {
            const pathWithExt = fullPath + ext;
            if (fs.existsSync(pathWithExt)) {
              return { path: pathWithExt };
            }
          }
          
          // If still not found, return the original path and let esbuild handle the error
          return { path: fullPath };
        }
      }
      return null;
    });
  },
};

/**
 * Analyze plugin - prints bundle size breakdown by package
 * @type {import('esbuild').Plugin}
 */
const analyzePlugin = {
  name: "analyze",
  setup(build) {
    build.onEnd((result) => {
      if (!analyze || !result.metafile) return;
      
      console.log("\n📊 Bundle Analysis:\n");
      
      for (const [outputFile, output] of Object.entries(result.metafile.outputs)) {
        if (!outputFile.endsWith(".js")) continue;
        
        const packages = {};
        for (const [file, info] of Object.entries(output.inputs)) {
          let pkg = "app";
          if (file.includes("node_modules")) {
            const parts = file.split("node_modules/")[1].split("/");
            pkg = parts[0].startsWith("@") ? parts[0] + "/" + parts[1] : parts[0];
          }
          packages[pkg] = (packages[pkg] || 0) + info.bytesInOutput;
        }
        
        const sorted = Object.entries(packages).sort((a, b) => b[1] - a[1]);
        const totalKB = (output.bytes / 1024).toFixed(1);
        const filename = outputFile.split("/").pop();
        
        console.log(`📦 ${filename}: ${totalKB} KB`);
        sorted.slice(0, 10).forEach(([pkg, bytes]) => {
          const kb = (bytes / 1024).toFixed(1);
          const pct = ((bytes / output.bytes) * 100).toFixed(1);
          console.log(`   ${kb.padStart(7)} KB (${pct.padStart(4)}%)  ${pkg}`);
        });
        console.log("");
      }
    });
  },
};

/**
 * Create React Compiler babel plugin for esbuild
 * Uses babel-plugin-react-compiler for automatic memoization
 * @type {import('esbuild').Plugin}
 */
const reactCompilerPlugin = {
  name: "react-compiler",
  setup(build) {
    // Only process TypeScript/JavaScript React files
    build.onLoad({ filter: /\.[jt]sx$/ }, async (args) => {
      const source = await fs.promises.readFile(args.path, "utf8");
      
      try {
        const result = await babel.transformAsync(source, {
          filename: args.path,
          presets: [
            ["@babel/preset-react", { runtime: "automatic" }],
            ["@babel/preset-typescript", { isTSX: true, allExtensions: true }],
          ],
          plugins: [
            ["babel-plugin-react-compiler", {
              // React Compiler configuration
              // See: https://react.dev/learn/react-compiler
            }],
          ],
          sourceMaps: false,
        });
        
        return {
          contents: result.code,
          loader: "js", // Output is already JavaScript
        };
      } catch (error) {
        return {
          errors: [{
            text: error.message,
            location: {
              file: args.path,
              line: error.loc?.line,
              column: error.loc?.column,
            },
          }],
        };
      }
    });
    
    // Handle .ts files (non-JSX TypeScript)
    build.onLoad({ filter: /\.ts$/ }, async (args) => {
      // Skip .d.ts files
      if (args.path.endsWith(".d.ts")) return null;
      
      const source = await fs.promises.readFile(args.path, "utf8");
      
      try {
        const result = await babel.transformAsync(source, {
          filename: args.path,
          presets: [
            ["@babel/preset-typescript"],
          ],
          sourceMaps: false,
        });
        
        return {
          contents: result.code,
          loader: "js",
        };
      } catch (error) {
        return {
          errors: [{
            text: error.message,
            location: {
              file: args.path,
              line: error.loc?.line,
              column: error.loc?.column,
            },
          }],
        };
      }
    });
  },
};

function getReactCompilerPlugin() {
  if (!useReactCompiler) {
    console.log("⚠️  React Compiler disabled (--no-compiler flag)");
    return null;
  }
  
  console.log("⚛️  React 19 + React Compiler enabled");
  return reactCompilerPlugin;
}

async function main() {
  // Ensure output directory exists
  const outDir = path.resolve(__dirname, "build");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const entryPoints = {
    // Linear webviews
    "linear-standup-builder": path.resolve(__dirname, "src/pro/standup-builder/index.tsx"),
    "linear-ticket-panel": path.resolve(__dirname, "src/linear/ticket-panel/index.tsx"),
    "linear-create-ticket": path.resolve(__dirname, "src/linear/create-ticket/index.tsx"),
    // Jira webviews
    "jira-ticket-panel": path.resolve(__dirname, "src/jira/ticket-panel/index.tsx"),
    "jira-create-ticket": path.resolve(__dirname, "src/jira/create-ticket/index.tsx"),
  };

  // Common build options
  const commonOptions = {
    entryPoints,
    bundle: true,
    minify: production,
    treeShaking: true,
    drop: production ? ["console", "debugger"] : [],
    define: {
      "process.env.NODE_ENV": production ? '"production"' : '"development"',
    },
    sourcemap: false, // Disabled to prevent corruption issues in Cursor
    sourcesContent: false,
    platform: "browser",
    outdir: outDir,
    external: ["vscode"],
    logLevel: "silent",
    metafile: analyze,
    plugins: [
      pathAliasPlugin,
      cssModulesPlugin,
      // React Compiler with Babel (handles JSX/TSX transformation)
      ...(useReactCompiler ? [getReactCompilerPlugin()].filter(Boolean) : []),
      esbuildProblemMatcherPlugin,
      ...(analyze ? [analyzePlugin] : []),
    ],
    loader: {
      ".css": "css",
      ".tsx": "tsx",
      ".ts": "ts",
    },
    // Only use esbuild's JSX when React Compiler is disabled
    ...(useReactCompiler ? {} : { jsx: "automatic" }),
    resolveExtensions: [".tsx", ".ts", ".jsx", ".js", ".css", ".json"],
  };

  if (useCodeSplitting) {
    // ESM with code splitting - shares common chunks between bundles
    // Note: Requires updating panel HTML to use type="module" scripts
    console.log("🔀 Building with code splitting (ESM)...");
    const ctx = await esbuild.context({
      ...commonOptions,
      format: "esm",
      splitting: true,
      chunkNames: "chunks/[name]-[hash]",
    });

    if (watch) {
      await ctx.watch();
    } else {
      await ctx.rebuild();
      await ctx.dispose();
    }
  } else {
    // IIFE format - each bundle is self-contained
    // This is the default for compatibility with current panel implementations
    const ctx = await esbuild.context({
      ...commonOptions,
      format: "iife",
    });

    if (watch) {
      await ctx.watch();
    } else {
      await ctx.rebuild();
      await ctx.dispose();
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

