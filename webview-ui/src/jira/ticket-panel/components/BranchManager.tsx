import React, { useState, useEffect } from "react";
import styles from "./BranchManager.module.css";

interface BranchManagerProps {
  ticketKey: string;
  statusCategory: string; // Jira status category: "new", "indeterminate", "done"
  onCheckoutBranch: (ticketKey: string) => void;
  onAssociateBranch: (ticketKey: string, branchName: string) => void;
  onRemoveAssociation: (ticketKey: string) => void;
  onLoadBranchInfo: (ticketKey: string) => void;
  onLoadAllBranches: () => void;
  branchInfo?: {
    branchName: string | null;
    exists: boolean;
  };
  allBranches?: {
    branches: string[];
    currentBranch: string | null;
    suggestions: string[];
  };
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  ticketKey,
  statusCategory,
  onCheckoutBranch,
  onAssociateBranch,
  onRemoveAssociation,
  onLoadBranchInfo,
  onLoadAllBranches,
  branchInfo,
  allBranches,
}) => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load branch info when component mounts
  useEffect(() => {
    onLoadBranchInfo(ticketKey);
  }, [ticketKey, onLoadBranchInfo]);

  // Load all branches when entering edit mode
  useEffect(() => {
    if (isEditing && !allBranches) {
      onLoadAllBranches();
    }
  }, [isEditing, allBranches, onLoadAllBranches]);

  const handleAssociate = () => {
    if (selectedBranch.trim()) {
      onAssociateBranch(ticketKey, selectedBranch.trim());
      setSelectedBranch("");
      setFilterText("");
      setIsEditing(false);
      setShowDropdown(false);
    }
  };

  const handleRemove = () => {
    onRemoveAssociation(ticketKey);
  };

  const handleCheckout = () => {
    onCheckoutBranch(ticketKey);
  };

  const handleBranchSelect = (branch: string) => {
    setSelectedBranch(branch);
    setFilterText(branch);
    setShowDropdown(false);
  };

  const handleInputChange = (value: string) => {
    setFilterText(value);
    setSelectedBranch(value);
    setShowDropdown(true);
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  // Filter branches based on input
  const getFilteredBranches = () => {
    if (!allBranches) return [];
    
    const { branches, currentBranch, suggestions } = allBranches;
    const filter = filterText.toLowerCase();

    let filtered = branches;
    if (filter) {
      filtered = branches.filter((b) => b.toLowerCase().includes(filter));
    }

    // Sort: current branch first, then suggestions, then alphabetically
    return filtered.sort((a, b) => {
      if (a === currentBranch) return -1;
      if (b === currentBranch) return 1;
      
      const aIsSuggestion = suggestions.includes(a);
      const bIsSuggestion = suggestions.includes(b);
      
      if (aIsSuggestion && !bIsSuggestion) return -1;
      if (bIsSuggestion && !aIsSuggestion) return 1;
      
      return a.localeCompare(b);
    });
  };

  const getBranchIcon = (branch: string) => {
    if (!allBranches) return "⎇";
    
    const { currentBranch, suggestions } = allBranches;
    
    if (branch === currentBranch) return "✓";
    if (suggestions.includes(branch)) return "💡";
    return "⎇";
  };

  const getBranchLabel = (branch: string) => {
    if (!allBranches) return "";
    
    const { currentBranch, suggestions } = allBranches;
    
    if (branch === currentBranch) return " (current)";
    if (suggestions.includes(branch)) return " (suggested)";
    return "";
  };

  // Show for "In Progress" tickets (Jira's "indeterminate" status category)
  // Also show for "To Do" ("new") to allow early branch association
  const isRelevant = statusCategory === "indeterminate" || statusCategory === "new";

  if (!isRelevant) {
    return null;
  }

  const filteredBranches = getFilteredBranches();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.icon}>🌿</span>
          Branch
        </div>
      </div>

      {branchInfo?.branchName ? (
        <div className={styles.branchInfo}>
          <div className={styles.branchName}>
            <span className={styles.branchIcon}>⎇</span>
            <span>{branchInfo.branchName}</span>
          </div>

          {!branchInfo.exists && (
            <div className={styles.warning}>
              <span className={styles.warningIcon}>⚠️</span>
              <span>Branch no longer exists in repository</span>
            </div>
          )}

          <div className={styles.actions}>
            {branchInfo.exists && (
              <button
                className={styles.checkoutButton}
                onClick={handleCheckout}
              >
                <span>↗️</span>
                Checkout Branch
              </button>
            )}
            <button className={styles.removeButton} onClick={handleRemove}>
              <span>🗑️</span>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.noBranch}>
          {!isEditing ? (
            <>
              <div className={styles.noBranchText}>
                No branch associated with this ticket
              </div>
              <button
                className={styles.checkoutButton}
                onClick={() => setIsEditing(true)}
              >
                <span>+</span>
                Associate Branch
              </button>
            </>
          ) : (
            <div className={styles.associateForm}>
              <div className={styles.inputContainer}>
                <input
                  type="text"
                  className={styles.branchInput}
                  placeholder="Type to filter branches..."
                  value={filterText}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={handleInputFocus}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleAssociate();
                    } else if (e.key === "Escape") {
                      setIsEditing(false);
                      setFilterText("");
                      setSelectedBranch("");
                      setShowDropdown(false);
                    }
                  }}
                  autoFocus
                />
                
                {showDropdown && filteredBranches.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredBranches.slice(0, 10).map((branch) => (
                      <div
                        key={branch}
                        className={styles.dropdownItem}
                        onClick={() => handleBranchSelect(branch)}
                      >
                        <span className={styles.dropdownIcon}>
                          {getBranchIcon(branch)}
                        </span>
                        <span className={styles.dropdownBranch}>
                          {branch}
                        </span>
                        <span className={styles.dropdownLabel}>
                          {getBranchLabel(branch)}
                        </span>
                      </div>
                    ))}
                    {filteredBranches.length > 10 && (
                      <div className={styles.dropdownMore}>
                        ... and {filteredBranches.length - 10} more
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                className={styles.associateButton}
                onClick={handleAssociate}
                disabled={!selectedBranch.trim()}
              >
                Associate
              </button>
              <button
                className={styles.removeButton}
                onClick={() => {
                  setIsEditing(false);
                  setFilterText("");
                  setSelectedBranch("");
                  setShowDropdown(false);
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
