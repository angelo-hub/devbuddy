import React from "react";
import { Button } from "@shared/components";
import styles from "./ResultsDisplay.module.css";

interface ResultsData {
  whatDidYouDo: string;
  whatWillYouDo: string;
  blockers: string;
}

interface ResultsDisplayProps {
  results: ResultsData | null;
  onCopyAll: () => void;
  onCopyAnswers: () => void;
}

export const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  results,
  onCopyAll,
  onCopyAnswers,
}) => {
  if (!results) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.divider} />

      <div className={styles.section}>
        <div className={styles.resultBox}>
          <div className={styles.resultTitle}>
            What did you do since the previous update?
          </div>
          <div className={styles.resultContent}>{results.whatDidYouDo}</div>
        </div>

        <div className={styles.resultBox}>
          <div className={styles.resultTitle}>
            What are you going to do today?
          </div>
          <div className={styles.resultContent}>{results.whatWillYouDo}</div>
        </div>

        <div className={styles.resultBox}>
          <div className={styles.resultTitle}>
            Are you reaching any blockers?
          </div>
          <div className={styles.resultContent}>{results.blockers}</div>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={onCopyAll}>Copy All</Button>
        <Button variant="secondary" onClick={onCopyAnswers}>
          Copy Answers Only
        </Button>
      </div>
    </div>
  );
};

