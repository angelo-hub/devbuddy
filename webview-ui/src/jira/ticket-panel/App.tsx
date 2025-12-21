import React, { useState, useEffect } from "react";
import { useVSCode } from "@shared/hooks/useVSCode";
import { TicketHeader } from "./components/TicketHeader";
import { TicketMetadata } from "./components/TicketMetadata";
import { TicketDescription } from "./components/TicketDescription";
import { StatusSelector } from "./components/StatusSelector";
import { AssigneeSelector } from "./components/AssigneeSelector";
import { Comments } from "./components/Comments";
import { CommentForm } from "./components/CommentForm";
import { ActionButtons } from "./components/ActionButtons";
import { SubtasksSection } from "./components/SubtasksSection";
import { BranchManager } from "./components/BranchManager";
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
    avatarUrls?: {
      "48x48"?: string;
    };
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
  comments?: Array<{
    id: string;
    body: string;
    author: {
      accountId: string;
      displayName: string;
      avatarUrls?: {
        "48x48"?: string;
      };
    };
    created: string;
    updated: string;
  }>;
  subtasks?: Array<{
    id: string;
    key: string;
    summary: string;
    status: {
      id: string;
      name: string;
    };
    issueType: {
      id: string;
      name: string;
    };
  }>;
  attachments?: Array<{
    id: string;
    filename: string;
    mimeType: string;
    size: number;
    content: string;
    thumbnail?: string;
  }>;
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
  | { command: "usersLoaded"; users: JiraUser[] }
  | { command: "branchInfo"; branchName: string | null; exists: boolean; isInDifferentRepo?: boolean; repositoryName?: string; repositoryPath?: string }
  | { command: "allBranchesLoaded"; branches: string[]; currentBranch: string | null; suggestions: string[] };

type MessageFromWebview =
  | { command: "updateStatus"; transitionId: string }
  | { command: "addComment"; body: string }
  | { command: "updateSummary"; summary: string }
  | { command: "updateDescription"; description: string }
  | { command: "updateAssignee"; assigneeId: string | null }
  | { command: "loadTransitions" }
  | { command: "loadUsers"; projectKey: string }
  | { command: "searchUsers"; searchTerm: string; projectKey?: string }
  | { command: "openInJira" }
  | { command: "refresh" }
  | { command: "copyKey" }
  | { command: "copyUrl" }
  | { command: "checkoutBranch"; ticketKey: string }
  | { command: "associateBranch"; ticketKey: string; branchName: string }
  | { command: "removeAssociation"; ticketKey: string }
  | { command: "loadBranchInfo"; ticketKey: string }
  | { command: "loadAllBranches" }
  | { command: "openInRepository"; ticketKey: string; repositoryPath: string };

// Get initial state from window object (passed from extension)
declare global {
  interface Window {
    __JIRA_INITIAL_STATE__?: {
      issue: JiraIssue;
    };
  }
}

