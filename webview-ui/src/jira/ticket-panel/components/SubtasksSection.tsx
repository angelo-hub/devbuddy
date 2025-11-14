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
}

export const SubtasksSection: React.FC<SubtasksSectionProps> = ({ subtasks }) => {
  if (!subtasks || subtasks.length === 0) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Subtasks ({subtasks.length})</h3>
      <div className={styles.subtasksList}>
        {subtasks.map((subtask) => (
          <div key={subtask.id} className={styles.subtask}>
            <div className={styles.subtaskHeader}>
              <span className={styles.subtaskKey}>{subtask.key}</span>
              <span className={styles.subtaskStatus}>{subtask.status.name}</span>
            </div>
            <div className={styles.subtaskSummary}>{subtask.summary}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

