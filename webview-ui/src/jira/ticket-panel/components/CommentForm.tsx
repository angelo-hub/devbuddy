import React, { useState } from "react";
import { TextArea } from "@shared/components/TextArea";
import { Button } from "@shared/components/Button";
import styles from "./CommentForm.module.css";

interface CommentFormProps {
  onSubmit: (body: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [commentBody, setCommentBody] = useState("");

  const handleSubmit = () => {
    if (commentBody.trim()) {
      onSubmit(commentBody.trim());
      setCommentBody("");
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Add Comment</h3>
      <textarea
        value={commentBody}
        onChange={(e) => setCommentBody(e.target.value)}
        placeholder="Write a comment..."
        className={styles.textarea}
        rows={4}
      />
      <button
        onClick={handleSubmit}
        disabled={!commentBody.trim()}
        className={styles.submitButton}
      >
        Add Comment
      </button>
    </div>
  );
};