function App() {
  const { postMessage, onMessage } = useVSCode<
    MessageFromExtension,
    MessageFromWebview
  >();

  const [issue, setIssue] = useState<JiraIssue | null>(
    window.__JIRA_INITIAL_STATE__?.issue || null
  );
  const [transitions, setTransitions] = useState<JiraTransition[]>([]);
  const [users, setUsers] = useState<JiraUser[]>([]);
  const [branchInfo, setBranchInfo] = useState<{
    branchName: string | null;
    exists: boolean;
    isInDifferentRepo?: boolean;
    repositoryName?: string;
    repositoryPath?: string;
  } | null>(null);
  const [allBranches, setAllBranches] = useState<{
    branches: string[];
    currentBranch: string | null;
    suggestions: string[];
  } | null>(null);

  // Handle messages from extension
  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case "updateIssue":
          setIssue(message.issue);
          break;

        case "transitionsLoaded":
          setTransitions(message.transitions);
          break;

        case "usersLoaded":
          setUsers(message.users);
          break;

        case "branchInfo":
          setBranchInfo({
            branchName: message.branchName,
            exists: message.exists,
            isInDifferentRepo: message.isInDifferentRepo,
            repositoryName: message.repositoryName,
            repositoryPath: message.repositoryPath,
          });
          break;

        case "allBranchesLoaded":
          setAllBranches({
            branches: message.branches,
            currentBranch: message.currentBranch,
            suggestions: message.suggestions,
          });
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

  const handleAddComment = (body: string) => {
    postMessage({ command: "addComment", body });
  };

  const handleUpdateSummary = (summary: string) => {
    postMessage({ command: "updateSummary", summary });
  };

  const handleUpdateDescription = (description: string) => {
    postMessage({ command: "updateDescription", description });
  };

  const handleUpdateAssignee = (assigneeId: string | null) => {
    postMessage({ command: "updateAssignee", assigneeId });
  };

  const handleLoadUsers = (projectKey: string) => {
    postMessage({ command: "loadUsers", projectKey });
  };

  const handleSearchUsers = (searchTerm: string) => {
    postMessage({ command: "searchUsers", searchTerm, projectKey: issue?.project.key });
  };

  const handleOpenInJira = () => {
    postMessage({ command: "openInJira" });
  };

  const handleRefresh = () => {
    postMessage({ command: "refresh" });
  };

  const handleCheckoutBranch = (ticketKey: string) => {
    postMessage({ command: "checkoutBranch", ticketKey });
  };

  const handleAssociateBranch = (ticketKey: string, branchName: string) => {
    postMessage({ command: "associateBranch", ticketKey, branchName });
    // Refresh branch info after associating
    setTimeout(() => {
      handleLoadBranchInfo(ticketKey);
    }, 100);
  };

  const handleRemoveAssociation = (ticketKey: string) => {
    postMessage({ command: "removeAssociation", ticketKey });
    // Refresh branch info after removing
    setTimeout(() => {
      handleLoadBranchInfo(ticketKey);
    }, 100);
  };

  const handleLoadBranchInfo = (ticketKey: string) => {
    postMessage({ command: "loadBranchInfo", ticketKey });
  };

  const handleLoadAllBranches = () => {
    postMessage({ command: "loadAllBranches" });
  };

  const handleOpenInRepository = (ticketKey: string, repositoryPath: string) => {
    postMessage({ command: "openInRepository", ticketKey, repositoryPath });
  };

  const handleCopyKey = () => {
    postMessage({ command: "copyKey" });
  };

  const handleCopyUrl = () => {
    postMessage({ command: "copyUrl" });
  };

  if (!issue) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>Loading issue...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TicketHeader
        issueKey={issue.key}
        summary={issue.summary}
        statusName={issue.status.name}
        statusCategory={issue.status.statusCategory.key}
        issueType={issue.issueType.name}
        issueTypeIcon={issue.issueType.iconUrl}
        priority={issue.priority}
        reporter={issue.reporter}
        assignee={issue.assignee}
        url={issue.url}
        onUpdateSummary={handleUpdateSummary}
      />

      <StatusSelector
        transitions={transitions}
        currentStatusId={issue.status.id}
        currentStatusName={issue.status.name}
        onUpdate={handleUpdateStatus}
      />

      <AssigneeSelector
        currentAssignee={issue.assignee}
        users={users}
        onUpdateAssignee={handleUpdateAssignee}
        onLoadUsers={() => handleLoadUsers(issue.project.key)}
        onSearchUsers={handleSearchUsers}
      />

      <ActionButtons
        onOpenInJira={handleOpenInJira}
        onRefresh={handleRefresh}
        onCopyKey={handleCopyKey}
        onCopyUrl={handleCopyUrl}
      />

      <BranchManager
        ticketKey={issue.key}
        statusCategory={issue.status.statusCategory.key}
        onCheckoutBranch={handleCheckoutBranch}
        onAssociateBranch={handleAssociateBranch}
        onRemoveAssociation={handleRemoveAssociation}
        onLoadBranchInfo={handleLoadBranchInfo}
        onLoadAllBranches={handleLoadAllBranches}
        onOpenInRepository={handleOpenInRepository}
        branchInfo={branchInfo || undefined}
        allBranches={allBranches || undefined}
      />

      <TicketMetadata
        created={issue.created}
        updated={issue.updated}
        projectName={issue.project.name}
        dueDate={issue.dueDate}
        labels={issue.labels}
      />

      {issue.subtasks && issue.subtasks.length > 0 && (
        <>
          <div className={styles.divider} />
          <SubtasksSection subtasks={issue.subtasks} />
        </>
      )}

      <div className={styles.divider} />

      <TicketDescription 
        description={issue.description} 
        onUpdateDescription={handleUpdateDescription} 
      />

      <div className={styles.divider} />

      <Comments comments={issue.comments || []} />

      <div className={styles.divider} />

      <CommentForm onSubmit={handleAddComment} />
    </div>
  );
}

export default App;

