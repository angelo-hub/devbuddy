import React from "react";
import { Input, Button } from "../../../shared/components/index.ts";
import styles from "./StandupForm.module.css";

interface StandupFormProps {
  timeWindow: string;
  targetBranch: string;
  tickets: string;
  mode: "single" | "multi";
  onTimeWindowChange: (value: string) => void;
  onTargetBranchChange: (value: string) => void;
  onTicketsChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onOpenSettings: () => void;
  isGenerating: boolean;
}

export const StandupForm: React.FC<StandupFormProps> = ({
  timeWindow,
  targetBranch,
  tickets,
  mode,
  onTimeWindowChange,
  onTargetBranchChange,
  onTicketsChange,
  onSubmit,
  onOpenSettings,
  isGenerating,
}) => {
  return (
    <form onSubmit={onSubmit} className={styles.form}>
      <Input
        label="Time Window"
        hint="Examples: '24 hours ago', '2 days ago', 'since yesterday'"
        value={timeWindow}
        onChange={(e) => onTimeWindowChange(e.target.value)}
        placeholder="24 hours ago"
      />

      <Input
        label="Target Branch"
        hint="Branch to compare against (default: main or master)"
        value={targetBranch}
        onChange={(e) => onTargetBranchChange(e.target.value)}
        placeholder="main"
      />

      {mode === "multi" && (
        <Input
          label="Ticket IDs (comma-separated)"
          hint="Enter ticket IDs separated by commas"
          value={tickets}
          onChange={(e) => onTicketsChange(e.target.value)}
          placeholder="ENG-123, ENG-456, ENG-789"
        />
      )}

      <div className={styles.actions}>
        <Button type="submit" disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate Standup"}
        </Button>
        <Button type="button" variant="secondary" onClick={onOpenSettings}>
          Settings
        </Button>
      </div>
    </form>
  );
};

