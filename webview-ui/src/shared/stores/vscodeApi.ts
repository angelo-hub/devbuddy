/**
 * VS Code API singleton for Zustand stores
 * This provides a clean interface to communicate with the extension
 */

interface VSCodeApi {
  postMessage(message: unknown): void;
  getState(): unknown;
  setState(state: unknown): void;
}

declare function acquireVsCodeApi(): VSCodeApi;

let vscodeApiInstance: VSCodeApi | undefined;

/**
 * Get the VS Code API singleton
 * Can only be acquired once per webview session
 */
export function getVSCodeApi(): VSCodeApi {
  if (!vscodeApiInstance) {
    vscodeApiInstance = acquireVsCodeApi();
  }
  return vscodeApiInstance;
}

/**
 * Post a message to the extension
 */
export function postMessage<T>(message: T): void {
  getVSCodeApi().postMessage(message);
}

/**
 * Subscribe to messages from the extension
 * Returns an unsubscribe function
 */
export function subscribeToMessages<T>(
  handler: (message: T) => void
): () => void {
  const listener = (event: MessageEvent<T>) => {
    handler(event.data);
  };

  window.addEventListener("message", listener);

  return () => {
    window.removeEventListener("message", listener);
  };
}

/**
 * Get persisted state from VS Code
 */
export function getPersistedState<T>(): T | undefined {
  return getVSCodeApi().getState() as T | undefined;
}

/**
 * Persist state to VS Code
 */
export function setPersistedState<T>(state: T): void {
  getVSCodeApi().setState(state);
}

