import React, { useState, useEffect } from "react";
import { Input, TextArea, Select, Button } from "@shared/components";
import styles from "./TicketForm.module.css";

interface TicketFormProps {
  teams: Array<{ id: string; name: string; key: string }>;
  templates: Array<{
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
  workflowStates: Array<{
    id: string;
    name: string;
    type: string;
    position?: number;
  }>;
  labels: Array<{ id: string; name: string; color: string }>;
  projects: Array<{ id: string; name: string; url?: string; state: string }>;
  users: Array<{
    id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  }>;
  onTeamChange: (teamId: string) => void;
  onSubmit: (input: {
    teamId: string;
    title: string;
    description?: string;
    priority?: number;
    assigneeId?: string;
    projectId?: string;
    labelIds?: string[];
    stateId?: string;
  }) => void;
  isSubmitting: boolean;
}

export const TicketForm: React.FC<TicketFormProps> = ({
  teams,
  templates,
  workflowStates,
  labels,
  projects,
  users,
  onTeamChange,
  onSubmit,
  isSubmitting,
}) => {
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<number | undefined>(undefined);
  const [assigneeId, setAssigneeId] = useState<string | undefined>(undefined);
  const [projectId, setProjectId] = useState<string | undefined>(undefined);
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [stateId, setStateId] = useState<string | undefined>(undefined);

  // Auto-select first team if only one exists
  useEffect(() => {
    if (teams.length === 1 && !selectedTeamId) {
      const teamId = teams[0].id;
      setSelectedTeamId(teamId);
      onTeamChange(teamId);
    }
  }, [teams]);

  // Apply template when selected
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template?.templateData) {
        const data = template.templateData;
        // TODO: This is a bit hacky, we should probably lift the state up to the parent component and handle this logic there instead of in the form component
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.priority !== undefined) setPriority(data.priority);
        if (data.labelIds) setSelectedLabelIds(data.labelIds);
        if (data.projectId) setProjectId(data.projectId);
        if (data.stateId) setStateId(data.stateId);
      }
    }
  }, [selectedTemplateId, templates]);

  const handleTeamChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedTeamId(value);
    setSelectedTemplateId("");
    onTeamChange(value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedTeamId || !title.trim()) {
      return;
    }

    onSubmit({
      teamId: selectedTeamId,
      title: title.trim(),
      description: description.trim() || undefined,
      priority,
      assigneeId,
      projectId,
      labelIds: selectedLabelIds.length > 0 ? selectedLabelIds : undefined,
      stateId,
    });
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      {/* Team Selection */}
      <div className={styles.field}>
        <label className={styles.label}>
          Team <span className={styles.required}>*</span>
        </label>
        <Select
          value={selectedTeamId}
          onChange={handleTeamChange}
          disabled={teams.length === 0}
        >
          <option value="">Select a team...</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name} ({team.key})
            </option>
          ))}
        </Select>
      </div>

      {/* Template Selection (Optional) */}
      {selectedTeamId && templates.length > 0 && (
        <div className={styles.field}>
          <label className={styles.label}>Template (Optional)</label>
          <Select
            value={selectedTemplateId}
            onChange={(e) => setSelectedTemplateId(e.target.value)}
          >
            <option value="">No template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </Select>
          {selectedTemplateId && (
            <div className={styles.templateInfo}>
              {templates.find((t) => t.id === selectedTemplateId)
                ?.description && (
                <p className={styles.templateDescription}>
                  {
                    templates.find((t) => t.id === selectedTemplateId)
                      ?.description
                  }
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Title */}
      {selectedTeamId && (
        <>
          <div className={styles.field}>
            <label className={styles.label}>
              Title <span className={styles.required}>*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter ticket title..."
              required
            />
          </div>

          {/* Description */}
          <div className={styles.field}>
            <label className={styles.label}>Description</label>
            <TextArea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={6}
            />
          </div>

          {/* Priority */}
          <div className={styles.field}>
            <label className={styles.label}>Priority</label>
            <Select
              value={priority?.toString() || ""}
              onChange={(e) =>
                setPriority(e.target.value ? parseInt(e.target.value, 10) : undefined)
              }
            >
              <option value="">No Priority</option>
              <option value="1">🔴 Urgent</option>
              <option value="2">🟠 High</option>
              <option value="3">🟡 Medium</option>
              <option value="4">🟢 Low</option>
            </Select>
          </div>

          {/* Status */}
          {workflowStates.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Status</label>
              <Select
                value={stateId || ""}
                onChange={(e) => setStateId(e.target.value || undefined)}
              >
                <option value="">Default status</option>
                {workflowStates.map((state) => (
                  <option key={state.id} value={state.id}>
                    {state.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Assignee */}
          {users.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Assignee</label>
              <Select
                value={assigneeId || ""}
                onChange={(e) => setAssigneeId(e.target.value || undefined)}
              >
                <option value="">Unassigned</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Project */}
          {projects.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Project</label>
              <Select
                value={projectId || ""}
                onChange={(e) => setProjectId(e.target.value || undefined)}
              >
                <option value="">No project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </Select>
            </div>
          )}

          {/* Labels */}
          {labels.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Labels</label>
              <div className={styles.labelsContainer}>
                {labels.map((label) => (
                  <button
                    key={label.id}
                    type="button"
                    className={`${styles.labelTag} ${
                      selectedLabelIds.includes(label.id)
                        ? styles.labelTagSelected
                        : ""
                    }`}
                    onClick={() => toggleLabel(label.id)}
                    style={{
                      borderColor: selectedLabelIds.includes(label.id)
                        ? label.color
                        : "transparent",
                    }}
                  >
                    <span
                      className={styles.labelDot}
                      style={{ backgroundColor: label.color }}
                    />
                    {label.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Submit */}
          <div className={styles.actions}>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting ? "Creating..." : "Create Ticket"}
            </Button>
          </div>
        </>
      )}
    </form>
  );
};

