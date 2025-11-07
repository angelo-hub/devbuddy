import * as vscode from 'vscode';

export interface PackageAnalysis {
  packages: Array<{ name: string; path: string }>;
  count: number;
  isWithinScope: boolean;
  scopeVerdict: string;
}

export class PackageDetector {
  private packagesPaths: string[];
  private maxPackageScope: number;

  constructor() {
    const config = vscode.workspace.getConfiguration('linearBuddy');
    this.packagesPaths = config.get<string[]>('packagesPaths', ['packages/', 'apps/']);
    this.maxPackageScope = config.get<number>('maxPackageScope', 2);
  }

  /**
   * Analyze changed files and extract modified packages
   */
  analyzeChangedFiles(changedFiles: string[]): PackageAnalysis {
    const packagesMap = new Map<string, string>(); // name -> path

    for (const file of changedFiles) {
      for (const basePath of this.packagesPaths) {
        // Match pattern like "packages/package-name/" or "apps/app-name/"
        const regex = new RegExp(`^${basePath.replace('/', '\\/')}([^/]+)\\/`);
        const match = file.match(regex);
        
        if (match) {
          const packageName = match[1];
          packagesMap.set(packageName, basePath);
          break; // Found a match, no need to check other paths
        }
      }
    }

    const packages = Array.from(packagesMap.entries()).map(([name, path]) => ({
      name,
      path: path.replace('/', '')
    }));

    const count = packages.length;
    const isWithinScope = count <= this.maxPackageScope;
    const scopeVerdict = isWithinScope ? '✅ Within scope' : '⚠️ Too broad';

    return {
      packages,
      count,
      isWithinScope,
      scopeVerdict
    };
  }

  /**
   * Format package analysis for display
   */
  formatPackages(analysis: PackageAnalysis): string {
    if (analysis.count === 0) {
      return 'No packages modified (docs/config only)';
    }

    const packagesList = analysis.packages
      .map(pkg => `${pkg.name} (${pkg.path})`)
      .join(', ');

    return `${packagesList} — Scope: ${analysis.scopeVerdict}`;
  }

  /**
   * Get a simple list of package names
   */
  getPackageNames(analysis: PackageAnalysis): string[] {
    return analysis.packages.map(pkg => pkg.name);
  }
}




