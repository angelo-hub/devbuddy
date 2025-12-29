import React from "react";
import styles from "./SubtasksSection.module.css";

interface Subtask {
  id: string;
  key: string;
  summary: string;
  status: {
    id: string;
    name: string;
  };
  issueType: {
    id: string;
    name: string;
  };
}

interface SubtasksSectionProps {
  subtasks: Subtask[];
  onOpenSubtask?: (subtaskKey: string) => void;
}

export const SubtasksSection: React.FC<SubtasksSectionProps> = ({ subtasks, onOpenSubtask }) => {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  const handleClick = (e: React.MouseEvent, subtaskKey: string) => {
    e.preventDefault();
    if (onOpenSubtask) {
      onOpenSubtask(subtaskKey);
    }
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Subtasks ({subtasks.length})</h3>
      <div className={styles.subtasksList}>
        {subtasks.map((subtask) => {
          const Component = onOpenSubtask ? 'button' : 'div';
          return (
            <Component
              key={subtask.id}
              className={`${styles.subtask} ${onOpenSubtask ? styles.clickable : ''}`}
              onClick={onOpenSubtask ? (e) => handleClick(e as React.MouseEvent, subtask.key) : undefined}
            >
              <div className={styles.subtaskHeader}>
                <span className={styles.subtaskKey}>{subtask.key}</span>
                <span className={styles.subtaskStatus}>{subtask.status.name}</span>
              </div>
              <div className={styles.subtaskSummary}>{subtask.summary}</div>
            </Component>
          );
        })}
      </div>
    </div>
  );
};

