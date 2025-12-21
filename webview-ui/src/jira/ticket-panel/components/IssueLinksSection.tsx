import React, { useState, useEffect, useCallback } from "react";
import { Link2, ArrowRight, Ban, GitMerge, Copy, AlertCircle, Plus, X, Search, Check } from "lucide-react";
import styles from "./IssueLinksSection.module.css";

export interface IssueLink {
  id: string;
  type: {
    id: string;
    name: string;
    inward: string;  // e.g., "is blocked by"
    outward: string; // e.g., "blocks"
  };
  direction: "inward" | "outward";
  linkedIssue: {
    id: string;
    key: string;
    summary: string;
    status: {
      id: string;
      name: string;
      statusCategory?: {
        key: string;
        colorName: string;
      };
    };
    issueType: {
      id: string;
      name: string;
      iconUrl?: string;
    };
  };
}

export interface IssueLinkType {
  id: string;
  name: string;
  inward: string;
  outward: string;
}

export interface IssueSearchResult {
  id: string;
  key: string;
  summary: string;
  status: {
    name: string;
    statusCategory?: {
      key: string;
    };
  };
}

interface IssueLinksSectionProps {
  issueLinks: IssueLink[];
  currentIssueKey: string;
  linkTypes?: IssueLinkType[];
  searchResults?: IssueSearchResult[];
  onOpenLinkedIssue?: (issueKey: string) => void;
  onSearchIssues?: (searchTerm: string) => void;
  onLoadLinkTypes?: () => void;
  onCreateLink?: (targetIssueKey: string, linkTypeName: string, isOutward: boolean) => void;
  onDeleteLink?: (linkId: string) => void;
}

// Get the relationship label based on direction
function getRelationshipLabel(link: IssueLink): string {
  return link.direction === "inward" ? link.type.inward : link.type.outward;
}

// Get icon based on link type
function getLinkIcon(linkTypeName: string): React.ReactNode {
  const name = linkTypeName.toLowerCase();
  
  if (name.includes("block")) {
    return <Ban size={14} className={styles.linkTypeIcon} />;
  }
  if (name.includes("duplicate") || name.includes("clone")) {
    return <Copy size={14} className={styles.linkTypeIcon} />;
  }
  if (name.includes("cause") || name.includes("problem")) {
    return <AlertCircle size={14} className={styles.linkTypeIcon} />;
  }
  if (name.includes("relate") || name.includes("epic")) {
    return <GitMerge size={14} className={styles.linkTypeIcon} />;
  }
  
  return <Link2 size={14} className={styles.linkTypeIcon} />;
}

// Get status category class for coloring
function getStatusCategoryClass(statusCategory?: { key: string }): string {
  if (!statusCategory) return styles.statusDefault;
  
  switch (statusCategory.key) {
    case "done":
      return styles.statusDone;
    case "indeterminate":
      return styles.statusInProgress;
    case "new":
    default:
      return styles.statusTodo;
  }
}

// Group links by relationship type for better organization
function groupLinksByType(links: IssueLink[]): Map<string, IssueLink[]> {
  const grouped = new Map<string, IssueLink[]>();
  
  for (const link of links) {
    const label = getRelationshipLabel(link);
    const existing = grouped.get(label) || [];
    existing.push(link);
    grouped.set(label, existing);
  }
  
  return grouped;
}

