import React, { useState, useRef, useEffect } from "react";
import styles from "./DueDateSelector.module.css";

interface DueDateSelectorProps {
  currentDueDate: string | null;
  onUpdate: (dueDate: string | null) => void;
  label?: string;
  disabled?: boolean;
}

export const DueDateSelector: React.FC<DueDateSelectorProps> = ({
  currentDueDate,
  onUpdate,
  label = "Due Date",
  disabled = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(
    currentDueDate ? formatDateForInput(currentDueDate) : ""
  );
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(currentDueDate ? formatDateForInput(currentDueDate) : "");
    }
  }, [currentDueDate, isEditing]);

  const handleSave = () => {
    const value = inputValue.trim();
    
    if (value === "") {
      onUpdate(null);
      setIsEditing(false);
      return;
    }

    // Validate and parse date
    const dateRegex = /^(\d{4})-?(\d{2})-?(\d{2})$/;
    const match = value.match(dateRegex);
    
    if (match) {
      const [, year, month, day] = match;
      const formattedDate = `${year}-${month}-${day}`;
      onUpdate(formattedDate);
      setIsEditing(false);
    } else {
      // Try to parse common formats
      const parsed = parseFlexibleDate(value);
      if (parsed) {
        onUpdate(parsed);
        setIsEditing(false);
      } else {
        // Revert to current value if invalid
        setInputValue(currentDueDate ? formatDateForInput(currentDueDate) : "");
        setIsEditing(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      setInputValue(currentDueDate ? formatDateForInput(currentDueDate) : "");
      setIsEditing(false);
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpdate(null);
  };

  const displayValue = currentDueDate ? formatDateForDisplay(currentDueDate) : "None";

  return (
    <div className={styles.container}>
      <label className={styles.label}>{label}</label>
      <div className={styles.valueContainer}>
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="YYYY-MM-DD"
          />
        ) : (
          <div className={styles.displayContainer}>
            <button
              className={styles.displayButton}
              onClick={() => !disabled && setIsEditing(true)}
              disabled={disabled}
              title="Click to edit (format: YYYY-MM-DD)"
            >
              {displayValue}
            </button>
            {currentDueDate && !disabled && (
              <button
                className={styles.clearButton}
                onClick={handleClear}
                title="Clear due date"
              >
                ✕
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Format ISO 8601 date string to YYYY-MM-DD
 */
function formatDateForInput(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

/**
 * Format date for display (e.g., "Jan 15, 2025")
 */
function formatDateForDisplay(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    return date.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return isoDate;
  }
}

/**
 * Parse flexible date formats (MM/DD/YYYY, MM-DD-YYYY, etc.)
 */
function parseFlexibleDate(input: string): string | null {
  try {
    // Try to parse as a date
    const date = new Date(input);
    if (!isNaN(date.getTime())) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
  } catch {
    // Ignore
  }
  return null;
}

