/**
 * Pro AI Conversational Ticket Creator
 * 
 * Natural language interface for creating tickets with AI assistance.
 * Handles multi-turn conversations to gather all required information.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from "vscode";
import { getLogger } from "@shared/utils/logger";
import { TicketCreator, UnifiedTicketInput } from "./ticketCreator";
import { TemplateAnalyzer, ParsedTemplate } from "./templateAnalyzer";
import { getCurrentPlatform } from "@shared/utils/platformDetector";

const logger = getLogger();

/**
 * Conversation state for multi-turn ticket creation
 */
interface ConversationState {
  stage: "initial" | "gathering" | "confirming" | "complete";
  ticketData: Partial<UnifiedTicketInput>;
  template?: ParsedTemplate;
  missingFields: string[];
}

/**
 * Conversational response with streaming support
 */
export interface ConversationalResponse {
  message: string;
  needsMoreInput: boolean;
  suggestedActions?: {
    label: string;
    action: string;
    value?: any;
  }[];
  ticketPreview?: {
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    project?: string;
    labels?: string[];
  };
}

/**
 * AI-powered conversational ticket creator
 */
export class ConversationalTicketCreator {
  private ticketCreator: TicketCreator;
  private templateAnalyzer: TemplateAnalyzer;
  private conversationState: Map<string, ConversationState> = new Map();

  constructor(private context: vscode.ExtensionContext) {
    this.ticketCreator = new TicketCreator(context);
    this.templateAnalyzer = new TemplateAnalyzer(context);
  }

