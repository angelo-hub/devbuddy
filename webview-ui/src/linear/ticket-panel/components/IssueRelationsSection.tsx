import React, { useState, useEffect, useCallback } from "react";
import { Link, ArrowRight, Ban, Copy, Plus, X, Search, Check } from "lucide-react";
import {
  LinearIssueRelation,
  LinearIssueRelationType,
  LinearIssueSearchResult,
} from "../../../shared/types/messages";
import styles from "./IssueRelationsSection.module.css";

interface IssueRelationsSectionProps {
  /** Relations where the current issue is the source */
  relations?: { nodes: LinearIssueRelation[] };
  /** Inverse relations where the current issue is the target */
  inverseRelations?: { nodes: LinearIssueRelation[] };
  /** Current issue ID (to exclude from search) */
  currentIssueId: string;
  /** Search results for issue search */
  searchResults?: LinearIssueSearchResult[];
  /** Called when user clicks on a linked issue */
  onOpenIssue: (issueId: string) => void;
  /** Called when user searches for issues */
  onSearchIssues: (searchTerm: string) => void;
  /** Called when user creates a relation */
  onCreateRelation: (relatedIssueId: string, type: LinearIssueRelationType) => void;
  /** Called when user deletes a relation */
  onDeleteRelation: (relationId: string) => void;
}

// Map relation types to human-readable labels
const RELATION_LABELS: Record<LinearIssueRelationType, { label: string; icon: React.ReactNode }> = {
  blocks: { label: "Blocks", icon: <Ban size={12} /> },
  blocked_by: { label: "Blocked by", icon: <Ban size={12} /> },
  related: { label: "Related to", icon: <Link size={12} /> },
  duplicate: { label: "Duplicates", icon: <Copy size={12} /> },
  duplicate_of: { label: "Duplicate of", icon: <Copy size={12} /> },
};

// Relation types available for creating new relations
const RELATION_TYPES: { value: LinearIssueRelationType; label: string }[] = [
  { value: "blocks", label: "Blocks" },
  { value: "blocked_by", label: "Is blocked by" },
  { value: "related", label: "Related to" },
  { value: "duplicate", label: "Duplicates" },
  { value: "duplicate_of", label: "Is duplicate of" },
];

// Status color mapping
function getStatusColor(stateType: string): string {
  switch (stateType) {
    case "completed":
      return "var(--vscode-testing-iconPassed)";
    case "started":
      return "var(--vscode-charts-blue)";
    case "unstarted":
      return "var(--vscode-charts-yellow)";
    case "backlog":
      return "var(--vscode-descriptionForeground)";
    case "canceled":
    case "cancelled":
      return "var(--vscode-errorForeground)";
    default:
      return "var(--vscode-descriptionForeground)";
  }
}

