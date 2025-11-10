import React from "react";
import styles from "./AttachedPRs.module.css";

interface Attachment {
  id: string;
  url: string;
  title?: string;
  subtitle?: string;
  sourceType?: string;
}

interface AttachedPRsProps {
  attachments?: {
    nodes: Attachment[];
  };
}

// Helper function to extract PR number from URL
function extractPRNumber(url: string): string | null {
  const match = url.match(/\/pull\/(\d+)|\/merge_requests\/(\d+)/);
  return match ? `#${match[1] || match[2]}` : null;
}

// Helper function to extract repo name from URL
function extractRepoName(url: string): string {
  // GitHub
  const githubMatch = url.match(/github\.com\/([^/]+\/[^/]+)/);
  if (githubMatch) {
    return githubMatch[1];
  }
  
  // GitLab
  const gitlabMatch = url.match(/gitlab\.com\/([^/]+\/[^/]+)/);
  if (gitlabMatch) {
    return gitlabMatch[1];
  }
  
  // Bitbucket
  const bitbucketMatch = url.match(/bitbucket\.org\/([^/]+\/[^/]+)/);
  if (bitbucketMatch) {
    return bitbucketMatch[1];
  }
  
  return "Repository";
}

// Helper function to get platform icon
function getPlatformIcon(url: string): string {
  if (url.includes("github.com")) return "github";
  if (url.includes("gitlab.com")) return "gitlab";
  if (url.includes("bitbucket.org")) return "bitbucket";
  return "git";
}

export const AttachedPRs: React.FC<AttachedPRsProps> = ({ attachments }) => {
  if (!attachments || attachments.nodes.length === 0) {
    return null;
  }

  // Filter for PRs/MRs from supported platforms
  const prs = attachments.nodes.filter(
    (attachment) =>
      (attachment.url.includes("github.com") && attachment.url.includes("/pull/")) ||
      (attachment.url.includes("gitlab.com") && attachment.url.includes("/merge_requests/")) ||
      (attachment.url.includes("bitbucket.org") && attachment.url.includes("/pull-requests/"))
  );

  if (prs.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className={styles.titleIcon}>🔗</span>
        Pull Requests ({prs.length})
      </h3>
      <p className={styles.subtitle}>Click to view status on GitHub/GitLab</p>
      <div className={styles.prList}>
        {prs.map((pr) => {
          const prNumber = extractPRNumber(pr.url);
          const repoName = extractRepoName(pr.url);
          const platform = getPlatformIcon(pr.url);
          
          return (
            <a
              key={pr.id}
              href={pr.url}
              className={styles.prItem}
              target="_blank"
              rel="noopener noreferrer"
            >
              <div className={styles.prHeader}>
                <div className={styles.prInfo}>
                  <span className={`${styles.platformIcon} ${styles[platform]}`}>
                    {platform === "github" && "⚡"}
                    {platform === "gitlab" && "🦊"}
                    {platform === "bitbucket" && "🪣"}
                  </span>
                  <span className={styles.prNumber}>{prNumber}</span>
                  <span className={styles.prRepo}>{repoName}</span>
                </div>
                <span className={styles.openArrow}>→</span>
              </div>
              {pr.title && (
                <div className={styles.prTitle}>{pr.title}</div>
              )}
              {pr.subtitle && (
                <div className={styles.prSubtitle}>{pr.subtitle}</div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
};

