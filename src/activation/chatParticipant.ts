import * as vscode from "vscode";
import { DevBuddyChatParticipant } from "@chat/devBuddyParticipant";
import { getLogger } from "@shared/utils/logger";

/**
 * Register chat participant (optional, may not be available in all VS Code versions)
 */
export function registerChatParticipant(context: vscode.ExtensionContext): void {
  const logger = getLogger();
  
  try {
    const chatParticipant = new DevBuddyChatParticipant();
    context.subscriptions.push(chatParticipant.register(context));
    logger.info("Chat participant registered successfully");
  } catch (error) {
    // Chat participant might not be available in all VS Code versions
    logger.debug("Chat participant not available (this is OK)");
  }
}





