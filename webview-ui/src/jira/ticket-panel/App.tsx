import React, { useState, useEffect } from "react";
import { useVSCode } from "../../shared/hooks/useVSCode";
import styles from "./App.module.css";

// Types for Jira issue data
interface JiraIssue {
  key: string;
  summary: string;
  description: string;
  status: {
    id: string;
    name: string;
    statusCategory: {
      key: string;
      name: string;
      colorName: string;
    };
  };
  issueType: {
    id: string;
    name: string;
    subtask: boolean;
    iconUrl?: string;
  };
  priority: {
    id: string;
    name: string;
    iconUrl?: string;
  } | null;
  assignee: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  } | null;
  reporter: {
    accountId: string;
    displayName: string;
  };
  project: {
    key: string;
    name: string;
  };
  labels: string[];
  created: string;
  updated: string;
  dueDate: string | null;
  url: string;
}

interface JiraTransition {
  id: string;
  name: string;
  to: {
    id: string;
    name: string;
  };
}

interface JiraUser {
  accountId: string;
  displayName: string;
  emailAddress?: string;
  avatarUrls?: {
    "48x48"?: string;
  };
}

type MessageFromExtension =
  | { command: "updateIssue"; issue: JiraIssue }
  | { command: "transitionsLoaded"; transitions: JiraTransition[] }
  | { command: "usersLoaded"; users: JiraUser[] };

type MessageFromWebview =
  | { command: "updateStatus"; transitionId: string }
  | { command: "addComment"; body: string }
  | { command: "updateSummary"; summary: string }
  | { command: "updateDescription"; description: string }
  | { command: "updateAssignee"; assigneeId: string | null }
  | { command: "loadTransitions" }
  | { command: "loadUsers"; projectKey: string }
  | { command: "openInJira" }
  | { command: "refresh" };

