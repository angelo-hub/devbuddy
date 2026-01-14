import React, { useState, useRef, useEffect } from "react";
import styles from "./EstimateSelector.module.css";

interface EstimateSelectorProps {
  currentEstimate: number | null;
  onUpdate: (estimate: number | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export const EstimateSelector: React.FC<EstimateSelectorProps> = ({
  currentEstimate,
  onUpdate,
  label = "Estimate",
  placeholder = "None",
  disabled = false,
  min = 0,
  max,
  step = 1,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(currentEstimate?.toString() || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentEstimate?.toString() || "");
    }
  }, [currentEstimate, isEditing]);

  const handleSave = () => {
    const value = inputValue.trim();
    
    if (value === "") {
      // Only update if the value actually changed
      if (currentEstimate !== null) {
        onUpdate(null);
      }
      setIsEditing(false);
      return;
    }

    const numValue = Number(value);
    if (!isNaN(numValue) && numValue >= min && (!max || numValue <= max)) {
      // Only update if the value actually changed
      if (numValue !== currentEstimate) {
        onUpdate(numValue);
      }
      setIsEditing(false);
    } else {
      // Revert to current value if invalid
      setInputValue(currentEstimate?.toString() || "");
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setInputValue(currentEstimate?.toString() || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  const displayValue = currentEstimate !== null ? currentEstimate.toString() : placeholder;

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.valueContainer}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            inputMode="decimal"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={disabled}
          />
        ) : (
          <button
            className={styles.displayButton}
            onClick={() => !disabled && setIsEditing(true)}
            disabled={disabled}
            title="Click to edit"
          >
            {displayValue}
          </button>
        )}
      </div>
    </div>
  );
};

