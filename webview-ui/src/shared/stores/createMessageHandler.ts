/**
 * Create a message handler that maps incoming messages to store actions
 *
 * This is a utility to create clean message handlers for Zustand stores
 * that work with VS Code webview messaging.
 */

import { subscribeToMessages } from "./vscodeApi";

type MessageHandler<TMessage> = (message: TMessage) => void;

/**
 * Creates a message subscription that automatically handles cleanup
 *
 * @example
 * ```ts
 * // In your store
 * const store = create<MyStore>()((set, get) => ({
 *   ...initialState,
 *   initMessageListener: () => {
 *     return createMessageSubscription<MessageFromExtension>((message) => {
 *       switch (message.command) {
 *         case 'dataLoaded':
 *           set({ data: message.data, isLoading: false });
 *           break;
 *       }
 *     });
 *   },
 * }));
 * ```
 */
export function createMessageSubscription<TMessage>(
  handler: MessageHandler<TMessage>
): () => void {
  return subscribeToMessages<TMessage>(handler);
}

/**
 * Type helper for creating message handler switch cases
 * Ensures all message types are handled
 */
export type MessageCase<TMessage extends { command: string }> = {
  [K in TMessage["command"]]: (
    message: Extract<TMessage, { command: K }>
  ) => void;
};

/**
 * Create a type-safe message handler from a cases object
 *
 * @example
 * ```ts
 * const handleMessage = createMessageHandler<MessageFromExtension>({
 *   updateIssue: (msg) => set({ issue: msg.issue }),
 *   transitionsLoaded: (msg) => set({ transitions: msg.transitions }),
 * });
 * ```
 */
export function createMessageHandler<TMessage extends { command: string }>(
  cases: Partial<MessageCase<TMessage>>
): MessageHandler<TMessage> {
  return (message: TMessage) => {
    const handler = cases[message.command as keyof typeof cases];
    if (handler) {
      (handler as (msg: TMessage) => void)(message);
    }
  };
}

