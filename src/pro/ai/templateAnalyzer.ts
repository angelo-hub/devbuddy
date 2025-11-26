/**
 * Pro AI Template Analyzer
 * 
 * Intelligent template parsing and validation for Linear and Jira.
 * Helps AI understand ticket templates and auto-fill fields based on context.
 * 
 * @license Commercial - See LICENSE.pro
 */

import * as vscode from "vscode";
import { LinearClient } from "@providers/linear/LinearClient";
import { JiraCloudClient } from "@providers/jira/cloud/JiraCloudClient";
import { getCurrentPlatform } from "@shared/utils/platformDetector";
import { getLogger } from "@shared/utils/logger";

const logger = getLogger();

/**
 * Template field definition
 */
export interface TemplateField {
  name: string;
  type: "string" | "number" | "select" | "multiselect" | "boolean" | "date" | "user" | "markdown";
  required: boolean;
  defaultValue?: any;
  options?: { value: string; label: string }[];
  description?: string;
}

/**
 * Parsed template with fields and metadata
 */
export interface ParsedTemplate {
  id: string;
  name: string;
  description?: string;
  platform: "Linear" | "Jira";
  fields: TemplateField[];
  templateContent?: string; // Original template content for reference
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  valid: boolean;
  missingRequired: string[];
  invalidFields: { field: string; error: string }[];
}

/**
 * AI-powered template analyzer
 */
export class TemplateAnalyzer {
  constructor(private context: vscode.ExtensionContext) {}

  /**
   * Get all available templates for the current platform
   */
  async getAvailableTemplates(): Promise<ParsedTemplate[]> {
    try {
      const platform = await getCurrentPlatform();
      
      logger.info(`[Template Analyzer] Fetching templates for ${platform}`);
      
      if (platform === "linear") {
        return await this.getLinearTemplates();
      } else if (platform === "jira") {
        return await this.getJiraTemplates();
      }
      
      return [];
    } catch (error) {
      logger.error("[Template Analyzer] Error fetching templates", error);
      return [];
    }
  }

  /**
   * Get and parse Linear templates
   */
  private async getLinearTemplates(): Promise<ParsedTemplate[]> {
    try {
      const client = await LinearClient.create();
      
      if (!client.isConfigured()) {
        logger.info("[Template Analyzer] Linear not configured");
        return [];
      }
      
      // Get teams first, then fetch templates for each team
      const teams = await client.getTeams();
      const allTemplates: any[] = [];
      
      for (const team of teams.slice(0, 3)) { // Limit to first 3 teams
        try {
          const teamTemplates = await client.getTeamTemplates(team.id);
          allTemplates.push(...teamTemplates);
        } catch (error) {
          logger.debug(`[Template Analyzer] Error fetching templates for team ${team.name}: ${error}`);
        }
      }
      
      logger.info(`[Template Analyzer] Found ${allTemplates.length} Linear templates`);
      
      return allTemplates.map((template: any) => {
        // Parse template description to extract field hints
        const fields: TemplateField[] = [
          {
            name: "title",
            type: "string",
            required: true,
            description: "Issue title"
          },
          {
            name: "description",
            type: "markdown",
            required: false,
            defaultValue: template.description || "",
            description: "Issue description (supports markdown)"
          },
          {
            name: "priority",
            type: "select",
            required: false,
            options: [
              { value: "1", label: "Urgent" },
              { value: "2", label: "High" },
              { value: "3", label: "Medium" },
              { value: "4", label: "Low" },
              { value: "0", label: "None" }
            ],
            description: "Priority level"
          },
          {
            name: "assignee",
            type: "user",
            required: false,
            description: "User to assign this issue to"
          },
          {
            name: "project",
            type: "select",
            required: false,
            description: "Project to add this issue to"
          },
          {
            name: "labels",
            type: "multiselect",
            required: false,
            description: "Labels to categorize this issue"
          }
        ];
        
        return {
          id: template.id,
          name: template.name,
          description: template.description,
          platform: "Linear" as const,
          fields: fields,
          templateContent: template.description
        };
      });
    } catch (error) {
      logger.error("[Template Analyzer] Error fetching Linear templates", error);
      return [];
    }
  }

