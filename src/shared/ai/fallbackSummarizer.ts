import * as vscode from "vscode";

export interface SummaryRequest {
  commits: Array<{ hash: string; message: string; branch?: string }>;
  changedFiles: string[];
  ticketId?: string | null;
  context?: string;
}

/**
 * Rule-based summarizer for when AI is unavailable or disabled
 * Perfect for sensitive organizations that cannot use external AI services
 */
export class FallbackSummarizer {
  /**
   * Generate a standup summary using rule-based analysis
   */
  public generateStandupSummary(request: SummaryRequest): string {
    if (request.commits.length === 0) {
      return "No commits found in the specified time window.";
    }

    const analysis = this.analyzeCommits(request.commits);
    const packageInfo = this.extractPackageInfo(request.changedFiles);
    
    let summary = "";
    
    // Ticket context
    if (request.ticketId) {
      summary += `Worked on ${request.ticketId}. `;
    }
    
    // Action summary
    const actions = this.summarizeActions(analysis);
    if (actions) {
      summary += actions;
    }
    
    // Package/area context
    if (packageInfo.packages.length > 0) {
      summary += ` across ${packageInfo.packages.slice(0, 3).join(", ")}`;
      if (packageInfo.packages.length > 3) {
        summary += ` and ${packageInfo.packages.length - 3} other areas`;
      }
    }
    
    summary += ".";
    
    // Add commit count context
    summary += ` Made ${request.commits.length} commit${request.commits.length > 1 ? "s" : ""}.`;
    
    return summary;
  }

  /**
   * Generate a PR summary using rule-based analysis
   */
  public generatePRSummary(request: SummaryRequest): string {
    if (request.commits.length === 0) {
      return "No changes to summarize.";
    }

    const analysis = this.analyzeCommits(request.commits);
    const bullets: string[] = [];
    
    // Group by commit type
    if (analysis.features.length > 0) {
      bullets.push(`✨ Added ${analysis.features.length} new feature${analysis.features.length > 1 ? "s" : ""}`);
    }
    
    if (analysis.fixes.length > 0) {
      bullets.push(`🐛 Fixed ${analysis.fixes.length} bug${analysis.fixes.length > 1 ? "s" : ""}`);
    }
    
    if (analysis.refactors.length > 0) {
      bullets.push(`♻️ Refactored ${analysis.refactors.length} component${analysis.refactors.length > 1 ? "s" : ""}`);
    }
    
    if (analysis.tests.length > 0) {
      bullets.push(`🧪 Added ${analysis.tests.length} test${analysis.tests.length > 1 ? "s" : ""}`);
    }
    
    if (analysis.docs.length > 0) {
      bullets.push(`📝 Updated documentation (${analysis.docs.length} commit${analysis.docs.length > 1 ? "s" : ""})`);
    }
    
    // If no specific categories, use generic summary
    if (bullets.length === 0) {
      bullets.push(`📋 Made ${request.commits.length} commit${request.commits.length > 1 ? "s" : ""} with various changes`);
    }
    
    // Add file context
    const fileTypes = this.categorizeFiles(request.changedFiles);
    if (fileTypes.size > 0) {
      const types = Array.from(fileTypes.keys()).slice(0, 3).join(", ");
      bullets.push(`📁 Modified ${request.changedFiles.length} file${request.changedFiles.length > 1 ? "s" : ""} (${types})`);
    }
    
    return bullets.join("\n- ");
  }

  /**
   * Suggest next steps based on commit patterns
   */
  public suggestNextSteps(request: SummaryRequest): string {
    const analysis = this.analyzeCommits(request.commits);
    const suggestions: string[] = [];
    
    // Check for incomplete work indicators
    const hasWIP = request.commits.some(c => 
      c.message.toLowerCase().includes('wip') || 
      c.message.toLowerCase().includes('in progress')
    );
    
    if (hasWIP) {
      suggestions.push("Complete work in progress");
    }
    
    // Check for missing tests
    const hasCode = request.commits.some(c => 
      c.message.toLowerCase().includes('implement') ||
      c.message.toLowerCase().includes('add feature')
    );
    const hasTests = analysis.tests.length > 0;
    
    if (hasCode && !hasTests) {
      suggestions.push("Add test coverage for new features");
    }
    
    // Check for missing docs
    const hasDocs = analysis.docs.length > 0;
    if ((analysis.features.length > 0 || analysis.refactors.length > 0) && !hasDocs) {
      suggestions.push("Update documentation");
    }
    
    // Check for fixes that might need follow-up
    if (analysis.fixes.length > 0) {
      suggestions.push("Verify bug fixes and edge cases");
    }
    
    // Default suggestion
    if (suggestions.length === 0) {
      if (request.ticketId) {
        suggestions.push(`Continue work on ${request.ticketId}`);
      } else {
        suggestions.push("Continue current work and prepare for code review");
      }
    }
    
    return suggestions.slice(0, 2).join(", ");
  }

