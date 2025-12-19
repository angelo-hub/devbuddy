import React, { useState, useEffect, useRef } from "react";
import styles from "./AssigneeSelector.module.css";

interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: {
    "48x48"?: string;
    "32x32"?: string;
    "24x24"?: string;
    "16x16"?: string;
  };
}

interface AssigneeSelectorProps {
  currentAssignee: JiraUser | null;
  users: JiraUser[];
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

  // Handle API search at 3+ characters with debounce
  useEffect(() => {
    if (searchTerm.length < 3) {
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

  // Get avatar URL (prefer 32x32, fallback to others)
  const getAvatarUrl = (user: JiraUser) => {
    return user.avatarUrls?.["32x32"] || 
           user.avatarUrls?.["48x48"] || 
           user.avatarUrls?.["24x24"] || 
           user.avatarUrls?.["16x16"];
  };

  // Client-side filtering for 2+ characters
  const filteredUsers = searchTerm.length >= 2
    ? users.filter((user) => {
        const search = searchTerm.toLowerCase();
        return (
          user.displayName.toLowerCase().includes(search) ||
          (user.emailAddress && user.emailAddress.toLowerCase().includes(search))
        );
      })
    : users;

  return (
    <div className={styles.container} ref={dropdownRef}>
      <label className={styles.label}>Assignee</label>
      <button
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        title="Change assignee"
      >
        {currentAssignee ? (
          <>
            {getAvatarUrl(currentAssignee) ? (
              <img
                src={getAvatarUrl(currentAssignee)}
                alt={currentAssignee.displayName}
                className={styles.avatar}
              />
            ) : (
              <div className={styles.avatarPlaceholder}>
                {currentAssignee.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className={styles.assigneeName}>{currentAssignee.displayName}</span>
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
                  key={user.accountId}
                  className={`${styles.userItem} ${
                    currentAssignee?.accountId === user.accountId ? styles.selected : ""
                  }`}
                  onClick={() => handleSelectUser(user.accountId)}
                >
                  {getAvatarUrl(user) ? (
                    <img
                      src={getAvatarUrl(user)}
                      alt={user.displayName}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {user.displayName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.displayName}</div>
                    {user.emailAddress && (
                      <div className={styles.userEmail}>{user.emailAddress}</div>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className={styles.emptyState}>
                {searchTerm.length >= 2
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