  /**
   * Get and parse Jira templates (from create metadata)
   */
  private async getJiraTemplates(): Promise<ParsedTemplate[]> {
    try {
      const client = await JiraCloudClient.create();
      
      if (!client.isConfigured()) {
        logger.info("[Template Analyzer] Jira not configured");
        return [];
      }
      
      // Get projects to fetch their create metadata
      const projects = await client.getProjects();
      const templates: ParsedTemplate[] = [];
      
      // For each project, get its issue types and create metadata
      for (const project of projects.slice(0, 5)) { // Limit to first 5 projects to avoid rate limits
        try {
          const issueTypes = await client.getIssueTypes(project.key);
          
          for (const issueType of issueTypes) {
            // Create a template for each issue type
            const fields: TemplateField[] = [
              {
                name: "summary",
                type: "string",
                required: true,
                description: "Issue summary/title"
              },
              {
                name: "description",
                type: "markdown",
                required: false,
                description: "Issue description (supports Jira formatting)"
              },
              {
                name: "priority",
                type: "select",
                required: false,
                description: "Priority level"
              },
              {
                name: "assignee",
                type: "user",
                required: false,
                description: "User to assign this issue to"
              },
              {
                name: "labels",
                type: "multiselect",
                required: false,
                description: "Labels for categorization"
              }
            ];
            
            templates.push({
              id: `${project.key}-${issueType.id}`,
              name: `${project.name} - ${issueType.name}`,
              description: `Create a ${issueType.name} in ${project.name}`,
              platform: "Jira" as const,
              fields: fields,
              templateContent: `Issue type: ${issueType.name}\nProject: ${project.name}`
            });
          }
        } catch (error) {
          logger.debug(`[Template Analyzer] Error fetching metadata for project ${project.key}: ${error}`);
          continue;
        }
      }
      
      logger.info(`[Template Analyzer] Generated ${templates.length} Jira templates`);
      
      return templates;
    } catch (error) {
      logger.error("[Template Analyzer] Error fetching Jira templates", error);
      return [];
    }
  }

  /**
   * Parse a specific template by ID
   */
  async getTemplateById(templateId: string): Promise<ParsedTemplate | null> {
    try {
      const templates = await this.getAvailableTemplates();
      return templates.find(t => t.id === templateId) || null;
    } catch (error) {
      logger.error("[Template Analyzer] Error getting template by ID", error);
      return null;
    }
  }

  /**
   * Validate ticket data against a template
   */
  validateAgainstTemplate(
    template: ParsedTemplate,
    data: Record<string, any>
  ): TemplateValidationResult {
    const missingRequired: string[] = [];
    const invalidFields: { field: string; error: string }[] = [];
    
    // Check required fields
    for (const field of template.fields) {
      if (field.required && !data[field.name]) {
        missingRequired.push(field.name);
      }
      
      // Type validation
      if (data[field.name] !== undefined) {
        const value = data[field.name];
        
        switch (field.type) {
          case "number":
            if (typeof value !== "number" && isNaN(Number(value))) {
              invalidFields.push({
                field: field.name,
                error: `Expected a number, got ${typeof value}`
              });
            }
            break;
          
          case "boolean":
            if (typeof value !== "boolean") {
              invalidFields.push({
                field: field.name,
                error: `Expected a boolean, got ${typeof value}`
              });
            }
            break;
          
          case "select":
            if (field.options && !field.options.some(opt => opt.value === value)) {
              invalidFields.push({
                field: field.name,
                error: `Invalid option: ${value}. Valid options: ${field.options.map(o => o.value).join(", ")}`
              });
            }
            break;
          
          case "multiselect":
            if (!Array.isArray(value)) {
              invalidFields.push({
                field: field.name,
                error: `Expected an array, got ${typeof value}`
              });
            }
            break;
        }
      }
    }
    
    return {
      valid: missingRequired.length === 0 && invalidFields.length === 0,
      missingRequired,
      invalidFields
    };
  }

