import React from "react";
import { Badge } from "../../../shared/components/index.ts";
import styles from "./TicketLabels.module.css";

interface Label {
  id: string;
  name: string;
  color: string;
}

interface TicketLabelsProps {
  labels: Label[];
}

export const TicketLabels: React.FC<TicketLabelsProps> = ({ labels }) => {
  if (labels.length === 0) {
    return null;
  }

  return (
    <div className={styles.section}>
      <div className={styles.sectionTitle}>Labels</div>
      <div className={styles.labels}>
        {labels.map((label) => (
          <Badge key={label.id} color={label.color}>
            {label.name}
          </Badge>
        ))}
      </div>
    </div>
  );
};

