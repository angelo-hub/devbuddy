import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { GitAnalyzer } from '@shared/git/gitAnalyzer';
import { PackageDetector } from '@shared/utils/packageDetector';
import { TemplateParser } from '@shared/utils/templateParser';
import { AISummarizer } from '@shared/ai/aiSummarizer';
import { LicenseManager } from '@pro/utils/licenseManager';

/**
 * Generate PR Summary Command - PRO FEATURE
 * 
 * AI-powered PR description generation with monorepo support.
 * Requires valid DevBuddy Pro license or active trial.
 * 
 * @license Commercial - See LICENSE.pro
 */
export async function generatePRSummaryCommand() {
  // Feature gate: Check Pro license
  const context = await getExtensionContext();
  const licenseManager = LicenseManager.getInstance(context);
  
  if (!licenseManager.hasProAccess()) {
    await licenseManager.promptUpgrade('AI PR Summary Generation');
    return;
  }

  try {
    // Get workspace root
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
      vscode.window.showErrorMessage('No workspace folder open');
      return;
    }

    const workspaceRoot = workspaceFolder.uri.fsPath;

    // Initialize utilities
    const gitAnalyzer = new GitAnalyzer(workspaceRoot);
    const packageDetector = new PackageDetector();
    const templateParser = new TemplateParser();
    const aiSummarizer = new AISummarizer();

    // Check if we're in a git repository
    const isGitRepo = await gitAnalyzer.isGitRepository();
    if (!isGitRepo) {
      vscode.window.showErrorMessage('Current workspace is not a git repository');
      return;
    }

    // Get git context
    const gitContext = await gitAnalyzer.getGitContext();

    // Analyze packages
    const packageAnalysis = packageDetector.analyzeChangedFiles(gitContext.changedFiles);

    // Read PR template
    const config = vscode.workspace.getConfiguration('devBuddy');
    const templatePath = config.get<string>('prTemplatePath', '.github/pull_request_template.md');
    const fullTemplatePath = path.join(workspaceRoot, templatePath);

    let templateContent = '';
    if (fs.existsSync(fullTemplatePath)) {
      templateContent = fs.readFileSync(fullTemplatePath, 'utf-8');
    } else {
      // Use a default template if no template exists
      templateContent = `## Ticket
<!-- Ticket ID and description -->

## Packages Modified
<!-- List of modified packages -->

## Summary of Changes
<!-- Brief summary of what changed -->

## Testing & Verification
<!-- How was this tested? -->
`;
      vscode.window.showWarningMessage(
        `PR template not found at ${templatePath}. Using default template.`
      );
    }

    // Parse template
    const sections = templateParser.parseTemplate(templateContent);

    // Prompt user for ticket information
    const ticketId = await vscode.window.showInputBox({
      prompt: 'Ticket ID (e.g., ENG-1234, PROJ-123)',
      value: gitContext.ticketId || '',
      placeHolder: 'Leave empty if no ticket'
    });

    const ticketDescription = await vscode.window.showInputBox({
      prompt: 'Ticket description',
      placeHolder: 'Brief description of the ticket'
    });

    // Check if AI is available for generating summaries
    const aiAvailable = await aiSummarizer.isAvailable();
    let aiGeneratedSummary: string | null = null;

    if (aiAvailable) {
      await vscode.window.withProgress(
        {
          location: vscode.ProgressLocation.Notification,
          title: "Generating AI summary...",
          cancellable: false,
        },
        async (progress) => {
          progress.report({ message: "Analyzing changes..." });
          aiGeneratedSummary = await aiSummarizer.summarizeCommitsForPR({
            commits: gitContext.commits,
            changedFiles: gitContext.changedFiles,
            ticketId: ticketId || undefined,
            context: ticketDescription || undefined,
          });
        }
      );
    }

    // Build the PR summary output
    let output = '';

    for (const section of sections) {
      // Skip author reminders section
      if (section.isAuthorReminders) {
        continue;
      }

      output += `${section.title}\n${'='.repeat(section.title.length)}\n\n`;

      // Handle different sections
      if (section.title.toLowerCase().includes('ticket')) {
        const ticketLine = ticketId 
          ? `${ticketId}${ticketDescription ? ' – ' + ticketDescription : ''}`
          : ticketDescription || '(no ticket)';
        output += `${ticketLine}\n\n`;
      } else if (section.title.toLowerCase().includes('package')) {
        const packageNames = packageDetector.getPackageNames(packageAnalysis);
        if (packageNames.length > 0) {
          output += `${packageNames.join(', ')}\n\n`;
        } else {
          output += `No packages modified (docs/config only)\n\n`;
        }
        output += `**Scope Verdict:** ${packageAnalysis.scopeVerdict}\n\n`;
      } else if (section.checkboxes.length > 0) {
        // Section with checkboxes - prompt for each
        output += await promptForCheckboxSection(section);
      } else {
        // Regular section - check if this is a summary section and we have AI-generated content
        const isSummarySection = section.title.toLowerCase().includes('summary') || 
                                  section.title.toLowerCase().includes('changes');
        
        const hint = section.hint || `Fill in the ${section.title} section`;
        const defaultValue = (isSummarySection && aiGeneratedSummary) ? aiGeneratedSummary : '';
        const prompt = (isSummarySection && aiGeneratedSummary) 
          ? `${section.title} (AI-generated, edit if needed)`
          : section.title;

        const content = await vscode.window.showInputBox({
          prompt: prompt,
          placeHolder: hint,
          value: defaultValue
        });

        if (content) {
          output += `${content}\n\n`;
        } else {
          output += `<!-- TODO: Fill in ${section.title} -->\n\n`;
        }
      }
    }

    // Add git context at the end
    output += `\n---\n\n`;
    output += `**Git Context**\n\n`;
    output += `- **Branch:** ${gitContext.currentBranch}\n`;
    output += `- **Base branch:** ${gitContext.baseBranch}\n`;
    output += `- **Files changed:** ${gitContext.changedFiles.length}\n`;
    output += `- **Commits:** ${gitContext.commits.length}\n\n`;

    if (gitContext.commits.length > 0) {
      output += `**Recent commits:**\n`;
      gitContext.commits.slice(0, 10).forEach(commit => {
        output += `- ${commit.hash} ${commit.message}\n`;
      });
      if (gitContext.commits.length > 10) {
        output += `- ... and ${gitContext.commits.length - 10} more\n`;
      }
      output += `\n`;
    }

    // Show output in a new document
    const doc = await vscode.workspace.openTextDocument({
      content: output,
      language: 'markdown'
    });
    await vscode.window.showTextDocument(doc);

    vscode.window.showInformationMessage('PR Summary generated! Copy and paste into your PR.');

  } catch (error) {
    vscode.window.showErrorMessage(`Error generating PR summary: ${error}`);
    console.error('PR Summary generation error:', error);
  }
}

async function promptForCheckboxSection(section: any): Promise<string> {
  let output = '';
  
  for (const checkbox of section.checkboxes) {
    const answer = await vscode.window.showQuickPick(['Yes', 'No', 'N/A'], {
      placeHolder: checkbox,
      canPickMany: false
    });

    const checked = answer === 'Yes' ? 'x' : ' ';
    output += `- [${checked}] ${checkbox}\n`;
  }

  // Allow additional notes for this section
  const notes = await vscode.window.showInputBox({
    prompt: `Additional notes for ${section.title} (optional)`,
    placeHolder: 'Any additional context...'
  });

  if (notes) {
    output += `\n${notes}\n`;
  }

  output += `\n`;
  return output;
}

/**
 * Helper function to get extension context from VS Code globals
 * This is a workaround since commands don't receive context directly
 */
async function getExtensionContext(): Promise<vscode.ExtensionContext> {
  const extension = vscode.extensions.getExtension('angelogirardi.dev-buddy');
  if (!extension) {
    throw new Error('Extension context not available');
  }
  // Access context from extension exports (needs to be set up in extension.ts)
  return (extension.exports as any).context;
}

