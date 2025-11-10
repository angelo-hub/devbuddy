import React from "react";
import styles from "./TicketMetadata.module.css";

interface TicketMetadataProps {
  createdAt: string;
  updatedAt: string;
  projectName?: string;
}

export const TicketMetadata: React.FC<TicketMetadataProps> = ({
  createdAt,
  updatedAt,
  projectName,
}) => {
  return (
    <div className={styles.infoGrid}>
      <div className={styles.infoItem}>
        <div className={styles.infoLabel}>Created</div>
        <div className={styles.infoValue}>
          {new Date(createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className={styles.infoItem}>
        <div className={styles.infoLabel}>Updated</div>
        <div className={styles.infoValue}>
          {new Date(updatedAt).toLocaleDateString()}
        </div>
      </div>
      {projectName && (
        <div className={styles.infoItem}>
          <div className={styles.infoLabel}>Project</div>
          <div className={styles.infoValue}>{projectName}</div>
        </div>
      )}
    </div>
  );
};

