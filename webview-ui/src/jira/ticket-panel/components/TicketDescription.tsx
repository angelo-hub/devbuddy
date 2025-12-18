import React, { useState, useMemo, useEffect } from "react";
import { MarkdownEditor } from "@shared/components";
import { renderADF } from "@shared/utils/adfRenderer";
import { adfToMarkdown, markdownToAdf, isAdfDocument } from "@shared/utils/adfConverter";
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
  
  // Convert ADF to Markdown for editing
  const markdownDescription = useMemo(() => {
    if (isAdfDocument(description)) {
      return adfToMarkdown(description);
    }
    return description;
  }, [description]);
  
  const [editedMarkdown, setEditedMarkdown] = useState(markdownDescription);

  // Sync when description prop changes
  useEffect(() => {
    if (!isEditing) {
      // TODO: Avoid calling setState() directly within an effect
      // eslint-disable-next-line react-hooks/exhaustive-deps
      setEditedMarkdown(markdownDescription);
    }
  }, [markdownDescription, isEditing]);

  const handleSave = () => {
    // Convert Markdown back to ADF for Jira
    const adf = markdownToAdf(editedMarkdown);
    onUpdateDescription(JSON.stringify(adf));
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMarkdown(markdownDescription);
    setIsEditing(false);
  };

  // Render ADF for viewing
  const renderedDescription = useMemo(() => {
    if (isAdfDocument(description)) {
      return renderADF(description);
    }
    // Plain text fallback
    return description ? <p>{description}</p> : null;
  }, [description]);

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
          <MarkdownEditor
            value={editedMarkdown}
            onChange={setEditedMarkdown}
            placeholder="Add a description..."
            minHeight={200}
            autoFocus
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

