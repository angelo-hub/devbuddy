import React, { useState } from "react";
import { Button } from "@shared/components/Button";
import styles from "./TicketHeader.module.css";

interface TicketHeaderProps {
  issueKey: string;
  summary: string;
  statusName: string;
  statusCategory: string;
  issueType: string;
  issueTypeIcon?: string;
  priority: {
    id: string;
    name: string;
    iconUrl?: string;
  } | null;
  reporter: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  };
  assignee: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  } | null;
  url: string;
  onUpdateSummary: (summary: string) => void;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({
  issueKey,
  summary,
  statusName,
  statusCategory,
  issueType,
  issueTypeIcon,
  priority,
  reporter,
  onUpdateSummary,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSummary, setEditedSummary] = useState(summary);

  const handleSave = () => {
    if (editedSummary.trim() && editedSummary !== summary) {
      onUpdateSummary(editedSummary.trim());
    }
    setIsEditing(false);
  };

  const getStatusColor = () => {
    switch (statusCategory) {
      case "done":
        return "#10b981";
      case "indeterminate":
        return "#f59e0b";
      case "new":
      default:
        return "#6b7280";
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.issueKey}>
          {issueTypeIcon && <img src={issueTypeIcon} alt={issueType} className={styles.typeIcon} />}
          <span>{issueKey}</span>
        </div>
        <div 
          className={styles.status} 
          style={{ backgroundColor: getStatusColor() }}
        >
          {statusName}
        </div>
      </div>
      {isEditing ? (
        <div className={styles.editContainer}>
          <input
            type="text"
            value={editedSummary}
            onChange={(e) => setEditedSummary(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setEditedSummary(summary);
                setIsEditing(false);
              }
            }}
            onBlur={handleSave}
            autoFocus
            className={styles.summaryInput}
          />
        </div>
      ) : (
        <h1
          className={styles.summary}
          onClick={() => setIsEditing(true)}
          title="Click to edit"
        >
          {summary}
        </h1>
      )}
      <div className={styles.metadata}>
        <div className={styles.metadataItem}>
          <span className={styles.label}>Type:</span>
          <span>{issueType}</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.label}>Priority:</span>
          <span>{priority?.name || "None"}</span>
        </div>
        <div className={styles.metadataItem}>
          <span className={styles.label}>Reporter:</span>
          <span>{reporter.displayName}</span>
        </div>
      </div>
    </div>
  );
};

