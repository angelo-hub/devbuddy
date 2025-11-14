import React from "react";
import styles from "./ProgressIndicator.module.css";

interface ProgressIndicatorProps {
  message: string;
  visible: boolean;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  message,
  visible,
}) => {
  if (!visible) {
    return null;
  }

  return <div className={styles.progress}>{message}</div>;
};

