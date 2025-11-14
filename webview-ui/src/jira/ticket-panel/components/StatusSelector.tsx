import React from "react";
import { Select } from "../../../shared/components/Select";
import styles from "./StatusSelector.module.css";

interface StatusSelectorProps {
  transitions: Array<{
    id: string;
    name: string;
    to: {
      id: string;
      name: string;
    };
  }>;
  currentStatusId: string;
  currentStatusName: string;
  onUpdate: (transitionId: string) => void;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  transitions,
  currentStatusId,
  currentStatusName,
  onUpdate,
}) => {
  return (
    <div className={styles.container}>
      <label className={styles.label}>Status</label>
      <select
        value={currentStatusId}
        onChange={(e) => {
          const transition = transitions.find(
            (t) => t.to.id === e.target.value
          );
          if (transition) {
            onUpdate(transition.id);
          }
        }}
        className={styles.select}
      >
        <option value={currentStatusId}>{currentStatusName}</option>
        {transitions
          .filter((t) => t.to.id !== currentStatusId)
          .map((transition) => (
            <option key={transition.id} value={transition.to.id}>
              {transition.to.name}
            </option>
          ))}
      </select>
    </div>
  );
};

