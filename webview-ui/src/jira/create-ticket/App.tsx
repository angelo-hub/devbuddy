import React, { useState, useEffect } from "react";
import { useVSCode } from "@shared/hooks/useVSCode";
import { MarkdownEditor } from "@shared/components";
import { markdownToAdf } from "@shared/utils/adfConverter";
import styles from "./App.module.css";

interface JiraProject {
  key: string;
  name: string;
}

interface JiraIssueType {
  id: string;
  name: string;
  subtask: boolean;
}

interface JiraPriority {
  id: string;
  name: string;
}

interface JiraUser {
  accountId: string;
  displayName: string;
}

type MessageFromExtension =
  | { command: "projectsLoaded"; projects: JiraProject[] }
  | { command: "projectMetaLoaded"; issueTypes: JiraIssueType[]; priorities: JiraPriority[] }
  | { command: "usersLoaded"; users: JiraUser[] }
  | { 
      command: "populateDraft"; 
      data: {
        title?: string;
        description?: string;
        priority?: string;
        labels?: string[];
        projectKey?: string;
      };
    };

type MessageFromWebview =
  | { command: "loadProjects" }
  | { command: "loadProjectMeta"; projectKey: string }
  | { command: "loadUsers" }
  | {
      command: "createIssue";
      input: {
        projectKey: string;
        summary: string;
        description: string;
        issueTypeId: string;
        priorityId?: string;
        assigneeId?: string;
        labels?: string[];
      };
    };

function App() {
  const { postMessage, onMessage } = useVSCode<
    MessageFromExtension,
    MessageFromWebview
  >();

  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [priorities, setPriorities] = useState<JiraPriority[]>([]);
  const [users, setUsers] = useState<JiraUser[]>([]);

  const [selectedProject, setSelectedProject] = useState("");
  const [summary, setSummary] = useState("");
  const [description, setDescription] = useState("");
  const [issueTypeId, setIssueTypeId] = useState("");
  const [priorityId, setPriorityId] = useState("");
  const [assigneeId, setAssigneeId] = useState("");
  const [labelsInput, setLabelsInput] = useState("");

  const [isCreating, setIsCreating] = useState(false);

  // Load projects and users on mount
  useEffect(() => {
    postMessage({ command: "loadProjects" });
    postMessage({ command: "loadUsers" });
  }, []);

  // Handle messages from extension
  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case "projectsLoaded":
          setProjects(message.projects);
          break;

        case "projectMetaLoaded":
          setIssueTypes(message.issueTypes.filter((t) => !t.subtask));
          setPriorities(message.priorities);
          break;

        case "usersLoaded":
          setUsers(message.users);
          break;

        case "populateDraft":
          if (message.data) {
            if (message.data.title) setSummary(message.data.title);
            if (message.data.description) setDescription(message.data.description);
            if (message.data.projectKey) setSelectedProject(message.data.projectKey);
            if (message.data.labels) setLabelsInput(message.data.labels.join(", "));
            // Priority will be matched after project metadata loads
            if (message.data.priority) {
              // Store for later when priorities are available
              setTimeout(() => {
                const matchedPriority = priorities.find(
                  (p) => p.name.toLowerCase() === message.data.priority?.toLowerCase()
                );
                if (matchedPriority) setPriorityId(matchedPriority.id);
              }, 500);
            }
          }
          break;
      }
    });
  }, [onMessage, priorities]);

  // Load project metadata when project changes
  useEffect(() => {
    if (selectedProject) {
      postMessage({ command: "loadProjectMeta", projectKey: selectedProject });
    }
  }, [selectedProject]);

  const handleCreate = () => {
    if (!selectedProject || !summary.trim() || !issueTypeId) {
      return;
    }

    setIsCreating(true);

    const labels = labelsInput
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Convert markdown description to ADF for Jira
    const adfDescription = description.trim() 
      ? JSON.stringify(markdownToAdf(description.trim()))
      : "";

    postMessage({
      command: "createIssue",
      input: {
        projectKey: selectedProject,
        summary: summary.trim(),
        description: adfDescription,
        issueTypeId,
        priorityId: priorityId || undefined,
        assigneeId: assigneeId || undefined,
        labels: labels.length > 0 ? labels : undefined,
      },
    });
  };

  const isValid =
    selectedProject && summary.trim() && issueTypeId && !isCreating;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Create New Jira Issue</h1>

      <div className={styles.form}>
        {/* Project */}
        <div className={styles.field}>
          <label className={styles.label}>
            Project <span className={styles.required}>*</span>
          </label>
          <select
            value={selectedProject}
            onChange={(e) => {
              setSelectedProject(e.target.value);
              setIssueTypeId("");
            }}
            className={styles.select}
          >
            <option value="">Select a project</option>
            {projects.map((project) => (
              <option key={project.key} value={project.key}>
                {project.name} ({project.key})
              </option>
            ))}
          </select>
        </div>

        {/* Issue Type */}
        {selectedProject && (
          <div className={styles.field}>
            <label className={styles.label}>
              Issue Type <span className={styles.required}>*</span>
            </label>
            <select
              value={issueTypeId}
              onChange={(e) => setIssueTypeId(e.target.value)}
              className={styles.select}
            >
              <option value="">Select issue type</option>
              {issueTypes.map((type) => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Summary */}
        <div className={styles.field}>
          <label className={styles.label}>
            Summary <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Brief description of the issue"
            className={styles.input}
          />
        </div>

        {/* Description */}
        <div className={styles.field}>
          <label className={styles.label}>Description</label>
          <MarkdownEditor
            value={description}
            onChange={setDescription}
            placeholder="Detailed description..."
            minHeight={150}
          />
        </div>

        {/* Priority */}
        {selectedProject && priorities.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <select
              value={priorityId}
              onChange={(e) => setPriorityId(e.target.value)}
              className={styles.select}
            >
              <option value="">None</option>
              {priorities.map((priority) => (
                <option key={priority.id} value={priority.id}>
                  {priority.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Assignee */}
        <div className={styles.field}>
          <label className={styles.label}>Assignee</label>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
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
        <div className={styles.field}>
          <label className={styles.label}>Labels</label>
          <input
            type="text"
            value={labelsInput}
            onChange={(e) => setLabelsInput(e.target.value)}
            placeholder="Comma-separated labels (e.g., bug, frontend, urgent)"
            className={styles.input}
          />
        </div>

        {/* Actions */}
        <div className={styles.actions}>
          <button
            onClick={handleCreate}
            disabled={!isValid}
            className={styles.createButton}
          >
            {isCreating ? "Creating..." : "Create Issue"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

