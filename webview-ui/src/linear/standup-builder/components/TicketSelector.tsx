import React from "react";
import { Select } from "../../../shared/components/index.ts";
import { LinearTicket } from "../../shared/types/messages";
import styles from "./TicketSelector.module.css";

interface TicketSelectorProps {
  tickets: LinearTicket[];
  selectedTicket: string;
  onTicketChange: (ticketId: string) => void;
  isLoading: boolean;
}

export const TicketSelector: React.FC<TicketSelectorProps> = ({
  tickets,
  selectedTicket,
  onTicketChange,
  isLoading,
}) => {
  const selectedTicketData = tickets.find((t) => t.id === selectedTicket);
  const priorityNames = ["None", "Urgent", "High", "Medium", "Low"];

  return (
    <div className={styles.container}>
      <Select
        label="Linear Ticket"
        hint="Select a ticket or leave empty to auto-detect from branch"
        value={selectedTicket}
        onChange={(e) => onTicketChange(e.target.value)}
        disabled={isLoading}
      >
        <option value="">
          {isLoading ? "Loading tickets..." : "Auto-detect from branch"}
        </option>
        {tickets.map((ticket) => (
          <option key={ticket.id} value={ticket.id}>
            {ticket.id}: {ticket.title}
          </option>
        ))}
      </Select>

      {selectedTicketData && (
        <div className={styles.ticketContext}>
          <div className={styles.ticketTitle}>{selectedTicketData.title}</div>
          <div className={styles.ticketMeta}>
            <span>Status: {selectedTicketData.status}</span>
            <span>
              Priority: {priorityNames[selectedTicketData.priority] || "None"}
            </span>
          </div>
          {selectedTicketData.description && (
            <div className={styles.ticketDescription}>
              {selectedTicketData.description}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

