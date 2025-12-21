import React, { useState, useEffect } from "react";
import { useVSCode } from "@shared/hooks/useVSCode";
import {
  StandupBuilderMessageFromWebview,
  StandupBuilderMessageFromExtension,
  LinearTicket,
  AutoDetectedContext,
  TicketActivityItem,
} from "../shared/types/messages";
import { ModeSelector } from "./components/ModeSelector";
import { TicketSelector } from "./components/TicketSelector";
import { StandupForm } from "./components/StandupForm";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { CommitsAndFiles } from "./components/CommitsAndFiles";
import styles from "./App.module.css";

interface ResultsData {
  whatDidYouDo: string;
  whatWillYouDo: string;
  blockers: string;
  tickets: Array<{
    id: string;
    branch?: string;
    description?: string;
  }>;
  commits: Array<{
    message: string;
    branch?: string;
  }>;
  changedFiles: string[];
  ticketActivity?: TicketActivityItem[];
}

function App() {
  const { postMessage, onMessage } = useVSCode<
    StandupBuilderMessageFromExtension,
    StandupBuilderMessageFromWebview
  >();

  // Auto-context state
  const [autoContext, setAutoContext] = useState<AutoDetectedContext | null>(null);
  const [autoContextLoading, setAutoContextLoading] = useState(true);
  const [autoContextError, setAutoContextError] = useState<string | null>(null);

  // Form state
  const [mode, setMode] = useState<"auto" | "single" | "multi">("auto");
  const [timeWindow, setTimeWindow] = useState("24 hours ago");
  const [targetBranch, setTargetBranch] = useState("main");
  const [tickets, setTickets] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");

  // Tickets state
  const [linearTickets, setLinearTickets] = useState<LinearTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [platform, setPlatform] = useState<string>("Linear");

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");

  // Results state
  const [results, setResults] = useState<ResultsData | null>(null);

  // Load auto-context and tickets on mount
  useEffect(() => {
    postMessage({ command: "loadAutoContext" });
    postMessage({ command: "loadTickets" });
  }, [postMessage]);

  // Handle messages from extension
  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case "autoContextLoaded":
          setAutoContextLoading(false);
          if (message.error) {
            setAutoContextError(message.error);
          } else if (message.context) {
            setAutoContext(message.context);
            // Pre-fill time window from context
            if (message.context.timeWindow) {
              setTimeWindow(message.context.timeWindow);
            }
            // Auto-select first detected ticket
            if (message.context.currentTicketId) {
              setSelectedTicket(message.context.currentTicketId);
            }
          }
          break;

        case "ticketsLoaded":
          setLinearTickets(message.tickets);
          setTicketsLoading(false);
          if (message.platform) {
            setPlatform(message.platform);
          }
          if (message.error) {
            console.log("Failed to load tickets:", message.error);
          }
          break;

        case "generationStarted":
          setIsGenerating(true);
          setError("");
          break;

        case "generationFailed":
          setIsGenerating(false);
          setError(message.error);
          setProgressMessage("");
          break;

        case "dataLoaded":
          // Data pre-loaded for display
          break;

        case "progress":
          setProgressMessage(message.message);
          break;

        case "error":
          setError(message.message);
          setIsGenerating(false);
          setProgressMessage("");
          break;

        case "results":
          setResults(message.data);
          setIsGenerating(false);
          setProgressMessage("");
          break;
      }
    });
  }, [onMessage]);

  // Quick Generate - one-click with auto-detected context
  const handleQuickGenerate = () => {
    setIsGenerating(true);
    setError("");
    setResults(null);
    postMessage({ command: "quickGenerate" });
  };

  // Manual generate with form data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setError("");
    setResults(null);

    const selectedTicketData = linearTickets.find(
      (t) => t.id === selectedTicket
    );

    postMessage({
      command: "generate",
      data: {
        timeWindow,
        targetBranch,
        tickets,
        mode: mode === "auto" ? "single" : mode,
        selectedTicket,
        ticketContext: selectedTicketData,
      },
    });
  };

  const handleCopyAll = () => {
    if (!results) return;

    const text = `**Daily Standup Update**\n${"=".repeat(50)}\n\nWhat did you do since the previous update?\n${results.whatDidYouDo}\n\nWhat are you going to do today?\n${results.whatWillYouDo}\n\nAre you reaching any blockers?\n${results.blockers}`;

    postMessage({ command: "copy", text });
  };

  const handleCopyAnswers = () => {
    if (!results) return;

    const text = `What did you do?\n${results.whatDidYouDo}\n\nWhat will you do?\n${results.whatWillYouDo}\n\nBlockers?\n${results.blockers}`;

    postMessage({ command: "copy", text });
  };

  const handleOpenSettings = () => {
    postMessage({ command: "openSettings" });
  };

  // Render auto-context summary
  const renderAutoContextSummary = () => {
    if (autoContextLoading) {
      return (
        <div className={styles.autoContextLoading}>
          <span className={styles.spinner}>⏳</span> Detecting context...
        </div>
      );
    }

    if (autoContextError || !autoContext) {
      return (
        <div className={styles.autoContextError}>
          <span>⚠️</span> {autoContextError || "Could not auto-detect context"}
        </div>
      );
    }

    if (!autoContext.isGitRepo) {
      return (
        <div className={styles.autoContextWarning}>
          <span>📁</span> Not a git repository. Manual mode required.
        </div>
      );
    }

    return (
      <div className={styles.autoContextSummary}>
        <div className={styles.autoContextHeader}>
          <span className={styles.autoContextIcon}>✨</span>
          <span className={styles.autoContextTitle}>Auto-Detected Context</span>
        </div>
        <div className={styles.autoContextDetails}>
          {autoContext.currentBranch && (
            <div className={styles.autoContextItem}>
              <span className={styles.label}>Branch:</span>
              <code>{autoContext.currentBranch}</code>
            </div>
          )}
          {autoContext.currentTicketId && (
            <div className={styles.autoContextItem}>
              <span className={styles.label}>Ticket:</span>
              <code>{autoContext.currentTicketId}</code>
            </div>
          )}
          <div className={styles.autoContextItem}>
            <span className={styles.label}>Commits:</span>
            <span>{autoContext.recentCommits.length} in {autoContext.timeWindow}</span>
          </div>
          {autoContext.detectedTicketIds.length > 0 && (
            <div className={styles.autoContextItem}>
              <span className={styles.label}>Related Tickets:</span>
              <span>{autoContext.detectedTicketIds.slice(0, 3).join(", ")}{autoContext.detectedTicketIds.length > 3 ? ` +${autoContext.detectedTicketIds.length - 3} more` : ""}</span>
            </div>
          )}
          {autoContext.recentTicketActivity && autoContext.recentTicketActivity.length > 0 && (
            <div className={styles.autoContextItem}>
              <span className={styles.label}>Ticket Updates:</span>
              <span>{autoContext.recentTicketActivity.length} (spikes, investigations, comments)</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const canQuickGenerate = autoContext?.isGitRepo && autoContext.recentCommits.length > 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Standup Builder</h1>
      <p className={styles.subtitle}>
        Generate AI-powered standup updates from your git commits
      </p>

      {/* Auto-Context Section */}
      {renderAutoContextSummary()}

      {/* Quick Generate Button */}
      {canQuickGenerate && !results && (
        <div className={styles.quickGenerateSection}>
          <button
            className={styles.quickGenerateButton}
            onClick={handleQuickGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? "⏳ Generating..." : "⚡ Quick Generate"}
          </button>
          <p className={styles.quickGenerateHint}>
            One-click generation using auto-detected context
          </p>
        </div>
      )}

      {/* Divider */}
      {canQuickGenerate && !results && (
        <div className={styles.divider}>
          <span>or customize below</span>
        </div>
      )}

      {/* Mode Selector */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Mode</div>
        <ModeSelector 
          mode={mode === "auto" ? "single" : mode} 
          onModeChange={(m) => setMode(m as "single" | "multi")} 
        />
      </div>

      {/* Ticket Selector */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>{platform} Ticket</div>
        <TicketSelector
          tickets={linearTickets}
          selectedTicket={selectedTicket}
          onTicketChange={setSelectedTicket}
          isLoading={ticketsLoading}
        />
        {autoContext?.currentTicketId && !selectedTicket && (
          <button
            className={styles.useDetectedButton}
            onClick={() => setSelectedTicket(autoContext.currentTicketId!)}
          >
            Use detected: {autoContext.currentTicketId}
          </button>
        )}
      </div>

      {/* Manual Form */}
      <StandupForm
        timeWindow={timeWindow}
        targetBranch={targetBranch}
        tickets={tickets}
        mode={mode === "auto" ? "single" : mode}
        onTimeWindowChange={setTimeWindow}
        onTargetBranchChange={setTargetBranch}
        onTicketsChange={setTickets}
        onSubmit={handleSubmit}
        onOpenSettings={handleOpenSettings}
        isGenerating={isGenerating}
      />

      <ProgressIndicator
        message={progressMessage}
        visible={!!progressMessage}
      />

      {error && <div className={styles.error}>Error: {error}</div>}

      <ResultsDisplay
        results={results}
        onCopyAll={handleCopyAll}
        onCopyAnswers={handleCopyAnswers}
      />

      {results && (
        <CommitsAndFiles
          commits={results.commits}
          changedFiles={results.changedFiles}
          tickets={results.tickets}
          ticketActivity={results.ticketActivity}
        />
      )}
    </div>
  );
}

export default App;
