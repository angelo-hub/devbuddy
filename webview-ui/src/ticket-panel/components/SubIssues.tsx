import React from "react";
import styles from "./SubIssues.module.css";

interface SubIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
  state: {
    id: string;
    name: string;
    type: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  priority: number;
}

interface ParentIssue {
  id: string;
  identifier: string;
  title: string;
  url: string;
}

interface SubIssuesProps {
  childrenIssues?: {
    nodes: SubIssue[];
  };
  parent?: ParentIssue;
  onOpenIssue?: (issueId: string) => void;
}

// Helper to get status badge color based on state type
function getStatusColor(stateType: string): string {
  switch (stateType) {
    case "completed":
      return styles.completed;
    case "started":
      return styles.started;
    case "unstarted":
      return styles.unstarted;
    case "backlog":
      return styles.backlog;
    case "canceled":
      return styles.canceled;
    default:
      return styles.default;
  }
}

// Helper to get priority label and color
function getPriorityInfo(priority: number): { label: string; className: string } {
  switch (priority) {
    case 1:
      return { label: "Urgent", className: styles.urgent };
    case 2:
      return { label: "High", className: styles.high };
    case 3:
      return { label: "Medium", className: styles.medium };
    case 4:
      return { label: "Low", className: styles.low };
    default:
      return { label: "", className: "" };
  }
}

export const SubIssues: React.FC<SubIssuesProps> = ({ children, parent, onOpenIssue }) => {
  if (!children && !parent) {
    return null;
  }

  const handleClick = (e: React.MouseEvent, issueId: string) => {
    e.preventDefault();
    if (onOpenIssue) {
      onOpenIssue(issueId);
    }
  };

  return (
    <div className={styles.container}>
      {parent && (
        <div className={styles.parentSection}>
          <h3 className={styles.title}>
            <span className={styles.titleIcon}>⬆️</span>
            Parent Issue
          </h3>
          <a
            href="#"
            onClick={(e) => handleClick(e, parent.id)}
            className={styles.parentItem}
          >
            <span className={styles.issueIdentifier}>{parent.identifier}</span>
            <span className={styles.issueTitle}>{parent.title}</span>
            <span className={styles.openArrow}>→</span>
          </a>
        </div>
      )}

      {children && children.nodes.length > 0 && (
        <div className={styles.childrenSection}>
          <h3 className={styles.title}>
            <span className={styles.titleIcon}>⬇️</span>
            Sub-issues ({children.nodes.length})
          </h3>
          <div className={styles.subIssuesList}>
            {children.nodes.map((subIssue) => {
              const priorityInfo = getPriorityInfo(subIssue.priority);
              const statusColorClass = getStatusColor(subIssue.state.type);
              
              return (
                <a
                  key={subIssue.id}
                  href="#"
                  onClick={(e) => handleClick(e, subIssue.id)}
                  className={styles.subIssueItem}
                >
                  <div className={styles.subIssueHeader}>
                    <div className={styles.subIssueInfo}>
                      <span className={styles.issueIdentifier}>
                        {subIssue.identifier}
                      </span>
                      <span className={`${styles.statusBadge} ${statusColorClass}`}>
                        {subIssue.state.name}
                      </span>
                      {priorityInfo.label && (
                        <span className={`${styles.priorityBadge} ${priorityInfo.className}`}>
                          {priorityInfo.label}
                        </span>
                      )}
                    </div>
                    <span className={styles.openArrow}>→</span>
                  </div>
                  <div className={styles.subIssueTitle}>{subIssue.title}</div>
                  {subIssue.assignee && (
                    <div className={styles.assignee}>
                      {subIssue.assignee.avatarUrl && (
                        <img
                          src={subIssue.assignee.avatarUrl}
                          alt={subIssue.assignee.name}
                          className={styles.avatar}
                        />
                      )}
                      <span className={styles.assigneeName}>
                        {subIssue.assignee.name}
                      </span>
                    </div>
                  )}
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

