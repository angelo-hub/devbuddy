import React, { useState, useEffect, useRef } from "react";
import styles from "./AssigneeSelector.module.css";
import { LinearUser } from "../../shared/types/messages";

interface AssigneeSelectorProps {
  currentAssignee?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
  users: LinearUser[];
  onUpdateAssignee: (assigneeId: string | null) => void;
  onLoadUsers: (teamId?: string) => void;
  onSearchUsers: (searchTerm: string) => void;
}

export const AssigneeSelector: React.FC<AssigneeSelectorProps> = ({
  currentAssignee,
  users,
  onUpdateAssignee,
  onLoadUsers,
  onSearchUsers,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasLoadedUsers, setHasLoadedUsers] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load users when component mounts (only once)
  useEffect(() => {
    if (!hasLoadedUsers) {
      onLoadUsers();
      setHasLoadedUsers(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle API search at 4+ characters with debounce
  useEffect(() => {
    if (searchTerm.length < 4) {
      return;
    }

    const timeoutId = setTimeout(() => {
      onSearchUsers(searchTerm);
    }, 300);

    return () => clearTimeout(timeoutId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm]);

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

  const handleSelectUser = (userId: string | null) => {
    onUpdateAssignee(userId);
    setIsOpen(false);
    setSearchTerm("");
  };

  // Client-side filtering for 3+ characters, API search happens at 4+
  const filteredUsers = searchTerm.length >= 3
    ? users.filter((user) => {
        const search = searchTerm.toLowerCase();
        return (
          user.name.toLowerCase().includes(search) ||
          user.email.toLowerCase().includes(search)
        );
      })
    : users;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title="Change assignee"
      >
        {currentAssignee ? (
          <>
            {currentAssignee.avatarUrl ? (
              <img
                src={currentAssignee.avatarUrl}
                alt={currentAssignee.name}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {currentAssignee.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.assigneeName}>{currentAssignee.name}</span>
          </>
        ) : (
          <>
            <div className={styles.avatarPlaceholder}>?</div>
            <span className={styles.assigneeName}>Unassigned</span>
          </>
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
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
              autoFocus
            />
          </div>

          <div className={styles.userList}>
            <button
              className={styles.userItem}
              onClick={() => handleSelectUser(null)}
            >
              <div className={styles.avatarPlaceholder}>?</div>
              <div className={styles.userInfo}>
                <div className={styles.userName}>Unassigned</div>
              </div>
            </button>

            {filteredUsers.length > 0 ? (
              filteredUsers.map((user) => (
                <button
                  key={user.id}
                  className={`${styles.userItem} ${
                    currentAssignee?.id === user.id ? styles.selected : ""
                  }`}
                  onClick={() => handleSelectUser(user.id)}
                >
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.name}</div>
                    <div className={styles.userEmail}>{user.email}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                {searchTerm.length >= 3
                  ? "No users found"
                  : users.length === 0
                  ? "Loading users..."
                  : "Type to search users"}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

