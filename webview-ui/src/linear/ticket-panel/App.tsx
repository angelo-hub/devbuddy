import React, { useState, useEffect } from "react";
import { useVSCode } from "@shared/hooks/useVSCode";
import {
  TicketPanelMessageFromWebview,
  TicketPanelMessageFromExtension,
  LinearIssue,
  WorkflowState,
  LinearUser,
} from "../../shared/types/messages";
import { TicketHeader } from "./components/TicketHeader";
import { TicketMetadata } from "./components/TicketMetadata";
import { TicketLabels } from "./components/TicketLabels";
import { TicketDescription } from "./components/TicketDescription";
import { StatusSelector } from "./components/StatusSelector";
import { AssigneeSelector } from "./components/AssigneeSelector";
import { CommentForm } from "./components/CommentForm";
import { ActionButtons } from "./components/ActionButtons";
import { AttachedPRs } from "./components/AttachedPRs";
import { SubIssues } from "./components/SubIssues";
import { Comments } from "./components/Comments";
import { BranchManager } from "./components/BranchManager";
import styles from "./App.module.css";

// Get initial state from window object (passed from extension)
declare global {
  interface Window {
    __LINEAR_INITIAL_STATE__?: {
      issue: LinearIssue;
      workflowStates: WorkflowState[];
      users?: LinearUser[];
    };
  }
}

function App() {
  const { postMessage, onMessage } = useVSCode<
    TicketPanelMessageFromExtension,
    TicketPanelMessageFromWebview
  >();

  const [issue, setIssue] = useState<LinearIssue | null>(
    window.__LINEAR_INITIAL_STATE__?.issue || null
  );
  const [workflowStates, setWorkflowStates] = useState<WorkflowState[]>(
    window.__LINEAR_INITIAL_STATE__?.workflowStates || []
  );
  const [users, setUsers] = useState<LinearUser[]>(
    window.__LINEAR_INITIAL_STATE__?.users || []
  );
  const [branchInfo, setBranchInfo] = useState<{
    branchName: string | null;
    exists: boolean;
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

        case "workflowStates":
          setWorkflowStates(message.states);
          break;

        case "usersLoaded":
          setUsers(message.users);
          break;

        case "branchInfo":
          setBranchInfo({
            branchName: message.branchName,
            exists: message.exists,
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

  const handleUpdateStatus = (stateId: string) => {
    postMessage({ command: "updateStatus", stateId });
  };

  const handleAddComment = (body: string) => {
    postMessage({ command: "addComment", body });
  };

  const handleUpdateTitle = (title: string) => {
    postMessage({ command: "updateTitle", title });
  };

  const handleUpdateDescription = (description: string) => {
    postMessage({ command: "updateDescription", description });
  };

  const handleUpdateAssignee = (assigneeId: string | null) => {
    postMessage({ command: "updateAssignee", assigneeId });
  };

  const handleLoadUsers = (teamId?: string) => {
    postMessage({ command: "loadUsers", teamId });
  };

  const handleSearchUsers = (searchTerm: string) => {
    postMessage({ command: "searchUsers", searchTerm });
  };

  const handleOpenInLinear = () => {
    postMessage({ command: "openInLinear" });
  };

  const handleRefresh = () => {
    postMessage({ command: "refresh" });
  };

  const handleOpenIssue = (issueId: string) => {
    postMessage({ command: "openIssue", issueId });
  };

  const handleCheckoutBranch = (ticketId: string) => {
    postMessage({ command: "checkoutBranch", ticketId });
  };

  const handleAssociateBranch = (ticketId: string, branchName: string) => {
    postMessage({ command: "associateBranch", ticketId, branchName });
    // Refresh branch info after associating
    setTimeout(() => {
      handleLoadBranchInfo(ticketId);
    }, 100);
  };

  const handleRemoveAssociation = (ticketId: string) => {
    postMessage({ command: "removeAssociation", ticketId });
    // Refresh branch info after removing
    setTimeout(() => {
      handleLoadBranchInfo(ticketId);
    }, 100);
  };

  const handleLoadBranchInfo = (ticketId: string) => {
    postMessage({ command: "loadBranchInfo", ticketId });
  };

  const handleLoadAllBranches = () => {
    postMessage({ command: "loadAllBranches" });
  };

  if (!issue) {
    return (
      <div className={styles.container}>
        <p className={styles.emptyState}>No ticket selected</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <TicketHeader
        identifier={issue.identifier}
        title={issue.title}
        statusName={issue.state.name}
        statusType={issue.state.type}
        priority={issue.priority}
        creator={issue.creator}
        assignee={issue.assignee}
        url={issue.url}
        onUpdateTitle={handleUpdateTitle}
      />

      <StatusSelector
        states={workflowStates}
        currentStateId={issue.state.id}
        onUpdate={handleUpdateStatus}
      />

      <AssigneeSelector
        currentAssignee={issue.assignee}
        users={users}
        onUpdateAssignee={handleUpdateAssignee}
        onLoadUsers={handleLoadUsers}
        onSearchUsers={handleSearchUsers}
      />

      <ActionButtons
        onOpenInLinear={handleOpenInLinear}
        onRefresh={handleRefresh}
      />

      <BranchManager
        ticketId={issue.identifier}
        statusType={issue.state.type}
        onCheckoutBranch={handleCheckoutBranch}
        onAssociateBranch={handleAssociateBranch}
        onRemoveAssociation={handleRemoveAssociation}
        onLoadBranchInfo={handleLoadBranchInfo}
        onLoadAllBranches={handleLoadAllBranches}
        branchInfo={branchInfo || undefined}
        allBranches={allBranches || undefined}
      />

      <TicketMetadata
        createdAt={issue.createdAt}
        updatedAt={issue.updatedAt}
        projectName={issue.project?.name}
      />

      {issue.labels && issue.labels.length > 0 && (
        <>
          <TicketLabels labels={issue.labels} />
          <div className={styles.divider} />
        </>
      )}

      <AttachedPRs attachments={issue.attachments} />

      {issue.attachments && issue.attachments.nodes.length > 0 && (
        <div className={styles.divider} />
      )}

      <SubIssues 
        childrenIssues={issue.children} 
        parent={issue.parent} 
        onOpenIssue={handleOpenIssue}
      />

      {((issue.children && issue.children.nodes.length > 0) || issue.parent) && (
        <div className={styles.divider} />
      )}

      <TicketDescription description={issue.description} onUpdateDescription={handleUpdateDescription} />

      <div className={styles.divider} />

      <Comments comments={issue.comments} />

      <div className={styles.divider} />

      <CommentForm onSubmit={handleAddComment} />
    </div>
  );
}

export default App;

