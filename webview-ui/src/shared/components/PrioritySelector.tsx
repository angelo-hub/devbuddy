import React from "react";
import styles from "./PrioritySelector.module.css";

export interface PriorityOption {
  value: string | number;
  label: string;
  icon?: string;
  color?: string;
}

interface PrioritySelectorProps {
  currentPriority: string | number | null;
  priorities: PriorityOption[];
  onUpdate: (priorityValue: string | number) => void;
  label?: string;
  disabled?: boolean;
}

export const PrioritySelector: React.FC<PrioritySelectorProps> = ({
  currentPriority,
  priorities,
  onUpdate,
  label = "Priority",
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    // Try to parse as number if it looks like a number
    const numValue = Number(value);
    const finalValue = !isNaN(numValue) && value !== "" ? numValue : value;
    onUpdate(finalValue);
  };

  const currentOption = priorities.find(p => p.value.toString() === currentPriority?.toString());

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.selectWrapper}>
        <select
          className={styles.select}
          value={currentPriority?.toString() || ""}
          onChange={handleChange}
          disabled={disabled}
        >
          {priorities.map((priority) => (
            <option key={priority.value} value={priority.value}>
              {priority.icon ? `${priority.icon} ` : ""}
              {priority.label}
            </option>
          ))}
        </select>
        <div className={styles.displayValue}>
          {currentOption?.icon && <span className={styles.icon}>{currentOption.icon}</span>}
          <span>{currentOption?.label || "None"}</span>
        </div>
      </div>
    </div>
  );
};

