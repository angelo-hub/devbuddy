import React from "react";
import styles from "./CommitsAndFiles.module.css";

interface Commit {
  message: string;
  branch?: string;
}

interface CommitsAndFilesProps {
  commits: Commit[];
  changedFiles: string[];
  tickets?: Array<{
    id: string;
    branch?: string;
    description?: string;
  }>;
}

export const CommitsAndFiles: React.FC<CommitsAndFilesProps> = ({
  commits,
  changedFiles,
  tickets,
}) => {
  if (commits.length === 0 && changedFiles.length === 0) {
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

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Changed Files</div>
        <ul className={styles.fileList}>
          {changedFiles.map((file, index) => (
            <li key={index}>{file}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

