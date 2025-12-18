import React, { useState, useMemo, useEffect } from "react";
import { MarkdownEditor } from "@shared/components";
import { renderMarkdown } from "@shared/utils/markdownRenderer";
import { markdownToAdf } from "@shared/utils/adfConverter";
import { 
  descriptionToMarkdown, 
  markdownToWiki 
} from "@shared/utils/wikiMarkupConverter";
import styles from "./TicketDescription.module.css";

interface TicketDescriptionProps {
  description: string;
  deploymentType?: 'cloud' | 'server';
  onUpdateDescription: (description: string) => void;
}

export const TicketDescription: React.FC<TicketDescriptionProps> = ({
  description,
  deploymentType = 'cloud',
  onUpdateDescription,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  
  // Convert any format (ADF, wiki, plain) to Markdown for display/editing
  const markdownDescription = useMemo(() => {
    return descriptionToMarkdown(description);
  }, [description]);
  
  const [editedMarkdown, setEditedMarkdown] = useState(markdownDescription);

  // Sync when description prop changes (only when not editing)
  useEffect(() => {
    if (!isEditing) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEditedMarkdown(markdownDescription);
    }
  }, [markdownDescription, isEditing]);

  const handleSave = () => {
    // Convert Markdown back to native format based on deployment type
    if (deploymentType === 'server') {
      // Jira Server uses wiki markup
      const wiki = markdownToWiki(editedMarkdown);
      onUpdateDescription(wiki);
    } else {
      // Jira Cloud uses ADF
      const adf = markdownToAdf(editedMarkdown);
      onUpdateDescription(JSON.stringify(adf));
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedMarkdown(markdownDescription);
    setIsEditing(false);
  };

  // Render markdown for viewing (works for all formats after conversion)
  const renderedDescription = useMemo(() => {
    if (!markdownDescription) {
      return null;
    }
    return renderMarkdown(markdownDescription);
  }, [markdownDescription]);

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
