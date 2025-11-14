import React, { useState } from "react";
import { TextArea } from "../../../shared/components/TextArea";
import { Button } from "../../../shared/components/Button";
import { renderADF } from "../../../shared/utils/adfRenderer";
import styles from "./TicketDescription.module.css";

interface TicketDescriptionProps {
  description: string;
  onUpdateDescription: (description: string) => void;
}

export const TicketDescription: React.FC<TicketDescriptionProps> = ({
  description,
  onUpdateDescription,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDescription, setEditedDescription] = useState(description);

  const handleSave = () => {
    if (editedDescription !== description) {
      onUpdateDescription(editedDescription);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedDescription(description);
    setIsEditing(false);
  };

  // Try to parse as ADF, fallback to plain text
  let renderedDescription: React.ReactNode;
  try {
    const adf = JSON.parse(description);
    if (adf && adf.type === "doc") {
      renderedDescription = renderADF(adf);
    } else {
      // Not ADF format, display as plain text
      renderedDescription = description;
    }
  } catch {
    // Not JSON or parse error, display as plain text
    renderedDescription = description;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3 className={styles.heading}>Description</h3>
        {!isEditing && (
          <button onClick={() => setIsEditing(true)} className={styles.editButton}>
            Edit
          </button>
        )}
      </div>
      {isEditing ? (
        <div className={styles.editContainer}>
          <textarea
            value={editedDescription}
            onChange={(e) => setEditedDescription(e.target.value)}
            className={styles.textarea}
            rows={10}
          />
          <div className={styles.actions}>
            <button onClick={handleSave} className={styles.saveButton}>
              Save
            </button>
            <button onClick={handleCancel} className={styles.cancelButton}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.descriptionContent}>
          {renderedDescription || <span className={styles.emptyState}>No description</span>}
        </div>
      )}
    </div>
  );
};

