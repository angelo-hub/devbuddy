import React from "react";
import styles from "./CommitsAndFiles.module.css";

interface Commit {
  message: string;
  branch?: string;
}

interface TicketActivity {
  ticketId: string;
  type: string;
  description: string;
  timestamp: string;
  commentPreview?: string;
}

interface CommitsAndFilesProps {
  commits: Commit[];
  changedFiles: string[];
  tickets?: Array<{
    id: string;
    branch?: string;
    description?: string;
  }>;
  ticketActivity?: TicketActivity[];
}

// Helper to get activity type icon
const getActivityIcon = (type: string): string => {
  switch (type) {
    case "status_change": return "🔄";
    case "description_update": return "📝";
    case "comment_added": return "💬";
    case "priority_change": return "⚡";
    case "assignee_change": return "👤";
    case "label_change": return "🏷️";
    case "estimate_change": return "⏱️";
    case "attachment_added": return "📎";
    default: return "📌";
  }
};

// Helper to format relative time
const formatRelativeTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  
  if (diffMins < 60) {
    return `${diffMins}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return date.toLocaleDateString();
  }
};

export const CommitsAndFiles: React.FC<CommitsAndFilesProps> = ({
  commits,
  changedFiles,
  tickets,
  ticketActivity,
}) => {
  const hasContent = commits.length > 0 || changedFiles.length > 0 || (ticketActivity && ticketActivity.length > 0);
  
  if (!hasContent) {
    return null;
  }

  return (
    <div className={styles.container}>
      {tickets && tickets.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Tickets</div>
          <div className={styles.ticketsList}>
            {tickets.map((ticket, index) => (
              <div key={index} className={styles.ticket}>
                {ticket.id}
                {ticket.branch && ` (${ticket.branch})`}
                {ticket.description && `: ${ticket.description}`}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Activity Section */}
      {ticketActivity && ticketActivity.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>
            📋 Ticket Updates <span className={styles.badge}>(non-code work)</span>
          </div>
          <ul className={styles.activityList}>
            {ticketActivity.map((activity, index) => (
              <li key={index} className={styles.activityItem}>
                <span className={styles.activityIcon}>{getActivityIcon(activity.type)}</span>
                <span className={styles.activityContent}>
                  <strong>{activity.ticketId}</strong>: {activity.description}
                  {activity.commentPreview && (
                    <span className={styles.commentPreview}>
                      "{activity.commentPreview.substring(0, 60)}..."
                    </span>
                  )}
                </span>
                <span className={styles.activityTime}>{formatRelativeTime(activity.timestamp)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {commits.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Recent Commits</div>
          <ul className={styles.commitList}>
            {commits.map((commit, index) => (
              <li key={index}>
                {commit.message}
                {commit.branch && ` [${commit.branch}]`}
              </li>
            ))}
          </ul>
        </div>
      )}

      {changedFiles.length > 0 && (
        <div className={styles.section}>
          <div className={styles.sectionTitle}>Changed Files</div>
          <ul className={styles.fileList}>
            {changedFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

