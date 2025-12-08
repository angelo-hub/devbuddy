import React, { useState, useEffect } from "react";
import { useVSCode } from "@shared/hooks/useVSCode";
import { Button } from "@shared/components";
import { TicketForm } from "./components/TicketForm";
import styles from "./App.module.css";

// Message types for Create Ticket Panel
export interface CreateTicketMessageFromExtension {
  command:
    | "teamsLoaded"
    | "templatesLoaded"
    | "teamDataLoaded"
    | "usersLoaded"
    | "issueCreated"
    | "issueCreationFailed"
    | "populateDraft";
  teams?: Array<{ id: string; name: string; key: string }>;
  templates?: Array<{
    id: string;
    name: string;
    description?: string;
    templateData: {
      title?: string;
      description?: string;
      priority?: number;
      labelIds?: string[];
      projectId?: string;
      stateId?: string;
    };
  }>;
  workflowStates?: Array<{
    id: string;
    name: string;
    type: string;
    position?: number;
  }>;
  labels?: Array<{ id: string; name: string; color: string }>;
  projects?: Array<{ id: string; name: string; url?: string; state: string }>;
  users?: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
  issue?: any;
  error?: string;
  data?: {
    title?: string;
    description?: string;
    priority?: string;
    labels?: string[];
    teamId?: string;
  };
}

export interface CreateTicketMessageFromWebview {
  command:
    | "loadTeams"
    | "loadTemplates"
    | "loadTeamData"
    | "loadUsers"
    | "createIssue";
  teamId?: string;
  input?: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
    stateId?: string;
  };
}

function App() {
  const { postMessage, onMessage } = useVSCode<
    CreateTicketMessageFromExtension,
    CreateTicketMessageFromWebview
  >();

  const [teams, setTeams] = useState<
    Array<{ id: string; name: string; key: string }>
  >([]);
  const [templates, setTemplates] = useState<
    Array<{
      id: string;
      name: string;
      description?: string;
      templateData: {
        title?: string;
        description?: string;
        priority?: number;
        labelIds?: string[];
        projectId?: string;
        stateId?: string;
      };
    }>
  >([]);
  const [workflowStates, setWorkflowStates] = useState<
    Array<{ id: string; name: string; type: string; position?: number }>
  >([]);
  const [labels, setLabels] = useState<
    Array<{ id: string; name: string; color: string }>
  >([]);
  const [projects, setProjects] = useState<
    Array<{ id: string; name: string; url?: string; state: string }>
  >([]);
  const [users, setUsers] = useState<
    Array<{ id: string; name: string; email: string; avatarUrl?: string }>
  >([]);
  const [isCreating, setIsCreating] = useState(false);
  const [draftData, setDraftData] = useState<{
    title?: string;
    description?: string;
    priority?: string;
    labels?: string[];
    teamId?: string;
  } | undefined>(undefined);

  // Load teams on mount
  useEffect(() => {
    postMessage({ command: "loadTeams" });
  }, []);

  // Handle messages from extension
  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case "teamsLoaded":
          setTeams(message.teams || []);
          break;

        case "templatesLoaded":
          setTemplates(message.templates || []);
          break;

        case "teamDataLoaded":
          setWorkflowStates(message.workflowStates || []);
          setLabels(message.labels || []);
          setProjects(message.projects || []);
          break;

        case "usersLoaded":
          setUsers(message.users || []);
          break;

        case "issueCreated":
          setIsCreating(false);
          // Panel will be closed by extension
          break;

        case "issueCreationFailed":
          setIsCreating(false);
          break;

        case "populateDraft":
          if (message.data) {
            setDraftData(message.data);
          }
          break;
      }
    });
  }, [onMessage]);

  const handleTeamChange = (teamId: string) => {
    // Load team-specific data
    postMessage({ command: "loadTemplates", teamId });
    postMessage({ command: "loadTeamData", teamId });
    postMessage({ command: "loadUsers", teamId });
  };

  const handleCreateIssue = (input: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
    stateId?: string;
  }) => {
    setIsCreating(true);
    postMessage({ command: "createIssue", input });
  };

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
        onTeamChange={handleTeamChange}
        onSubmit={handleCreateIssue}
        isSubmitting={isCreating}
        draftData={draftData}
      />
    </div>
  );
}

export default App;

