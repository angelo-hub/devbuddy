import React, { useEffect } from "react";
import { MarkdownEditor } from "@shared/components";
import { markdownToAdf } from "@shared/utils/adfConverter";
import {
  useJiraProjects,
  useJiraIssueTypes,
  useJiraPriorities,
  useJiraUsers,
  useSelectedProject,
  useSummary,
  useDescription,
  useIssueTypeId,
  usePriorityId,
  useAssigneeId,
  useLabelsInput,
  useIsCreating,
  useJiraCreateTicketActions,
} from "./store";
import styles from "./App.module.css";

function App() {
  // State from store
  const projects = useJiraProjects();
  const issueTypes = useJiraIssueTypes();
  const priorities = useJiraPriorities();
  const users = useJiraUsers();
  const selectedProject = useSelectedProject();
  const summary = useSummary();
  const description = useDescription();
  const issueTypeId = useIssueTypeId();
  const priorityId = usePriorityId();
  const assigneeId = useAssigneeId();
  const labelsInput = useLabelsInput();
  const isCreating = useIsCreating();

  // Actions from store
  const {
    init,
    setSelectedProject,
    setSummary,
    setDescription,
    setIssueTypeId,
    setPriorityId,
    setAssigneeId,
    setLabelsInput,
    createIssue,
  } = useJiraCreateTicketActions();

  // Initialize store
  useEffect(() => {
    return init();
  }, [init]);

  const handleCreate = () => {
    if (!selectedProject || !summary.trim() || !issueTypeId) {
      return;
    }

    const labels = labelsInput
      .split(",")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    // Convert markdown description to ADF for Jira
    const adfDescription = description.trim()
      ? JSON.stringify(markdownToAdf(description.trim()))
      : "";

    createIssue({
      projectKey: selectedProject,
      summary: summary.trim(),
      description: adfDescription,
      issueTypeId,
      priorityId: priorityId || undefined,
      assigneeId: assigneeId || undefined,
      labels: labels.length > 0 ? labels : undefined,
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
            onChange={(e) => setSelectedProject(e.target.value)}
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
