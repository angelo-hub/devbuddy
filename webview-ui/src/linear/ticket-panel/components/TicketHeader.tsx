import React, { useState } from "react";
import { Badge } from "../../../shared/components/index.ts";
import { ShareButton } from "./ShareButton";
import styles from "./TicketHeader.module.css";

interface TicketHeaderProps {
  identifier: string;
  title: string;
  statusName: string;
  statusType: string;
  priority: number;
  creator?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  assignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  url?: string;
  onUpdateTitle?: (title: string) => void;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({
  identifier,
  title,
  statusName,
  statusType,
  priority,
  creator,
  assignee,
  url,
  onUpdateTitle,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(title);

  const statusColor = getStatusColor(statusType);
  const priorityIcon = getPriorityIcon(priority);
  const priorityName = getPriorityName(priority);

  const handleSaveTitle = () => {
    if (editedTitle.trim() && editedTitle !== title && onUpdateTitle) {
      onUpdateTitle(editedTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    setEditedTitle(title);
    setIsEditingTitle(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSaveTitle();
    } else if (e.key === "Escape") {
      handleCancelTitle();
    }
  };

  return (
    <div className={styles.header}>
      <div className={styles.ticketIdContainer}>
        <div className={styles.ticketId}>{identifier}</div>
        <ShareButton identifier={identifier} url={url} />
      </div>

      {isEditingTitle ? (
        <div className={styles.titleEditContainer}>
          <input
            type="text"
            value={editedTitle}
            onChange={(e) => setEditedTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.titleInput}
            autoFocus
          />
          <div className={styles.editButtons}>
            <button onClick={handleSaveTitle} className={styles.saveButton}>
              Save
            </button>
            <button onClick={handleCancelTitle} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.titleContainer}>
          <h1 className={styles.ticketTitle}>{title}</h1>
          {onUpdateTitle && (
            <button
              onClick={() => setIsEditingTitle(true)}
              className={styles.editButton}
              title="Edit title"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </button>
          )}
        </div>
      )}

      <div className={styles.metadata}>
        <Badge variant="status" color={statusColor}>
          <span>●</span>
          {statusName}
        </Badge>
        <Badge variant="priority">
          <span>{priorityIcon}</span>
          {priorityName}
        </Badge>
        {creator && (
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Creator:</span>
            <div className={styles.assigneeInfo}>
              {creator.avatarUrl ? (
                <img
                  src={creator.avatarUrl}
                  alt={creator.name}
                  className={styles.assigneeAvatar}
                />
              ) : (
                <div className={styles.assigneeAvatarPlaceholder}>
                  {creator.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={styles.assigneeName}>{creator.name}</span>
            </div>
          </div>
        )}
        {assignee && (
          <div className={styles.metadataItem}>
            <span className={styles.metadataLabel}>Assignee:</span>
            <div className={styles.assigneeInfo}>
              {assignee.avatarUrl ? (
                <img
                  src={assignee.avatarUrl}
                  alt={assignee.name}
                  className={styles.assigneeAvatar}
                />
              ) : (
                <div className={styles.assigneeAvatarPlaceholder}>
                  {assignee.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className={styles.assigneeName}>{assignee.name}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

function getStatusColor(statusType: string): string {
  switch (statusType) {
    case "started":
      return "#6366f1";
    case "completed":
      return "#10b981";
    case "canceled":
      return "#6b7280";
    case "backlog":
      return "#8b5cf6";
    default:
      return "#6b7280";
  }
}

function getPriorityIcon(priority: number): string {
  switch (priority) {
    case 1:
      return "🔴";
    case 2:
      return "🟠";
    case 3:
      return "🟡";
    case 4:
      return "🟢";
    default:
      return "⚪";
  }
}

function getPriorityName(priority: number): string {
  switch (priority) {
    case 1:
      return "Urgent";
    case 2:
      return "High";
    case 3:
      return "Medium";
    case 4:
      return "Low";
    default:
      return "None";
  }
}

