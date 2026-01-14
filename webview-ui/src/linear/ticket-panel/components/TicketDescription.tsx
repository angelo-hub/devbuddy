import React, { useState, useMemo, useEffect } from "react";
import { renderMarkdown } from "@shared/utils/markdownRenderer";
import { MarkdownEditor } from "@shared/components";
import type { EnrichedTicketMetadata } from "@shared/types/messages";
import styles from "./TicketDescription.module.css";

interface TicketDescriptionProps {
  description?: string;
  onUpdateDescription?: (description: string) => void;
  onTicketClick?: (ticketId: string) => void;
  enrichedMetadata?: Map<string, EnrichedTicketMetadata>;
}

export const TicketDescription: React.FC<TicketDescriptionProps> = ({
  description,
  onUpdateDescription,
  onTicketClick,
  enrichedMetadata,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description || "");

  // Sync editedDescription when description prop changes (e.g., after save)
  useEffect(() => {
    if (!isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedDescription(description || "");
    }
  }, [description, isEditing]);

  const handleSave = () => {
    if (editedDescription !== description && onUpdateDescription) {
      onUpdateDescription(editedDescription);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDescription(description || "");
    setIsEditing(false);
  };

  // Memoize the rendered markdown to prevent infinite re-renders
  const renderedDescription = useMemo(() => {
    return description ? renderMarkdown(description, { onTicketClick, enrichedMetadata }) : null;
  }, [description, onTicketClick, enrichedMetadata]);

  return (
    <div className={styles.section}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>Description</div>
        {onUpdateDescription && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className={styles.editButton}
            title="Edit description"
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

      {isEditing ? (
        <>
          <MarkdownEditor
            value={editedDescription}
            onChange={setEditedDescription}
            placeholder="Add a description..."
            minHeight={200}
            autoFocus
          />
          <div className={styles.editButtons}>
            <button onClick={handleSave} className={styles.saveButton}>
              Save
            </button>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {renderedDescription ? (
            <div className={styles.description}>{renderedDescription}</div>
          ) : (
            <div className={styles.emptyState}>No description provided</div>
          )}
        </>
      )}
    </div>
  );
};

