/**
 * Digital.ai Agility Type Definitions
 *
 * Based on the Digital.ai Agility REST API (rest-1.v1)
 * Documentation: https://docs.digital.ai/agility/docs/developerlibrary/002-getting-started-with-the-api
 *
 * Asset Name Translations:
 * - Story = Story, Backlog Item, or Requirement
 * - Scope = Project
 * - Timebox = Iteration or Sprint
 * - Member = User
 * - Actual = Effort or Done
 */

/**
 * Digital.ai Asset State Values
 * The state field determines the lifecycle status of an asset
 */
export enum DigitalAIAssetState {
  Future = 0,
  Active = 64,
  Closed = 128,
  Template = 200,
  BrokenDown = 208,
  Deleted = 255,
}

/**
 * Digital.ai OID (Object Identifier)
 * Format: "AssetType:number" (e.g., "Story:1234")
 */
export interface DigitalAIOID {
  idref: string; // e.g., "Story:1234"
}

/**
 * Digital.ai Relation (reference to another asset)
 */
export interface DigitalAIRelation {
  idref: string;
  name?: string;
}

/**
 * Digital.ai Multi-value Relation
 */
export interface DigitalAIMultiRelation {
  value: DigitalAIRelation[];
}

/**
 * Digital.ai Attribute value wrapper
 */
export interface DigitalAIAttribute<T = string> {
  value: T;
}

/**
 * Digital.ai Story (Backlog Item/Requirement)
 * Main work item type
 */
export interface DigitalAIStory {
  _oid: string; // "Story:1234"
  id: DigitalAIAttribute<string>;
  Number?: DigitalAIAttribute<string>; // Display ID like "S-01234"
  Name: DigitalAIAttribute<string>;
  Description?: DigitalAIAttribute<string>;
  AssetState?: DigitalAIAttribute<number>;
  Status?: DigitalAIRelation; // Custom status
  Priority?: DigitalAIRelation;
  Owners?: DigitalAIMultiRelation;
  Scope?: DigitalAIRelation; // Project
  Timebox?: DigitalAIRelation; // Sprint/Iteration
  Team?: DigitalAIRelation;
  CreateDate?: DigitalAIAttribute<string>;
  ChangeDate?: DigitalAIAttribute<string>;
  Estimate?: DigitalAIAttribute<number>;
  DetailEstimate?: DigitalAIAttribute<number>;
  ToDo?: DigitalAIAttribute<number>;
  Super?: DigitalAIRelation; // Parent epic/feature
  Category?: DigitalAIRelation; // Issue type
  Goals?: DigitalAIMultiRelation; // OKRs
  Dependencies?: DigitalAIMultiRelation;
  Dependants?: DigitalAIMultiRelation;
}

/**
 * Digital.ai Normalized Story
 * Simplified structure for DevBuddy internal use
 */
export interface DigitalAINormalizedStory {
  id: string;
  identifier: string; // Display number like "S-01234"
  title: string;
  description?: string;
  url: string;
  createdAt: string;
  updatedAt: string;
  state: {
    id: string;
    name: string;
    type: string; // "backlog", "unstarted", "started", "completed", "canceled"
  };
  priority: number; // Mapped to 0-4 scale
  assignee?: DigitalAINormalizedUser;
  project?: {
    id: string;
    name: string;
  };
  sprint?: {
    id: string;
    name: string;
  };
  team?: {
    id: string;
    name: string;
  };
  parent?: {
    id: string;
    identifier: string;
    title: string;
  };
  estimate?: number;
}

/**
 * Digital.ai Member (User)
 */
export interface DigitalAIMember {
  _oid: string; // "Member:1234"
  id: DigitalAIAttribute<string>;
  Name: DigitalAIAttribute<string>;
  Nickname?: DigitalAIAttribute<string>;
  Email?: DigitalAIAttribute<string>;
  Username?: DigitalAIAttribute<string>;
  Avatar?: DigitalAIAttribute<string>;
  IsLoginDisabled?: DigitalAIAttribute<boolean>;
}

/**
 * Digital.ai Normalized User
 */
export interface DigitalAINormalizedUser {
  id: string;
  name: string;
  email?: string;
  username?: string;
  avatarUrl?: string;
}

/**
 * Digital.ai Scope (Project)
 */
export interface DigitalAIScope {
  _oid: string; // "Scope:1234"
  id: DigitalAIAttribute<string>;
  Name: DigitalAIAttribute<string>;
  Description?: DigitalAIAttribute<string>;
  AssetState?: DigitalAIAttribute<number>;
  Owner?: DigitalAIRelation;
  Parent?: DigitalAIRelation;
  BeginDate?: DigitalAIAttribute<string>;
  EndDate?: DigitalAIAttribute<string>;
}

/**
 * Digital.ai Normalized Project
 */
export interface DigitalAINormalizedProject {
  id: string;
  name: string;
  description?: string;
  state: string;
  owner?: DigitalAINormalizedUser;
}

/**
 * Digital.ai Timebox (Sprint/Iteration)
 */
export interface DigitalAITimebox {
  _oid: string; // "Timebox:1234"
  id: DigitalAIAttribute<string>;
  Name: DigitalAIAttribute<string>;
  State?: DigitalAIAttribute<string>; // "Future", "Active", "Closed"
  Schedule?: DigitalAIRelation;
  BeginDate?: DigitalAIAttribute<string>;
  EndDate?: DigitalAIAttribute<string>;
}