  /**
   * Apply template defaults to ticket data
   */
  applyTemplateDefaults(
    template: ParsedTemplate,
    data: Record<string, any>
  ): Record<string, any> {
    const result = { ...data };
    
    for (const field of template.fields) {
      if (result[field.name] === undefined && field.defaultValue !== undefined) {
        result[field.name] = field.defaultValue;
      }
    }
    
    return result;
  }

  /**
   * Use AI to extract field values from natural language description
   */
  async extractFieldsFromDescription(
    template: ParsedTemplate,
    naturalLanguageDescription: string
  ): Promise<Record<string, any>> {
    try {
      logger.info("[Template Analyzer] Extracting fields from natural language");
      logger.debug(`[Template Analyzer] Description: ${naturalLanguageDescription}`);
      
      // Try to get AI model
      const models = await vscode.lm.selectChatModels({
        vendor: "copilot",
        family: "gpt-4o",
      });
      
      if (models.length === 0) {
        logger.debug("[Template Analyzer] No AI model available, using fallback");
        return this.extractFieldsFallback(naturalLanguageDescription);
      }
      
      const model = models[0];
      
      // Build prompt for field extraction
      const fieldDescriptions = template.fields
        .map(f => `- ${f.name} (${f.type}, ${f.required ? 'required' : 'optional'}): ${f.description}`)
        .join("\n");
      
      const prompt = `Extract structured ticket fields from this natural language description.

Template fields:
${fieldDescriptions}

User's description:
"${naturalLanguageDescription}"

Return ONLY a JSON object with the extracted field values. Use null for fields that cannot be determined. Example:
{
  "title": "Implement OAuth2",
  "description": "Add OAuth2 authentication flow...",
  "priority": "2",
  "assignee": null,
  "labels": ["authentication", "security"]
}`;
      
      const messages = [vscode.LanguageModelChatMessage.User(prompt)];
      const response = await model.sendRequest(messages, {}, new vscode.CancellationTokenSource().token);
      
      let fullResponse = "";
      for await (const fragment of response.text) {
        fullResponse += fragment;
      }
      
      // Parse AI response
      const cleanedResponse = fullResponse.trim().replace(/```json\n?|\n?```/g, "");
      const extracted = JSON.parse(cleanedResponse);
      
      logger.success(`[Template Analyzer] Successfully extracted ${Object.keys(extracted).length} fields using AI`);
      
      return extracted;
    } catch (error) {
      logger.error("[Template Analyzer] Error using AI for field extraction", error);
      return this.extractFieldsFallback(naturalLanguageDescription);
    }
  }

  /**
   * Fallback field extraction without AI
   */
  private extractFieldsFallback(description: string): Record<string, any> {
    // Simple heuristic-based extraction
    const result: Record<string, any> = {};
    
    // Try to extract title (first line or sentence)
    const firstLine = description.split('\n')[0].trim();
    if (firstLine) {
      result.title = firstLine.length > 100 ? firstLine.substring(0, 97) + "..." : firstLine;
    }
    
    // Use the full description
    result.description = description;
    
    // Try to detect priority keywords
    const lowerDesc = description.toLowerCase();
    if (lowerDesc.includes("urgent") || lowerDesc.includes("critical")) {
      result.priority = "1"; // Urgent
    } else if (lowerDesc.includes("high priority") || lowerDesc.includes("important")) {
      result.priority = "2"; // High
    } else if (lowerDesc.includes("low priority")) {
      result.priority = "4"; // Low
    }
    
    // Try to extract labels from common keywords
    const labels: string[] = [];
    if (lowerDesc.includes("bug") || lowerDesc.includes("fix")) {
      labels.push("bug");
    }
    if (lowerDesc.includes("feature") || lowerDesc.includes("implement")) {
      labels.push("feature");
    }
    if (lowerDesc.includes("security") || lowerDesc.includes("auth")) {
      labels.push("security");
    }
    if (labels.length > 0) {
      result.labels = labels;
    }
    
    logger.info(`[Template Analyzer] Extracted ${Object.keys(result).length} fields using fallback method`);
    
    return result;
  }
}

