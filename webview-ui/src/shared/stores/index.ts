/**
 * Shared store utilities for VS Code webviews
 */

export {
  getVSCodeApi,
  postMessage,
  subscribeToMessages,
  getPersistedState,
  setPersistedState,
} from "./vscodeApi";

export {
  createMessageSubscription,
  createMessageHandler,
  type MessageCase,
} from "./createMessageHandler";