export const IssueLinksSection: React.FC<IssueLinksSectionProps> = ({ 
  issueLinks, 
  currentIssueKey,
  linkTypes,
  searchResults,
  onOpenLinkedIssue,
  onSearchIssues,
  onLoadLinkTypes,
  onCreateLink,
  onDeleteLink,
}) => {
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [selectedLinkType, setSelectedLinkType] = useState<IssueLinkType | null>(null);
  const [isOutward, setIsOutward] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<IssueSearchResult | null>(null);

  // Load link types when opening add form
  useEffect(() => {
    if (isAddingLink && onLoadLinkTypes && (!linkTypes || linkTypes.length === 0)) {
      onLoadLinkTypes();
    }
  }, [isAddingLink, onLoadLinkTypes, linkTypes]);

  // Set default link type when types are loaded
  useEffect(() => {
    if (linkTypes && linkTypes.length > 0 && !selectedLinkType) {
      setSelectedLinkType(linkTypes[0]);
    }
  }, [linkTypes, selectedLinkType]);

  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 2 && onSearchIssues) {
      const timeoutId = setTimeout(() => {
        onSearchIssues(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, onSearchIssues]);

  // Filter out current issue and already linked issues from search results
  const linkedIssueKeys = new Set(issueLinks?.map(link => link.linkedIssue.key) || []);
  const filteredSearchResults = (searchResults || []).filter(
    issue => issue.key !== currentIssueKey && !linkedIssueKeys.has(issue.key)
  );

  const handleAddLink = useCallback(() => {
    if (selectedIssue && selectedLinkType && onCreateLink) {
      onCreateLink(selectedIssue.key, selectedLinkType.name, isOutward);
      // Reset form
      setSelectedIssue(null);
      setSearchTerm("");
      setIsAddingLink(false);
    }
  }, [selectedIssue, selectedLinkType, isOutward, onCreateLink]);

  const handleCancelAdd = () => {
    setIsAddingLink(false);
    setSelectedIssue(null);
    setSearchTerm("");
  };

  const groupedLinks = groupLinksByType(issueLinks || []);
  
  const handleClick = (e: React.MouseEvent, issueKey: string) => {
    e.preventDefault();
    if (onOpenLinkedIssue) {
      onOpenLinkedIssue(issueKey);
    }
  };

  const hasLinks = issueLinks && issueLinks.length > 0;
  const canAddLinks = onSearchIssues && onCreateLink;

  // Show section if there are links OR if we can add links
  if (!hasLinks && !canAddLinks && !isAddingLink) {
    return null;
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>
        <Link2 size={14} className={styles.headingIcon} />
        <span>Linked Issues {hasLinks && `(${issueLinks.length})`}</span>
        {canAddLinks && !isAddingLink && (
          <button
            className={styles.addButton}
            onClick={() => setIsAddingLink(true)}
            title="Add issue link"
          >
            <Plus size={14} />
          </button>
        )}
      </h3>
      
      {!hasLinks && !isAddingLink && (
        <p className={styles.emptyState}>No linked issues</p>
      )}

      {hasLinks && (
        <div className={styles.linkGroups}>
          {Array.from(groupedLinks.entries()).map(([relationship, links]) => (
            <div key={relationship} className={styles.linkGroup}>
              <div className={styles.relationshipLabel}>
                {getLinkIcon(links[0].type.name)}
                <span>{relationship}</span>
              </div>
              
              <div className={styles.linksList}>
                {links.map((link) => (
                  <div key={link.id} className={styles.linkItemWrapper}>
                    <a
                      href="#"
                      onClick={(e) => handleClick(e, link.linkedIssue.key)}
                      className={styles.linkItem}
                    >
                      <div className={styles.linkItemHeader}>
                        <div className={styles.issueInfo}>
                          {link.linkedIssue.issueType.iconUrl && (
                            <img 
                              src={link.linkedIssue.issueType.iconUrl} 
                              alt={link.linkedIssue.issueType.name}
                              className={styles.issueTypeIcon}
                            />
                          )}
                          <span className={styles.issueKey}>{link.linkedIssue.key}</span>
                          <span className={`${styles.statusBadge} ${getStatusCategoryClass(link.linkedIssue.status.statusCategory)}`}>
                            {link.linkedIssue.status.name}
                          </span>
                        </div>
                        <ArrowRight size={14} className={styles.openArrow} />
                      </div>
                      <div className={styles.issueSummary}>{link.linkedIssue.summary}</div>
                    </a>
                    {onDeleteLink && (
                      <button
                        className={styles.deleteButton}
                        onClick={() => onDeleteLink(link.id)}
                        title="Remove link"
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add link form */}
      {isAddingLink && (
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <label>Link type:</label>
            <div className={styles.linkTypeSelector}>
              <select
                value={selectedLinkType?.id || ""}
                onChange={(e) => {
                  const type = linkTypes?.find(t => t.id === e.target.value);
                  setSelectedLinkType(type || null);
                }}
                className={styles.typeSelect}
              >
                {linkTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
              {selectedLinkType && (
                <div className={styles.directionToggle}>
                  <button
                    className={`${styles.directionButton} ${isOutward ? styles.active : ""}`}
                    onClick={() => setIsOutward(true)}
                    title={selectedLinkType.outward}
                  >
                    {selectedLinkType.outward}
                  </button>
                  <button
                    className={`${styles.directionButton} ${!isOutward ? styles.active : ""}`}
                    onClick={() => setIsOutward(false)}
                    title={selectedLinkType.inward}
                  >
                    {selectedLinkType.inward}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className={styles.formRow}>
            <label>Issue:</label>
            {selectedIssue ? (
              <div className={styles.selectedIssue}>
                <span className={`${styles.statusDot} ${getStatusCategoryClass(selectedIssue.status.statusCategory)}`} />
                <span className={styles.issueKey}>{selectedIssue.key}</span>
                <span className={styles.issueSummary}>{selectedIssue.summary}</span>
                <button
                  className={styles.clearButton}
                  onClick={() => {
                    setSelectedIssue(null);
                    setSearchTerm("");
                  }}
                  title="Clear selection"
                >
                  <X size={12} />
                </button>
              </div>
            ) : (
              <div className={styles.searchContainer}>
                <div className={styles.searchInputWrapper}>
                  <Search size={14} className={styles.searchIcon} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search issues by key or summary..."
                    className={styles.searchInput}
                    autoFocus
                  />
                </div>
                {filteredSearchResults.length > 0 && (
                  <div className={styles.searchResults}>
                    {filteredSearchResults.slice(0, 10).map((issue) => (
                      <button
                        key={issue.id}
                        className={styles.searchResultItem}
                        onClick={() => setSelectedIssue(issue)}
                      >
                        <span className={`${styles.statusDot} ${getStatusCategoryClass(issue.status.statusCategory)}`} />
                        <span className={styles.issueKey}>{issue.key}</span>
                        <span className={styles.issueSummary}>{issue.summary}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              className={styles.cancelButton}
              onClick={handleCancelAdd}
            >
              Cancel
            </button>
            <button
              className={styles.submitButton}
              onClick={handleAddLink}
              disabled={!selectedIssue || !selectedLinkType}
            >
              <Check size={14} />
              Add Link
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