function App() {
  const { postMessage, onMessage } = useVSCode<
    MessageFromExtension,
    MessageFromWebview
  >();

  const [issue, setIssue] = useState<JiraIssue | null>(null);
  const [transitions, setTransitions] = useState<JiraTransition[]>([]);
  const [users, setUsers] = useState<JiraUser[]>([]);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedSummary, setEditedSummary] = useState("");
  const [editedDescription, setEditedDescription] = useState("");
  const [commentBody, setCommentBody] = useState("");

  // Handle messages from extension
  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case "updateIssue":
          setIssue(message.issue);
          setEditedSummary(message.issue.summary);
          setEditedDescription(message.issue.description);
          break;

        case "transitionsLoaded":
          setTransitions(message.transitions);
          break;

        case "usersLoaded":
          setUsers(message.users);
          break;
      }
    });
  }, [onMessage]);

  // Load transitions and users when issue loads
  useEffect(() => {
    if (issue) {
      postMessage({ command: "loadTransitions" });
      postMessage({ command: "loadUsers", projectKey: issue.project.key });
    }
  }, [issue?.key]);

  const handleUpdateStatus = (transitionId: string) => {
    postMessage({ command: "updateStatus", transitionId });
  };

  const handleUpdateSummary = () => {
    if (editedSummary.trim() && editedSummary !== issue?.summary) {
      postMessage({ command: "updateSummary", summary: editedSummary.trim() });
    }
    setIsEditingSummary(false);
  };

  const handleUpdateDescription = () => {
    if (editedDescription !== issue?.description) {
      postMessage({
        command: "updateDescription",
        description: editedDescription,
      });
    }
    setIsEditingDescription(false);
  };

  const handleUpdateAssignee = (accountId: string | null) => {
    postMessage({ command: "updateAssignee", assigneeId: accountId });
  };

  const handleAddComment = () => {
    if (commentBody.trim()) {
      postMessage({ command: "addComment", body: commentBody.trim() });
      setCommentBody("");
    }
  };

  if (!issue) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading issue...</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerTop}>
          <div className={styles.issueKey}>{issue.key}</div>
          <button
            className={styles.openButton}
            onClick={() => postMessage({ command: "openInJira" })}
          >
            Open in Jira
          </button>
        </div>

        {/* Summary */}
        {isEditingSummary ? (
          <div className={styles.summaryEdit}>
            <input
              type="text"
              value={editedSummary}
              onChange={(e) => setEditedSummary(e.target.value)}
              onBlur={handleUpdateSummary}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleUpdateSummary();
                if (e.key === "Escape") {
                  setEditedSummary(issue.summary);
                  setIsEditingSummary(false);
                }
              }}
              autoFocus
              className={styles.summaryInput}
            />
          </div>
        ) : (
          <h1
            className={styles.summary}
            onClick={() => setIsEditingSummary(true)}
            title="Click to edit"
          >
            {issue.summary}
          </h1>
        )}
      </div>

      {/* Metadata */}
      <div className={styles.metadata}>
        <div className={styles.metadataItem}>
          <label>Type:</label>
          <span>{issue.issueType.name}</span>
        </div>
        <div className={styles.metadataItem}>
          <label>Priority:</label>
          <span>{issue.priority?.name || "None"}</span>
        </div>
        <div className={styles.metadataItem}>
          <label>Reporter:</label>
          <span>{issue.reporter.displayName}</span>
        </div>
        {issue.dueDate && (
          <div className={styles.metadataItem}>
            <label>Due Date:</label>
            <span>{new Date(issue.dueDate).toLocaleDateString()}</span>
          </div>
        )}
      </div>

      {/* Status Selector */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Status</label>
        <select
          value={issue.status.id}
          onChange={(e) => {
            const transition = transitions.find(
              (t) => t.to.id === e.target.value
            );
            if (transition) {
              handleUpdateStatus(transition.id);
            }
          }}
          className={styles.select}
        >
          <option value={issue.status.id}>{issue.status.name}</option>
          {transitions
            .filter((t) => t.to.id !== issue.status.id)
            .map((transition) => (
              <option key={transition.id} value={transition.to.id}>
                {transition.to.name}
              </option>
            ))}
        </select>
      </div>

      {/* Assignee Selector */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Assignee</label>
        <select
          value={issue.assignee?.accountId || ""}
          onChange={(e) =>
            handleUpdateAssignee(e.target.value || null)
          }
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

      {/* Labels */}
      {issue.labels.length > 0 && (
        <div className={styles.section}>
          <label className={styles.sectionLabel}>Labels</label>
          <div className={styles.labels}>
            {issue.labels.map((label) => (
              <span key={label} className={styles.label}>
                {label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Description */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Description</label>
        {isEditingDescription ? (
          <div className={styles.descriptionEdit}>
            <textarea
              value={editedDescription}
              onChange={(e) => setEditedDescription(e.target.value)}
              onBlur={handleUpdateDescription}
              className={styles.descriptionTextarea}
              rows={10}
            />
            <div className={styles.editActions}>
              <button
                onClick={handleUpdateDescription}
                className={styles.saveButton}
              >
                Save
              </button>
              <button
                onClick={() => {
                  setEditedDescription(issue.description);
                  setIsEditingDescription(false);
                }}
                className={styles.cancelButton}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className={styles.description}
            onClick={() => setIsEditingDescription(true)}
            title="Click to edit"
          >
            {issue.description || "No description"}
          </div>
        )}
      </div>

      {/* Add Comment */}
      <div className={styles.section}>
        <label className={styles.sectionLabel}>Add Comment</label>
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Write a comment..."
          className={styles.commentTextarea}
          rows={4}
        />
        <button
          onClick={handleAddComment}
          disabled={!commentBody.trim()}
          className={styles.addCommentButton}
        >
          Add Comment
        </button>
      </div>

      {/* Refresh Button */}
      <div className={styles.actions}>
        <button
          onClick={() => postMessage({ command: "refresh" })}
          className={styles.refreshButton}
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

export default App;

