import React, { useEffect } from "react";
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
import { IssueLinksSection } from "./components/IssueLinksSection";
import {
  useJiraIssue,
  useJiraTransitions,
  useJiraUsers,
  useJiraBranchInfo,
  useJiraAllBranches,
  useJiraLinkTypes,
  useJiraIssueSearchResults,
  useJiraTicketActions,
} from "./store";
import styles from "./App.module.css";

function App() {
  // State from store (each selector only re-renders when its specific state changes)
  const issue = useJiraIssue();
  const transitions = useJiraTransitions();
  const users = useJiraUsers();
  const branchInfo = useJiraBranchInfo();
  const allBranches = useJiraAllBranches();
  const linkTypes = useJiraLinkTypes();
  const issueSearchResults = useJiraIssueSearchResults();

  // Actions from store (stable references)
  const {
    init,
    updateStatus,
    addComment,
    updateSummary,
    updateDescription,
    updateAssignee,
    loadUsers,
    searchUsers,
    openInJira,
    refresh,
    copyKey,
    copyUrl,
    openLinkedIssue,
    checkoutBranch,
    associateBranch,
    removeAssociation,
    loadBranchInfo,
    loadAllBranches,
    openInRepository,
    loadLinkTypes,
    searchIssues,
    createLink,
    deleteLink,
  } = useJiraTicketActions();

  // Initialize store and set up message listener
  useEffect(() => {
    return init();
  }, [init]);

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
        onUpdateSummary={updateSummary}
      />

      <StatusSelector
        transitions={transitions}
        currentStatusId={issue.status.id}
        currentStatusName={issue.status.name}
        onUpdate={updateStatus}
      />

      <AssigneeSelector
        currentAssignee={issue.assignee}
        users={users}
        onUpdateAssignee={updateAssignee}
        onLoadUsers={() => loadUsers(issue.project.key)}
        onSearchUsers={searchUsers}
      />

      <ActionButtons
        onOpenInJira={openInJira}
        onRefresh={refresh}
        onCopyKey={copyKey}
        onCopyUrl={copyUrl}
      />

      <BranchManager
        ticketKey={issue.key}
        statusCategory={issue.status.statusCategory.key}
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
      <IssueLinksSection
        issueLinks={issue.issueLinks || []}
        currentIssueKey={issue.key}
        linkTypes={linkTypes}
        searchResults={issueSearchResults}
        onOpenLinkedIssue={openLinkedIssue}
        onSearchIssues={searchIssues}
        onLoadLinkTypes={loadLinkTypes}
        onCreateLink={createLink}
        onDeleteLink={deleteLink}
      />

      <div className={styles.divider} />

      <TicketDescription
        description={issue.description}
        onUpdateDescription={updateDescription}
      />

      <div className={styles.divider} />

      <Comments comments={issue.comments || []} />

      <div className={styles.divider} />

      <CommentForm onSubmit={addComment} />
    </div>
  );
}

export default App;
