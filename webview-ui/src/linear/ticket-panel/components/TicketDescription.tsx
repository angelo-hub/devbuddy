import React, { useState } from "react";
import styles from "./TicketDescription.module.css";

interface TicketDescriptionProps {
  description?: string;
  onUpdateDescription?: (description: string) => void;
}

export const TicketDescription: React.FC<TicketDescriptionProps> = ({
  description,
  onUpdateDescription,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description || "");

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
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className={styles.descriptionTextarea}
            rows={10}
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
          {description ? (
            <div className={styles.description}>{description}</div>
          ) : (
            <div className={styles.emptyState}>No description provided</div>
          )}
        </>
      )}
    </div>
  );
};

