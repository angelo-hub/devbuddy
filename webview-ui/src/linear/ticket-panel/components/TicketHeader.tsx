import React, { useState } from "react";
import { Pencil, ArrowLeft } from "lucide-react";
import { Badge } from "@shared/components";
import { ShareButton } from "./ShareButton";
import { useCanGoBack, useLinearTicketActions } from "../store/useLinearTicketStore";
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
  
  // Navigation state and actions from Zustand store
  const canGoBack = useCanGoBack();
  const { goBack } = useLinearTicketActions();

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
        {canGoBack && (
          <button 
            onClick={goBack} 
            className={styles.backButton}
            title="Go back to previous issue"
          >
            <ArrowLeft size={16} />
          </button>
        )}
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
              <Pencil size={14} />
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
          <span style={{ color: priorityIcon.color }}>{priorityIcon.symbol}</span>
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

function getPriorityIcon(priority: number): { color: string; symbol: string } {
  switch (priority) {
    case 1:
      return { color: "#dc2626", symbol: "●" }; // Red - Urgent
    case 2:
      return { color: "#f97316", symbol: "●" }; // Orange - High
    case 3:
      return { color: "#eab308", symbol: "●" }; // Yellow - Medium
    case 4:
      return { color: "#22c55e", symbol: "●" }; // Green - Low
    default:
      return { color: "#6b7280", symbol: "○" }; // Gray - None
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

