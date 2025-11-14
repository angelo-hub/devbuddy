import React, { useState, useEffect } from "react";
import styles from "./AssigneeSelector.module.css";

interface AssigneeSelectorProps {
  currentAssignee: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  } | null;
  users: Array<{
    accountId: string;
    displayName: string;
    emailAddress?: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  }>;
  onUpdateAssignee: (assigneeId: string | null) => void;
  onLoadUsers: () => void;
  onSearchUsers: (searchTerm: string) => void;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  currentAssignee,
  users,
  onUpdateAssignee,
  onLoadUsers,
  onSearchUsers,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (users.length === 0) {
      onLoadUsers();
    }
  }, []);

  useEffect(() => {
    if (isSearching && searchTerm) {
      const timer = setTimeout(() => {
        onSearchUsers(searchTerm);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm, isSearching]);

  return (
    <div className={styles.container}>
      <label className={styles.label}>Assignee</label>
      <select
        value={currentAssignee?.accountId || ""}
        onChange={(e) => onUpdateAssignee(e.target.value || null)}
        className={styles.select}
      >
        <option value="">Unassigned</option>
        {users.map((user) => (
          <option key={user.accountId} value={user.accountId}>
            {user.displayName}
          </option>
        ))}
      </select>
    </div>
  );
};

