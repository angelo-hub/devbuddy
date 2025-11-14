import React from "react";
import { Badge } from "@shared/components/Badge";
import styles from "./TicketMetadata.module.css";

interface TicketMetadataProps {
  created: string;
  updated: string;
  projectName: string;
  dueDate: string | null;
  labels: string[];
}

export const TicketMetadata: React.FC<TicketMetadataProps> = ({
  created,
  updated,
  projectName,
  dueDate,
  labels,
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.section}>
        <h3 className={styles.heading}>Details</h3>
        <div className={styles.metadataGrid}>
          <div className={styles.metadataItem}>
            <span className={styles.label}>Project:</span>
            <span>{projectName}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.label}>Created:</span>
            <span>{formatDate(created)}</span>
          </div>
          <div className={styles.metadataItem}>
            <span className={styles.label}>Updated:</span>
            <span>{formatDate(updated)}</span>
          </div>
          {dueDate && (
            <div className={styles.metadataItem}>
              <span className={styles.label}>Due Date:</span>
              <span>{formatDate(dueDate)}</span>
            </div>
          )}
        </div>
      </div>
      {labels && labels.length > 0 && (
        <div className={styles.section}>
          <h3 className={styles.heading}>Labels</h3>
          <div className={styles.labels}>
            {labels.map((label) => (
              <Badge key={label} text={label} color="#6366f1" />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

