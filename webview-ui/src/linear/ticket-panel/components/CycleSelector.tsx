import React, { useState, useEffect, useRef } from "react";
import styles from "./CycleSelector.module.css";
import { LinearCycle } from "@shared/types/messages";

interface CycleSelectorProps {
  currentCycle?: LinearCycle;
  availableCycles: LinearCycle[];
  onUpdateCycle: (cycleId: string | null) => void;
  onLoadCycles: (teamId: string) => void;
  teamId?: string;
}

export const CycleSelector: React.FC<CycleSelectorProps> = ({
  currentCycle,
  availableCycles,
  onUpdateCycle,
  onLoadCycles,
  teamId,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [hasLoadedCycles, setHasLoadedCycles] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load cycles when component mounts (only once)
  useEffect(() => {
    if (hasLoadedCycles || !teamId) {
      return;
    }
    onLoadCycles(teamId);
    setHasLoadedCycles(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectCycle = (cycleId: string | null) => {
    onUpdateCycle(cycleId);
    setIsOpen(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const getCycleLabel = (cycle: LinearCycle) => {
    const name = cycle.name || `Cycle ${cycle.number}`;
    if (cycle.startsAt && cycle.endsAt) {
      return `${name} (${formatDate(cycle.startsAt)} - ${formatDate(cycle.endsAt)})`;
    }
    return name;
  };

  return (
    <div className={styles.section} ref={dropdownRef}>
      <div className={styles.header}>
        <span className={styles.sectionTitle}>Cycle</span>
      </div>

      <button
        className={styles.trigger}
        onClick={() => {
          if (!hasLoadedCycles && teamId) {
            onLoadCycles(teamId);
            setHasLoadedCycles(true);
          }
          setIsOpen(!isOpen);
        }}
        title="Change cycle"
      >
        {currentCycle ? (
          <span className={styles.cycleName}>{getCycleLabel(currentCycle)}</span>
        ) : (
          <span className={styles.noCycle}>No cycle</span>
        )}
        <svg
          width="12"
          height="12"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={styles.chevron}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdown}>
          <div className={styles.cycleList}>
            <button
              className={`${styles.cycleItem} ${!currentCycle ? styles.selected : ""}`}
              onClick={() => handleSelectCycle(null)}
            >
              <div className={styles.cycleIcon}>
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
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </div>
              <span className={styles.cycleItemName}>No cycle</span>
            </button>

            {availableCycles.length > 0 ? (
              availableCycles.map((cycle) => (
                <button
                  key={cycle.id}
                  className={`${styles.cycleItem} ${
                    currentCycle?.id === cycle.id ? styles.selected : ""
                  }`}
                  onClick={() => handleSelectCycle(cycle.id)}
                >
                  <div className={styles.cycleIcon}>
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
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                  </div>
                  <div className={styles.cycleInfo}>
                    <span className={styles.cycleItemName}>
                      {cycle.name || `Cycle ${cycle.number}`}
                    </span>
                    {cycle.startsAt && cycle.endsAt && (
                      <span className={styles.cycleDates}>
                        {formatDate(cycle.startsAt)} - {formatDate(cycle.endsAt)}
                      </span>
                    )}
                  </div>
                  {cycle.progress !== undefined && (
                    <div className={styles.progressContainer}>
                      <div 
                        className={styles.progressBar}
                        style={{ width: `${Math.round(cycle.progress * 100)}%` }}
                      />
                    </div>
                  )}
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                {hasLoadedCycles ? "No cycles available" : "Loading cycles..."}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

