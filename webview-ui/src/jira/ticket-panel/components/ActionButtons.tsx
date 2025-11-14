import React from "react";
import { Button } from "@shared/components/Button";
import styles from "./ActionButtons.module.css";

interface ActionButtonsProps {
  onOpenInJira: () => void;
  onRefresh: () => void;
  onCopyKey: () => void;
  onCopyUrl: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onOpenInJira,
  onRefresh,
  onCopyKey,
  onCopyUrl,
}) => {
  return (
    <div className={styles.container}>
      <button onClick={onOpenInJira} className={styles.primaryButton}>
        Open in Jira
      </button>
      <button onClick={onRefresh} className={styles.button}>
        Refresh
      </button>
      <button onClick={onCopyKey} className={styles.button}>
        Copy Key
      </button>
      <button onClick={onCopyUrl} className={styles.button}>
        Copy URL
      </button>
    </div>
  );
};

