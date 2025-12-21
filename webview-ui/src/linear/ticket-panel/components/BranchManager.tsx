import React, { useState, useEffect } from "react";
import {
  GitBranch,
  Check,
  Lightbulb,
  AlertTriangle,
  FolderOpen,
  ExternalLink,
  Trash2,
  Plus,
} from "lucide-react";
import styles from "./BranchManager.module.css";

interface BranchManagerProps {
  ticketId: string;
  statusType: string;
  onCheckoutBranch: (ticketId: string) => void;
  onAssociateBranch: (ticketId: string, branchName: string) => void;
  onRemoveAssociation: (ticketId: string) => void;
  onLoadBranchInfo: (ticketId: string) => void;
  onLoadAllBranches: () => void;
  onOpenInRepository?: (ticketId: string, repositoryPath: string) => void;
  branchInfo?: {
    branchName: string | null;
    exists: boolean;
    /** If branch is in a different repository */
    isInDifferentRepo?: boolean;
    /** Repository name where the branch lives */
    repositoryName?: string;
    /** Repository path where the branch lives */
    repositoryPath?: string;
  };
  allBranches?: {
    branches: string[];
    currentBranch: string | null;
    suggestions: string[];
  };
}

export const BranchManager: React.FC<BranchManagerProps> = ({
  ticketId,
  statusType,
  onCheckoutBranch,
  onAssociateBranch,
  onRemoveAssociation,
  onLoadBranchInfo,
  onLoadAllBranches,
  onOpenInRepository,
  branchInfo,
  allBranches,
}) => {
  const [selectedBranch, setSelectedBranch] = useState("");
  const [filterText, setFilterText] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Load branch info when component mounts or ticketId changes
  // Note: intentionally omitting callback from deps to avoid infinite loops
  useEffect(() => {
    onLoadBranchInfo(ticketId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ticketId]);

  // Load all branches when entering edit mode
  // Note: intentionally omitting callback from deps to avoid infinite loops
  useEffect(() => {
    if (isEditing && !allBranches) {
      onLoadAllBranches();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing, allBranches]);

  const handleAssociate = () => {
    if (selectedBranch.trim()) {
      onAssociateBranch(ticketId, selectedBranch.trim());
      setSelectedBranch("");
      setFilterText("");
      setIsEditing(false);
      setShowDropdown(false);
    }
  };

  const handleRemove = () => {
    onRemoveAssociation(ticketId);
  };

  const handleCheckout = () => {
    onCheckoutBranch(ticketId);
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
    if (!allBranches) return <GitBranch size={14} />;
    
    const { currentBranch, suggestions } = allBranches;
    
    if (branch === currentBranch) return <Check size={14} />;
    if (suggestions.includes(branch)) return <Lightbulb size={14} />;
    return <GitBranch size={14} />;
  };

  const getBranchLabel = (branch: string) => {
    if (!allBranches) return "";
    
    const { currentBranch, suggestions } = allBranches;
    
    if (branch === currentBranch) return " (current)";
    if (suggestions.includes(branch)) return " (suggested)";
    return "";
  };

  // Only show for in-progress tickets
  const isInProgress = statusType === "started";

  if (!isInProgress) {
    return null;
  }

  const filteredBranches = getFilteredBranches();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.title}>
          <GitBranch size={16} className={styles.icon} />
          Branch
        </div>
      </div>

      {branchInfo?.branchName ? (
        <div className={styles.branchInfo}>
          <div className={styles.branchName}>
            <GitBranch size={14} className={styles.branchIcon} />
            <span>{branchInfo.branchName}</span>
          </div>

          {/* Branch is in a different repository */}
          {branchInfo.isInDifferentRepo && branchInfo.repositoryName && (
            <div className={styles.differentRepo}>
              <FolderOpen size={14} className={styles.repoIcon} />
              <span>Branch is in <strong>{branchInfo.repositoryName}</strong></span>
            </div>
          )}

          {/* Branch doesn't exist and is NOT in a different repo (truly deleted) */}
          {!branchInfo.exists && !branchInfo.isInDifferentRepo && (
            <div className={styles.warning}>
              <AlertTriangle size={14} className={styles.warningIcon} />
              <span>Branch no longer exists in repository</span>
            </div>
          )}

          <div className={styles.actions}>
            {/* Show "Open Repository" button if branch is in different repo */}
            {branchInfo.isInDifferentRepo && branchInfo.repositoryPath && onOpenInRepository && (
              <button
                className={styles.checkoutButton}
                onClick={() => onOpenInRepository(ticketId, branchInfo.repositoryPath!)}
              >
                <FolderOpen size={14} />
                Open in {branchInfo.repositoryName}
              </button>
            )}
            
            {/* Show "Checkout Branch" only if branch exists in current repo */}
            {branchInfo.exists && !branchInfo.isInDifferentRepo && (
              <button
                className={styles.checkoutButton}
                onClick={handleCheckout}
              >
                <ExternalLink size={14} />
                Checkout Branch
              </button>
            )}
            <button className={styles.removeButton} onClick={handleRemove}>
              <Trash2 size={14} />
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
                <Plus size={14} />
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

