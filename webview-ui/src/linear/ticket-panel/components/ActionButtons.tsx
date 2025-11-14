import React from "react";
import { Button } from "@shared/components";
import styles from "./ActionButtons.module.css";

interface ActionButtonsProps {
  onOpenInLinear: () => void;
  onRefresh: () => void;
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
  onOpenInLinear,
  onRefresh,
}) => {
  return (
    <div className={styles.actions}>
      <Button variant="secondary" onClick={onOpenInLinear}>
        Open in Linear
      </Button>
      <Button variant="secondary" onClick={onRefresh}>
        Refresh
      </Button>
    </div>
  );
};

