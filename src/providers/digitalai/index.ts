/**
 * Digital.ai Agility Provider (Beta)
 *
 * This module provides integration with Digital.ai Agility (formerly VersionOne)
 * for agile project management and issue tracking.
 *
 * Status: BETA
 * - Core features: View stories, change status, basic details
 * - Authentication: Access Token (recommended)
 *
 * Documentation:
 * - API: https://docs.digital.ai/agility/docs/developerlibrary/002-getting-started-with-the-api
 * - Auth: https://docs.digital.ai/agility/docs/developerlibrary/api-authentication
 */

// Client
export { DigitalAIClient } from "./DigitalAIClient";

// Types
export type {
  DigitalAINormalizedStory,
  DigitalAINormalizedUser,
  DigitalAINormalizedProject,
  DigitalAINormalizedSprint,
  DigitalAINormalizedTeam,
  DigitalAINormalizedStatus,
  DigitalAIConfig,
  DigitalAIAuth,
  CreateDigitalAIStoryInput,
  UpdateDigitalAIStoryInput,
  DigitalAISearchOptions,
} from "./types";

export { DigitalAIAssetState } from "./types";

// Setup
export {
  runDigitalAISetup,
  testDigitalAIConnection,
  resetDigitalAIConfig,
  updateDigitalAIAccessToken,
} from "./firstTimeSetup";

// Tree View Provider
export { DigitalAITicketsProvider, DigitalAITicketTreeItem } from "./DigitalAITicketsProvider";

