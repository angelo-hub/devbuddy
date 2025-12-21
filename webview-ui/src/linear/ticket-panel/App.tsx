import React, { useEffect } from "react";
import { TicketHeader } from "./components/TicketHeader";
import { TicketMetadata } from "./components/TicketMetadata";
import { TicketDescription } from "./components/TicketDescription";
import { StatusSelector } from "./components/StatusSelector";
import { AssigneeSelector } from "./components/AssigneeSelector";
import { LabelSelector } from "./components/LabelSelector";
import { CycleSelector } from "./components/CycleSelector";
import { CommentForm } from "./components/CommentForm";
import { ActionButtons } from "./components/ActionButtons";
import { AttachedPRs } from "./components/AttachedPRs";
import { SubIssues } from "./components/SubIssues";
import { Comments } from "./components/Comments";
import { BranchManager } from "./components/BranchManager";
import { IssueRelationsSection } from "./components/IssueRelationsSection";
import {
  useLinearIssue,
  useLinearWorkflowStates,
  useLinearUsers,
  useLinearAvailableLabels,
  useLinearAvailableCycles,
  useLinearBranchInfo,
  useLinearAllBranches,
  useLinearIssueSearchResults,
  useLinearTicketActions,
  LinearLabel,
} from "./store";
import styles from "./App.module.css";

// Helper to extract labels from either array or { nodes: [] } format
function extractLabels(
  labels:
    | LinearLabel[]
    | { nodes: LinearLabel[] }
    | undefined
): LinearLabel[] {
  if (!labels) {
    return [];
  }
  if (Array.isArray(labels)) {
    return labels;
  }
  if ("nodes" in labels) {
    return labels.nodes;
  }
  return [];
}

function App() {
  // State from store (each selector only re-renders when its specific state changes)
  const issue = useLinearIssue();
  const workflowStates = useLinearWorkflowStates();
  const users = useLinearUsers();
  const availableLabels = useLinearAvailableLabels();
  const availableCycles = useLinearAvailableCycles();
  const branchInfo = useLinearBranchInfo();
  const allBranches = useLinearAllBranches();
  const issueSearchResults = useLinearIssueSearchResults();

  // Actions from store (stable references)
  const {
    init,
    updateStatus,
    addComment,
    updateTitle,
    updateDescription,
    updateAssignee,
    updateLabels,
    updateCycle,
    loadUsers,
    searchUsers,
    openInLinear,
    refresh,
    openIssue,
    checkoutBranch,
    associateBranch,
    removeAssociation,
    loadBranchInfo,
    loadAllBranches,
    openInRepository,
    loadLabels,
    loadCycles,
    searchIssues,
    createRelation,
    deleteRelation,
  } = useLinearTicketActions();

  // Initialize store and set up message listener
  useEffect(() => {
    return init();
  }, [init]);

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
        onUpdateTitle={updateTitle}
      />

      <StatusSelector
        states={workflowStates}
        currentStateId={issue.state.id}
        onUpdate={updateStatus}
      />

      <AssigneeSelector
        currentAssignee={issue.assignee}
        users={users}
        onUpdateAssignee={updateAssignee}
        onLoadUsers={loadUsers}
        onSearchUsers={searchUsers}
      />

      <ActionButtons onOpenInLinear={openInLinear} onRefresh={refresh} />

      <BranchManager
        ticketId={issue.identifier}
        statusType={issue.state.type}
        onCheckoutBranch={checkoutBranch}
        onAssociateBranch={associateBranch}
        onRemoveAssociation={removeAssociation}
        onLoadBranchInfo={loadBranchInfo}
        onLoadAllBranches={loadAllBranches}
        onOpenInRepository={openInRepository}
        branchInfo={branchInfo || undefined}
        allBranches={allBranches || undefined}
      />

      <TicketMetadata
        createdAt={issue.createdAt}
        updatedAt={issue.updatedAt}
        projectName={issue.project?.name}
      />

      <LabelSelector
        currentLabels={extractLabels(issue.labels)}
        availableLabels={availableLabels}
        onUpdateLabels={updateLabels}
        onLoadLabels={loadLabels}
        teamId={issue.team?.id}
      />

      <CycleSelector
        currentCycle={issue.cycle}
        availableCycles={availableCycles}
        onUpdateCycle={updateCycle}
        onLoadCycles={loadCycles}
        teamId={issue.team?.id}
      />

      <div className={styles.divider} />

      <AttachedPRs attachments={issue.attachments} />

      {issue.attachments && issue.attachments.nodes.length > 0 && (
        <div className={styles.divider} />
      )}

      <SubIssues
        childrenIssues={issue.children}
        parent={issue.parent}
        onOpenIssue={openIssue}
      />

      {((issue.children && issue.children.nodes.length > 0) || issue.parent) && (
        <div className={styles.divider} />
      )}

      <IssueRelationsSection
        relations={issue.relations}
        inverseRelations={issue.inverseRelations}
        currentIssueId={issue.id}
        searchResults={issueSearchResults}
        onOpenIssue={openIssue}
        onSearchIssues={searchIssues}
        onCreateRelation={createRelation}
        onDeleteRelation={deleteRelation}
      />

      <div className={styles.divider} />

      <TicketDescription
        description={issue.description}
        onUpdateDescription={updateDescription}
        onTicketClick={openIssue}
      />

      <div className={styles.divider} />

      <Comments comments={issue.comments} onTicketClick={openIssue} />

      <div className={styles.divider} />

      <CommentForm onSubmit={addComment} />
    </div>
  );
}

export default App;
