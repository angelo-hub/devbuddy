import React, { useState } from "react";
import { TextArea, Button } from "../../../shared/components/index.ts";
import styles from "./CommentForm.module.css";

interface CommentFormProps {
  onSubmit: (body: string) => void;
}

export const CommentForm: React.FC<CommentFormProps> = ({ onSubmit }) => {
  const [comment, setComment] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (comment.trim()) {
      onSubmit(comment);
      setComment("");
    }
  };

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Add Comment</div>
      <form onSubmit={handleSubmit}>
        <TextArea
          placeholder="Write a comment..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
        />
        <Button type="submit" disabled={!comment.trim()}>
          Add Comment
        </Button>
      </form>
    </div>
  );
};

