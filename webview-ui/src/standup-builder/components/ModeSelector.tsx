import React from "react";
import styles from "./ModeSelector.module.css";

interface ModeSelectorProps {
  mode: "single" | "multi";
  onModeChange: (mode: "single" | "multi") => void;
}

export const ModeSelector: React.FC<ModeSelectorProps> = ({
  mode,
  onModeChange,
}) => {
  return (
    <div className={styles.container}>
      <div
        className={`${styles.modeButton} ${mode === "single" ? styles.active : ""}`}
        onClick={() => onModeChange("single")}
      >
        <div className={styles.title}>Single Ticket</div>
        <div className={styles.hint}>One ticket from current branch</div>
      </div>
      <div
        className={`${styles.modeButton} ${mode === "multi" ? styles.active : ""}`}
        onClick={() => onModeChange("multi")}
      >
        <div className={styles.title}>Multiple Tickets</div>
        <div className={styles.hint}>Track work across multiple tickets</div>
      </div>
    </div>
  );
};

