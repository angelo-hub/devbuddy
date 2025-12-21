import React from "react";
import { Link2, ArrowRight, Ban, GitMerge, Copy, AlertCircle } from "lucide-react";
import styles from "./IssueLinksSection.module.css";

interface IssueLink {
  id: string;
  type: {
    id: string;
    name: string;
    inward: string;  // e.g., "is blocked by"
    outward: string; // e.g., "blocks"
  };
  direction: "inward" | "outward";
  linkedIssue: {
    id: string;
    key: string;
    summary: string;
    status: {
      id: string;
      name: string;
      statusCategory?: {
        key: string;
        colorName: string;
      };
    };
    issueType: {
      id: string;
      name: string;
      iconUrl?: string;
    };
  };
}

interface IssueLinksSectionProps {
  issueLinks: IssueLink[];
  onOpenLinkedIssue?: (issueKey: string) => void;
}

// Get the relationship label based on direction
function getRelationshipLabel(link: IssueLink): string {
  return link.direction === "inward" ? link.type.inward : link.type.outward;
}

// Get icon based on link type
function getLinkIcon(linkTypeName: string): React.ReactNode {
  const name = linkTypeName.toLowerCase();
  
  if (name.includes("block")) {
    return <Ban size={14} className={styles.linkTypeIcon} />;
  }
  if (name.includes("duplicate") || name.includes("clone")) {
    return <Copy size={14} className={styles.linkTypeIcon} />;
  }
  if (name.includes("cause") || name.includes("problem")) {
    return <AlertCircle size={14} className={styles.linkTypeIcon} />;
  }
  if (name.includes("relate") || name.includes("epic")) {
    return <GitMerge size={14} className={styles.linkTypeIcon} />;
  }
  
  return <Link2 size={14} className={styles.linkTypeIcon} />;
}

// Get status category class for coloring
function getStatusCategoryClass(statusCategory?: { key: string }): string {
  if (!statusCategory) return styles.statusDefault;
  
  switch (statusCategory.key) {
    case "done":
      return styles.statusDone;
    case "indeterminate":
      return styles.statusInProgress;
    case "new":
    default:
      return styles.statusTodo;
  }
}

// Group links by relationship type for better organization
function groupLinksByType(links: IssueLink[]): Map<string, IssueLink[]> {
  const grouped = new Map<string, IssueLink[]>();
  
  for (const link of links) {
    const label = getRelationshipLabel(link);
    const existing = grouped.get(label) || [];
    existing.push(link);
    grouped.set(label, existing);
  }
  
  return grouped;
}

export const IssueLinksSection: React.FC<IssueLinksSectionProps> = ({ 
  issueLinks, 
  onOpenLinkedIssue 
}) => {
  if (!issueLinks || issueLinks.length === 0) {
    return null;
  }

  const groupedLinks = groupLinksByType(issueLinks);
  
  const handleClick = (e: React.MouseEvent, issueKey: string) => {
    e.preventDefault();
    if (onOpenLinkedIssue) {
      onOpenLinkedIssue(issueKey);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>
        <Link2 size={14} className={styles.headingIcon} />
        Linked Issues ({issueLinks.length})
      </h3>
      
      <div className={styles.linkGroups}>
        {Array.from(groupedLinks.entries()).map(([relationship, links]) => (
          <div key={relationship} className={styles.linkGroup}>
            <div className={styles.relationshipLabel}>
              {getLinkIcon(links[0].type.name)}
              <span>{relationship}</span>
            </div>
            
            <div className={styles.linksList}>
              {links.map((link) => (
                <a
                  key={link.id}
                  href="#"
                  onClick={(e) => handleClick(e, link.linkedIssue.key)}
                  className={styles.linkItem}
                >
                  <div className={styles.linkItemHeader}>
                    <div className={styles.issueInfo}>
                      {link.linkedIssue.issueType.iconUrl && (
                        <img 
                          src={link.linkedIssue.issueType.iconUrl} 
                          alt={link.linkedIssue.issueType.name}
                          className={styles.issueTypeIcon}
                        />
                      )}
                      <span className={styles.issueKey}>{link.linkedIssue.key}</span>
                      <span className={`${styles.statusBadge} ${getStatusCategoryClass(link.linkedIssue.status.statusCategory)}`}>
                        {link.linkedIssue.status.name}
                      </span>
                    </div>
                    <ArrowRight size={14} className={styles.openArrow} />
                  </div>
                  <div className={styles.issueSummary}>{link.linkedIssue.summary}</div>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