  /**
   * Start a new ticket creation conversation
   */
  async startConversation(
    sessionId: string,
    initialDescription: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      logger.info(`[Conversational Creator] Starting new conversation: ${sessionId}`);
      logger.debug(`[Conversational Creator] Initial description: ${initialDescription}`);
      
      stream.progress("Analyzing your request...");
      
      // Get platform
      const platform = getCurrentPlatform();
      if (!platform || (platform !== "linear" && platform !== "jira")) {
        stream.markdown("⚠️ **No platform configured.**\n\n");
        stream.markdown("Please configure Linear or Jira first:\n");
        stream.markdown("- Run `DevBuddy: Configure Linear` or\n");
        stream.markdown("- Run `DevBuddy: Configure Jira`\n");
        return;
      }
      
      stream.progress("Fetching templates...");
      
      // Get available templates
      const templates = await this.templateAnalyzer.getAvailableTemplates();
      let selectedTemplate: ParsedTemplate | undefined;
      
      if (templates.length > 0) {
        // For now, use the first template (TODO: let user select)
        selectedTemplate = templates[0];
        logger.info(`[Conversational Creator] Using template: ${selectedTemplate.name}`);
      }
      
      stream.progress("Extracting ticket details with AI...");
      
      // Use AI to extract structured data from natural language
      const extractedFields = selectedTemplate
        ? await this.templateAnalyzer.extractFieldsFromDescription(selectedTemplate, initialDescription)
        : { title: initialDescription, description: initialDescription };
      
      // Normalize field names (Jira uses 'summary', we use 'title' internally)
      if ('summary' in extractedFields && !extractedFields.title) {
        extractedFields.title = extractedFields.summary;
        delete extractedFields.summary;
      }
      
      logger.debug(`[Conversational Creator] Extracted fields: ${JSON.stringify(extractedFields, null, 2)}`);
      
      // Initialize conversation state
      const state: ConversationState = {
        stage: "gathering",
        ticketData: extractedFields,
        template: selectedTemplate,
        missingFields: this.identifyMissingFields(extractedFields, selectedTemplate)
      };
      
      this.conversationState.set(sessionId, state);
      
      // Present extracted information to user
      await this.presentTicketDraft(state, stream, token);
      
    } catch (error) {
      logger.error("[Conversational Creator] Error starting conversation", error);
      stream.markdown(`\n\n❌ **Error:** ${error instanceof Error ? error.message : "Unknown error"}\n`);
    }
  }

  /**
   * Continue an existing conversation
   */
  async continueConversation(
    sessionId: string,
    userResponse: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    try {
      const state = this.conversationState.get(sessionId);
      
      if (!state) {
        stream.markdown("⚠️ **No active conversation found.** Please start a new ticket creation request.\n");
        return;
      }
      
      logger.info(`[Conversational Creator] Continuing conversation: ${sessionId}`);
      
      // Update ticket data based on user response
      await this.processUserResponse(state, userResponse, stream, token);
      
      // Check if we have all required information
      if (state.missingFields.length === 0) {
        state.stage = "confirming";
        await this.presentTicketDraft(state, stream, token);
      } else {
        await this.askForNextField(state, stream);
      }
      
    } catch (error) {
      logger.error("[Conversational Creator] Error continuing conversation", error);
      stream.markdown(`\n\n❌ **Error:** ${error instanceof Error ? error.message : "Unknown error"}\n`);
    }
  }

  /**
   * Create the ticket after confirmation
   */
  async createTicket(
    sessionId: string,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    try {
      const state = this.conversationState.get(sessionId);
      
      if (!state) {
        stream.markdown("⚠️ **No active conversation found.**\n");
        return;
      }
      
      logger.info(`[Conversational Creator] Creating ticket for session: ${sessionId}`);
      
      stream.progress("Creating ticket...");
      
      // Validate required fields
      if (!state.ticketData.title) {
        stream.markdown("❌ **Error:** Title is required to create a ticket.\n");
        return;
      }
      
      // Create the ticket
      const result = await this.ticketCreator.createTicket(state.ticketData as UnifiedTicketInput);
      
      if (result.success && result.ticket) {
        stream.markdown(`\n\n## ✅ Ticket Created Successfully!\n\n`);
        stream.markdown(`**${result.ticket.identifier}** - ${result.ticket.title}\n\n`);
        stream.markdown(`Platform: ${result.ticket.platform}\n\n`);
        stream.markdown(`[Open in ${result.ticket.platform}](${result.ticket.url})\n\n`);
        
        // Add button to open in DevBuddy
        if (result.ticket.openInDevBuddy) {
          stream.button({
            command: "devBuddy.openTicketById",
            arguments: [result.ticket.identifier],
            title: "$(link-external) Open in DevBuddy"
          });
        }
        
        // Clean up conversation state
        this.conversationState.delete(sessionId);
        state.stage = "complete";
        
        logger.success(`[Conversational Creator] Successfully created ticket: ${result.ticket.identifier}`);
      } else {
        stream.markdown(`\n\n❌ **Error creating ticket:** ${result.error}\n`);
        logger.error(`[Conversational Creator] Failed to create ticket: ${result.error}`);
      }
      
    } catch (error) {
      logger.error("[Conversational Creator] Error creating ticket", error);
      stream.markdown(`\n\n❌ **Error:** ${error instanceof Error ? error.message : "Unknown error"}\n`);
    }
  }

  /**
   * Present the current ticket draft to the user
   */
  private async presentTicketDraft(
    state: ConversationState,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    stream.markdown("## 📝 Ticket Draft Preview\n\n");
    
    // Show extracted information
    if (state.ticketData.title) {
      stream.markdown(`**Title:** ${state.ticketData.title}\n\n`);
    }
    
    if (state.ticketData.description) {
      const shortDesc = state.ticketData.description.length > 200
        ? state.ticketData.description.substring(0, 197) + "..."
        : state.ticketData.description;
      stream.markdown(`**Description:** ${shortDesc}\n\n`);
    }
    
    if (state.ticketData.priority) {
      const priorityName = this.getPriorityName(state.ticketData.priority);
      stream.markdown(`**Priority:** ${priorityName}\n\n`);
    }
    
    if (state.ticketData.labels && state.ticketData.labels.length > 0) {
      stream.markdown(`**Labels:** ${state.ticketData.labels.join(", ")}\n\n`);
    }
    
    stream.markdown("---\n\n");
    stream.markdown("✅ **Ready to create!** To proceed:\n\n");
    stream.markdown("1. Use the **Create Ticket Panel** from the sidebar for full control\n");
    stream.markdown("2. Or reply with any changes you'd like to make\n\n");
    
    // Provide button to open create panel with pre-filled data
    stream.button({
      command: "devBuddy.createTicket",
      title: "$(add) Open Ticket Creator with Draft",
      arguments: [state.ticketData]
    });
    
    stream.markdown("\n💡 **Tip:** For now, conversational ticket creation is best done through the sidebar panel. Future updates will support full multi-turn conversations in chat!\n");
  }

  /**
   * Ask user for the next missing field
   */
  private async askForNextField(
    state: ConversationState,
    stream: vscode.ChatResponseStream
  ): Promise<void> {
    if (state.missingFields.length === 0) {
      return;
    }
    
    const nextField = state.missingFields[0];
    
    stream.markdown(`💬 **${this.getFieldQuestion(nextField)}**\n\n`);
    stream.markdown("_(Or type 'skip' to use defaults, or 'create' to proceed)_\n");
  }

  /**
   * Process user's response and update ticket data
   */
  private async processUserResponse(
    state: ConversationState,
    userResponse: string,
    stream: vscode.ChatResponseStream,
    token: vscode.CancellationToken
  ): Promise<void> {
    const lowerResponse = userResponse.toLowerCase().trim();
    
    // Handle special commands
    if (lowerResponse === "skip" || lowerResponse === "none") {
      if (state.missingFields.length > 0) {
        state.missingFields.shift(); // Remove current field
      }
      return;
    }
    
    if (lowerResponse === "create" || lowerResponse === "yes" || lowerResponse === "confirm") {
      state.stage = "confirming";
      state.missingFields = []; // Clear missing fields to trigger creation
      return;
    }
    
    if (lowerResponse === "cancel" || lowerResponse === "abort") {
      this.conversationState.delete(state.ticketData.title || "unknown");
      stream.markdown("❌ Ticket creation cancelled.\n");
      return;
    }
    
    // Try to use AI to understand the response and update fields
    try {
      const models = await vscode.lm.selectChatModels({
        vendor: "copilot",
        family: "gpt-4o",
      });
      
      if (models.length > 0) {
        const model = models[0];
        
        const currentField = state.missingFields[0];
        const prompt = `User is creating a ticket and responding to a question about the "${currentField}" field.

User's response: "${userResponse}"

Extract the value for "${currentField}" from their response. Return ONLY a JSON object with the field value.
Examples:
- For priority: { "priority": "2" } (1=urgent, 2=high, 3=medium, 4=low)
- For labels: { "labels": ["bug", "frontend"] }
- For simple text: { "${currentField}": "value from response" }

If you can't determine a value, return: { "${currentField}": null }`;
        
        const messages = [vscode.LanguageModelChatMessage.User(prompt)];
        const response = await model.sendRequest(messages, {}, token);
        
        let fullResponse = "";
        for await (const fragment of response.text) {
          fullResponse += fragment;
        }
        
        // Parse AI response
        const cleanedResponse = fullResponse.trim().replace(/```json\n?|\n?```/g, "");
        const extracted = JSON.parse(cleanedResponse);
        
        // Update ticket data
        for (const [key, value] of Object.entries(extracted)) {
          if (value !== null) {
            (state.ticketData as any)[key] = value;
            // Remove from missing fields
            state.missingFields = state.missingFields.filter(f => f !== key);
            logger.info(`[Conversational Creator] Updated ${key}: ${value}`);
          }
        }
      }
    } catch (error) {
      logger.debug(`[Conversational Creator] AI processing failed, using fallback: ${error}`);
      // Fallback: treat response as value for current field
      const currentField = state.missingFields[0];
      if (currentField) {
        (state.ticketData as any)[currentField] = userResponse;
        state.missingFields.shift();
      }
    }
  }

  /**
   * Identify missing required/optional fields
   */
  private identifyMissingFields(
    data: Record<string, any>,
    template?: ParsedTemplate
  ): string[] {
    const missing: string[] = [];
    
    // Check template fields if available
    if (template) {
      for (const field of template.fields) {
        if (!data[field.name] && !field.required) {
          // Only include non-required fields that might be useful
          if (["priority", "assignee", "project"].includes(field.name)) {
            missing.push(field.name);
          }
        }
      }
    } else {
      // Default optional fields to ask about
      if (!data.priority) { missing.push("priority"); }
      if (!data.assignee) { missing.push("assignee"); }
      if (!data.project) { missing.push("project"); }
    }
    
    return missing;
  }

  /**
   * Get a natural language question for a field
   */
  private getFieldQuestion(fieldName: string): string {
    const questions: Record<string, string> = {
      priority: "What priority should this ticket have? (urgent/high/medium/low)",
      assignee: "Who should this be assigned to? (name or 'me')",
      project: "Which project should this ticket be in?",
      labels: "Any labels to add? (comma-separated)",
      team: "Which team should own this ticket?"
    };
    
    return questions[fieldName] || `What value should "${fieldName}" have?`;
  }

  /**
   * Get priority name from value
   */
  private getPriorityName(priority: number | string): string {
    const priorityNum = typeof priority === 'string' ? parseInt(priority) : priority;
    
    switch (priorityNum) {
      case 1: return "🔴 Urgent";
      case 2: return "🟠 High";
      case 3: return "🟡 Medium";
      case 4: return "🟢 Low";
      default: return "⚪ None";
    }
  }

  /**
   * Cancel an active conversation
   */
  cancelConversation(sessionId: string): void {
    this.conversationState.delete(sessionId);
    logger.info(`[Conversational Creator] Cancelled conversation: ${sessionId}`);
  }

  /**
   * Get active conversation state (for debugging)
   */
  getConversationState(sessionId: string): ConversationState | undefined {
    return this.conversationState.get(sessionId);
  }
}

