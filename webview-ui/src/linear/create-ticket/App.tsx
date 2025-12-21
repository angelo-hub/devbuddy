import React, { useEffect } from "react";
import { TicketForm } from "./components/TicketForm";
import {
  useLinearTeams,
  useLinearTemplates,
  useLinearWorkflowStates,
  useLinearLabels,
  useLinearProjects,
  useLinearUsers,
  useIsCreating,
  useDraftData,
  useLinearCreateTicketActions,
} from "./store";
import styles from "./App.module.css";

function App() {
  // State from store
  const teams = useLinearTeams();
  const templates = useLinearTemplates();
  const workflowStates = useLinearWorkflowStates();
  const labels = useLinearLabels();
  const projects = useLinearProjects();
  const users = useLinearUsers();
  const isCreating = useIsCreating();
  const draftData = useDraftData();

  // Actions from store
  const { init, loadTeamData, createIssue } = useLinearCreateTicketActions();

  // Initialize store
  useEffect(() => {
    return init();
  }, [init]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Create New Ticket</h1>
      </div>

      <TicketForm
        teams={teams}
        templates={templates}
        workflowStates={workflowStates}
        labels={labels}
        projects={projects}
        users={users}
        onTeamChange={loadTeamData}
        onSubmit={createIssue}
        isSubmitting={isCreating}
        draftData={draftData}
      />
    </div>
  );
}

export default App;
