import React, { useState, useEffect } from "react";
import { Select, Button } from "@shared/components";
import { WorkflowState } from "@shared/types/messages";
import styles from "./StatusSelector.module.css";

interface StatusSelectorProps {
  states: WorkflowState[];
  currentStateId: string;
  onUpdate: (stateId: string) => void;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({
  states,
  currentStateId,
  onUpdate,
}) => {
  const [selectedState, setSelectedState] = useState(currentStateId);

  // Update selected state when currentStateId changes (e.g., when switching tickets)
  useEffect(() => {
    setSelectedState(currentStateId);
  }, [currentStateId]);

  const handleUpdate = () => {
    if (selectedState !== currentStateId) {
      onUpdate(selectedState);
    }
  };

  return (
    <div className={styles.container}>
      <Select
        value={selectedState}
        onChange={(e) => setSelectedState(e.target.value)}
        className={styles.select}
      >
        {states.map((state) => (
          <option key={state.id} value={state.id}>
            {state.name}
          </option>
        ))}
      </Select>
      <Button onClick={handleUpdate} disabled={selectedState === currentStateId}>
        Update Status
      </Button>
    </div>
  );
};