/**
 * Digital.ai Normalized Sprint
 */
export interface DigitalAINormalizedSprint {
  id: string;
  name: string;
  state: "future" | "active" | "closed";
  startDate?: string;
  endDate?: string;
}

/**
 * Digital.ai Team
 */
export interface DigitalAITeam {
  _oid: string; // "Team:1234"
  id: DigitalAIAttribute<string>;
  Name: DigitalAIAttribute<string>;
  Description?: DigitalAIAttribute<string>;
}

/**
 * Digital.ai Normalized Team
 */
export interface DigitalAINormalizedTeam {
  id: string;
  name: string;
  key: string; // Use first part of name as key
}

/**
 * Digital.ai StoryStatus (Custom Status)
 */
export interface DigitalAIStoryStatus {
  _oid: string;
  id: DigitalAIAttribute<string>;
  Name: DigitalAIAttribute<string>;
  Description?: DigitalAIAttribute<string>;
  RollupState?: DigitalAIAttribute<string>; // Maps to state type
}

/**
 * Digital.ai Normalized Status
 */
export interface DigitalAINormalizedStatus {
  id: string;
  name: string;
  type: string; // "backlog", "unstarted", "started", "completed", "canceled"
}

/**
 * Digital.ai Priority
 */
export interface DigitalAIPriority {
  _oid: string;
  id: DigitalAIAttribute<string>;
  Name: DigitalAIAttribute<string>;
  Order?: DigitalAIAttribute<number>;
}

/**
 * Digital.ai API Response wrapper
 */
export interface DigitalAIApiResponse<T> {
  _type: string;
  total: number;
  pageSize: number;
  pageStart: number;
  Assets: T[];
}

/**
 * Digital.ai Single Asset Response
 */
export interface DigitalAISingleAssetResponse<T> {
  _type: string;
  id: string;
  Attributes: T;
}

/**
 * Digital.ai Search/Query Options
 */
export interface DigitalAISearchOptions {
  where?: string; // OData-style filter
  select?: string[]; // Attributes to include
  sort?: string; // Sort field
  page?: number;
  pageSize?: number;
  asof?: string; // Historical query timestamp
}

/**
 * Digital.ai Configuration
 */
export interface DigitalAIConfig {
  instanceUrl: string; // e.g., "https://www14.v1host.com/MyCompany"
  defaultProject?: string;
}

/**
 * Digital.ai Authentication
 * Uses Access Tokens (recommended) - https://docs.digital.ai/agility/docs/developerlibrary/api-authentication
 */
export interface DigitalAIAuth {
  accessToken: string;
  username?: string; // For display purposes
}

/**
 * Create Story Input
 */
export interface CreateDigitalAIStoryInput {
  name: string;
  description?: string;
  scopeId: string; // Project ID
  ownerId?: string; // Assignee
  priorityId?: string;
  timeboxId?: string; // Sprint
  teamId?: string;
  estimate?: number;
  parentId?: string; // Epic/Feature
}

/**
 * Update Story Input
 */
export interface UpdateDigitalAIStoryInput {
  name?: string;
  description?: string;
  ownerId?: string;
  priorityId?: string;
  statusId?: string;
  timeboxId?: string;
  estimate?: number;
}

/**
 * Map Digital.ai asset state to DevBuddy state type
 */
export function mapAssetStateToType(
  assetState: number,
  statusName?: string
): string {
  // If there's a custom status, try to infer from name
  if (statusName) {
    const lower = statusName.toLowerCase();
    if (
      lower.includes("done") ||
      lower.includes("complete") ||
      lower.includes("accepted")
    ) {
      return "completed";
    }
    if (lower.includes("progress") || lower.includes("active")) {
      return "started";
    }
    if (lower.includes("ready") || lower.includes("todo")) {
      return "unstarted";
    }
    if (lower.includes("cancel") || lower.includes("reject")) {
      return "canceled";
    }
  }

  // Fall back to asset state
  switch (assetState) {
    case DigitalAIAssetState.Future:
      return "backlog";
    case DigitalAIAssetState.Active:
      return "started";
    case DigitalAIAssetState.Closed:
      return "completed";
    case DigitalAIAssetState.Template:
    case DigitalAIAssetState.BrokenDown:
    case DigitalAIAssetState.Deleted:
      return "canceled";
    default:
      return "backlog";
  }
}

/**
 * Map DevBuddy priority (0-4) from Digital.ai priority name
 */
export function mapPriorityFromName(priorityName?: string): number {
  if (!priorityName) return 0;

  const lower = priorityName.toLowerCase();
  if (lower.includes("urgent") || lower.includes("critical")) return 1;
  if (lower.includes("high")) return 2;
  if (lower.includes("medium") || lower.includes("normal")) return 3;
  if (lower.includes("low")) return 4;
  return 0;
}

/**
 * Extract numeric ID from OID
 * "Story:1234" -> "1234"
 */
export function extractIdFromOID(oid: string): string {
  const parts = oid.split(":");
  return parts.length > 1 ? parts[1] : oid;
}

/**
 * Build OID from asset type and ID
 * ("Story", "1234") -> "Story:1234"
 */
export function buildOID(assetType: string, id: string): string {
  return `${assetType}:${id}`;
}

