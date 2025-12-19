import React, { useState, useEffect, useRef } from "react";
import { Badge } from "@shared/components";
import styles from "./LabelSelector.module.css";
import { LinearLabel } from "@shared/types/messages";

interface LabelSelectorProps {
  currentLabels: LinearLabel[];
  availableLabels: LinearLabel[];
  onUpdateLabels: (labelIds: string[]) => void;
  onLoadLabels: (teamId: string) => void;
  teamId?: string;
}

export const LabelSelector: React.FC<LabelSelectorProps> = ({
  currentLabels,
  availableLabels,
  onUpdateLabels,
  onLoadLabels,
  teamId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoadedLabels, setHasLoadedLabels] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load labels when component mounts (only once)
  useEffect(() => {
    if (hasLoadedLabels || !teamId) {
      return;
    }
    onLoadLabels(teamId);
    // Use a ref pattern to avoid the lint warning
    setHasLoadedLabels(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleRemoveLabel = (labelId: string) => {
    const newLabelIds = currentLabels
      .filter((label) => label.id !== labelId)
      .map((label) => label.id);
    onUpdateLabels(newLabelIds);
  };

  const handleAddLabel = (label: LinearLabel) => {
    // Don't add if already selected
    if (currentLabels.some((l) => l.id === label.id)) {
      return;
    }
    const newLabelIds = [...currentLabels.map((l) => l.id), label.id];
    onUpdateLabels(newLabelIds);
    setSearchTerm("");
  };

  // Filter available labels that aren't already selected
  const filteredLabels = availableLabels.filter((label) => {
    const notSelected = !currentLabels.some((l) => l.id === label.id);
    const matchesSearch = searchTerm.length === 0 || 
      label.name.toLowerCase().includes(searchTerm.toLowerCase());
    return notSelected && matchesSearch;
  });

  return (
    <div className={styles.section} ref={dropdownRef}>
      <div className={styles.header}>
        <span className={styles.sectionTitle}>Labels</span>
        <button
          className={styles.addButton}
          onClick={() => {
            if (!hasLoadedLabels && teamId) {
              onLoadLabels(teamId);
              setHasLoadedLabels(true);
            }
            setIsOpen(!isOpen);
          }}
          title="Add label"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>

      <div className={styles.labels}>
        {currentLabels.length > 0 ? (
          currentLabels.map((label) => (
            <Badge 
              key={label.id} 
              color={label.color}
              onRemove={() => handleRemoveLabel(label.id)}
            >
              {label.name}
            </Badge>
          ))
        ) : (
          <span className={styles.noLabels}>No labels</span>
        )}
      </div>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          <div className={styles.labelList}>
            {filteredLabels.length > 0 ? (
              filteredLabels.map((label) => (
                <button
                  key={label.id}
                  className={styles.labelItem}
                  onClick={() => handleAddLabel(label)}
                >
                  <span
                    className={styles.labelColor}
                    style={{ backgroundColor: label.color }}
                  />
                  <span className={styles.labelName}>{label.name}</span>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                {searchTerm.length > 0
                  ? "No matching labels"
                  : availableLabels.length === 0
                  ? "Loading labels..."
                  : "All labels assigned"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