  /**
   * Detect potential blockers from commit messages
   */
  public detectBlockers(commits: Array<{ message: string }>): string {
    const blockerKeywords = [
      'blocked', 'blocker', 'waiting for', 'need help',
      'stuck', 'error', 'failing', 'broken', 'todo',
      'fixme', 'hack', 'temporary'
    ];
    
    const concerningCommits = commits.filter(c => 
      blockerKeywords.some(keyword => 
        c.message.toLowerCase().includes(keyword)
      )
    );
    
    if (concerningCommits.length > 0) {
      return `Possible blockers detected in ${concerningCommits.length} commit${concerningCommits.length > 1 ? "s" : ""}. Review commit messages for details.`;
    }
    
    // Check for repeated attempts (multiple commits with similar messages)
    const messageGroups = new Map<string, number>();
    commits.forEach(c => {
      const normalized = c.message.toLowerCase().replace(/[^a-z\s]/g, '').trim();
      messageGroups.set(normalized, (messageGroups.get(normalized) || 0) + 1);
    });
    
    const repeatedWork = Array.from(messageGroups.values()).some(count => count > 2);
    if (repeatedWork) {
      return "Multiple similar commits detected - might indicate a challenging issue.";
    }
    
    return "None detected";
  }

  /**
   * Analyze commits and categorize them
   */
  private analyzeCommits(commits: Array<{ message: string }>) {
    const analysis = {
      features: [] as string[],
      fixes: [] as string[],
      refactors: [] as string[],
      tests: [] as string[],
      docs: [] as string[],
      other: [] as string[]
    };
    
    for (const commit of commits) {
      const msg = commit.message.toLowerCase();
      
      // Conventional commit prefixes
      if (msg.startsWith('feat:') || msg.startsWith('feature:') || msg.includes('implement') || msg.includes('add feature')) {
        analysis.features.push(commit.message);
      } else if (msg.startsWith('fix:') || msg.includes('fix ') || msg.includes('fixed ') || msg.includes('bug')) {
        analysis.fixes.push(commit.message);
      } else if (msg.startsWith('refactor:') || msg.includes('refactor') || msg.includes('cleanup') || msg.includes('reorganize')) {
        analysis.refactors.push(commit.message);
      } else if (msg.startsWith('test:') || msg.includes('test') || msg.includes('spec')) {
        analysis.tests.push(commit.message);
      } else if (msg.startsWith('docs:') || msg.includes('document') || msg.includes('readme')) {
        analysis.docs.push(commit.message);
      } else {
        analysis.other.push(commit.message);
      }
    }
    
    return analysis;
  }

  /**
   * Summarize actions from analysis
   */
  private summarizeActions(analysis: ReturnType<typeof this.analyzeCommits>): string {
    const actions: string[] = [];
    
    if (analysis.features.length > 0) {
      actions.push("implemented new features");
    }
    if (analysis.fixes.length > 0) {
      actions.push("fixed bugs");
    }
    if (analysis.refactors.length > 0) {
      actions.push("refactored code");
    }
    if (analysis.tests.length > 0) {
      actions.push("added tests");
    }
    if (analysis.docs.length > 0) {
      actions.push("updated documentation");
    }
    if (analysis.other.length > 0 && actions.length === 0) {
      actions.push("made various changes");
    }
    
    if (actions.length === 0) {
      return "";
    }
    
    if (actions.length === 1) {
      return `I ${actions[0]}`;
    }
    
    const last = actions.pop();
    return `I ${actions.join(", ")} and ${last}`;
  }

  /**
   * Extract package information from file paths
   */
  private extractPackageInfo(files: string[]): { packages: string[] } {
    const packages = new Set<string>();
    
    for (const file of files) {
      // Extract meaningful directory names
      const parts = file.split('/');
      
      // Look for package indicators
      if (parts.includes('packages')) {
        const pkgIndex = parts.indexOf('packages');
        if (pkgIndex + 1 < parts.length) {
          packages.add(parts[pkgIndex + 1]);
        }
      } else if (parts.includes('apps')) {
        const appIndex = parts.indexOf('apps');
        if (appIndex + 1 < parts.length) {
          packages.add(parts[appIndex + 1]);
        }
      } else if (parts.includes('src')) {
        // Use directory after src as package/module name
        const srcIndex = parts.indexOf('src');
        if (srcIndex + 1 < parts.length) {
          packages.add(parts[srcIndex + 1]);
        }
      } else if (parts.length > 1) {
        // Use first meaningful directory
        packages.add(parts[0]);
      }
    }
    
    return { packages: Array.from(packages) };
  }

  /**
   * Categorize files by type
   */
  private categorizeFiles(files: string[]): Map<string, number> {
    const categories = new Map<string, number>();
    
    for (const file of files) {
      let category = 'other';
      
      if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        category = 'TypeScript';
      } else if (file.endsWith('.js') || file.endsWith('.jsx')) {
        category = 'JavaScript';
      } else if (file.endsWith('.py')) {
        category = 'Python';
      } else if (file.endsWith('.css') || file.endsWith('.scss')) {
        category = 'Styles';
      } else if (file.endsWith('.test.ts') || file.endsWith('.spec.ts')) {
        category = 'Tests';
      } else if (file.endsWith('.md')) {
        category = 'Documentation';
      } else if (file.includes('package.json') || file.includes('tsconfig.json')) {
        category = 'Configuration';
      }
      
      categories.set(category, (categories.get(category) || 0) + 1);
    }
    
    return categories;
  }
}