export const IssueRelationsSection: React.FC<IssueRelationsSectionProps> = ({
  relations,
  inverseRelations,
  currentIssueId,
  searchResults,
  onOpenIssue,
  onSearchIssues,
  onCreateRelation,
  onDeleteRelation,
}) => {
  const [isAddingRelation, setIsAddingRelation] = useState(false);
  const [selectedType, setSelectedType] = useState<LinearIssueRelationType>("related");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedIssue, setSelectedIssue] = useState<LinearIssueSearchResult | null>(null);

  // Combine all relations
  const allRelations = [
    ...(relations?.nodes || []),
    ...(inverseRelations?.nodes || []),
  ];

  // Group relations by type
  const relationsByType = allRelations.reduce((acc, relation) => {
    if (!acc[relation.type]) {
      acc[relation.type] = [];
    }
    acc[relation.type].push(relation);
    return acc;
  }, {} as Record<LinearIssueRelationType, LinearIssueRelation[]>);

  // Filter search results to exclude current issue and already linked issues
  const linkedIssueIds = new Set(allRelations.map(r => r.relatedIssue.id));
  const filteredSearchResults = (searchResults || []).filter(
    issue => issue.id !== currentIssueId && !linkedIssueIds.has(issue.id)
  );

  // Debounced search
  useEffect(() => {
    if (searchTerm.length >= 2) {
      const timeoutId = setTimeout(() => {
        onSearchIssues(searchTerm);
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [searchTerm, onSearchIssues]);

  const handleAddRelation = useCallback(() => {
    if (selectedIssue) {
      onCreateRelation(selectedIssue.id, selectedType);
      // Reset form
      setSelectedIssue(null);
      setSearchTerm("");
      setIsAddingRelation(false);
    }
  }, [selectedIssue, selectedType, onCreateRelation]);

  const handleCancelAdd = () => {
    setIsAddingRelation(false);
    setSelectedIssue(null);
    setSearchTerm("");
  };

  if (allRelations.length === 0 && !isAddingRelation) {
    return (
      <div className={styles.section}>
        <div className={styles.header}>
          <Link size={14} />
          <span>Issue Links</span>
          <button
            className={styles.addButton}
            onClick={() => setIsAddingRelation(true)}
            title="Add issue link"
          >
            <Plus size={14} />
          </button>
        </div>
        <p className={styles.emptyState}>No linked issues</p>
      </div>
    );
  }

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <Link size={14} />
        <span>Issue Links</span>
        {!isAddingRelation && (
          <button
            className={styles.addButton}
            onClick={() => setIsAddingRelation(true)}
            title="Add issue link"
          >
            <Plus size={14} />
          </button>
        )}
      </div>

      {/* Existing relations */}
      {Object.entries(relationsByType).map(([type, typeRelations]) => (
        <div key={type} className={styles.relationGroup}>
          <div className={styles.groupHeader}>
            {RELATION_LABELS[type as LinearIssueRelationType]?.icon}
            <span>{RELATION_LABELS[type as LinearIssueRelationType]?.label || type}</span>
          </div>
          <div className={styles.relationsList}>
            {typeRelations.map((relation) => (
              <div key={relation.id} className={styles.relationItem}>
                <button
                  className={styles.issueLink}
                  onClick={() => onOpenIssue(relation.relatedIssue.id)}
                  title={relation.relatedIssue.title}
                >
                  <span
                    className={styles.statusDot}
                    style={{ backgroundColor: getStatusColor(relation.relatedIssue.state.type) }}
                  />
                  <span className={styles.issueIdentifier}>
                    {relation.relatedIssue.identifier}
                  </span>
                  <span className={styles.issueTitle}>{relation.relatedIssue.title}</span>
                </button>
                <button
                  className={styles.deleteButton}
                  onClick={() => onDeleteRelation(relation.id)}
                  title="Remove link"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add relation form */}
      {isAddingRelation && (
        <div className={styles.addForm}>
          <div className={styles.formRow}>
            <label>Link type:</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as LinearIssueRelationType)}
              className={styles.typeSelect}
            >
              {RELATION_TYPES.map((rt) => (
                <option key={rt.value} value={rt.value}>
                  {rt.label}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formRow}>
            <label>Issue:</label>
            {selectedIssue ? (
              <div className={styles.selectedIssue}>
                <span
                  className={styles.statusDot}
                  style={{ backgroundColor: getStatusColor(selectedIssue.state.type) }}
                />
                <span className={styles.issueIdentifier}>{selectedIssue.identifier}</span>
                <span className={styles.issueTitle}>{selectedIssue.title}</span>
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
                    placeholder="Search issues by ID or title..."
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
                        <span
                          className={styles.statusDot}
                          style={{ backgroundColor: getStatusColor(issue.state.type) }}
                        />
                        <span className={styles.issueIdentifier}>{issue.identifier}</span>
                        <span className={styles.issueTitle}>{issue.title}</span>
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
              onClick={handleAddRelation}
              disabled={!selectedIssue}
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

