import React, { useState, useEffect } from "react";
import { useVSCode } from "@shared/hooks/useVSCode";
import {
  StandupBuilderMessageFromWebview,
  StandupBuilderMessageFromExtension,
  LinearTicket,
} from "../../shared/types/messages";
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
}

function App() {
  const { postMessage, onMessage } = useVSCode<
    StandupBuilderMessageFromExtension,
    StandupBuilderMessageFromWebview
  >();

  // Form state
  const [mode, setMode] = useState<"single" | "multi">("single");
  const [timeWindow, setTimeWindow] = useState("24 hours ago");
  const [targetBranch, setTargetBranch] = useState("main");
  const [tickets, setTickets] = useState("");
  const [selectedTicket, setSelectedTicket] = useState("");

  // Tickets state
  const [linearTickets, setLinearTickets] = useState<LinearTicket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [progressMessage, setProgressMessage] = useState("");
  const [error, setError] = useState("");

  // Results state
  const [results, setResults] = useState<ResultsData | null>(null);

  // Load tickets on mount
  useEffect(() => {
    postMessage({ command: "loadTickets" });
  }, [postMessage]);

  // Handle messages from extension
  useEffect(() => {
    return onMessage((message) => {
      switch (message.command) {
        case "ticketsLoaded":
          setLinearTickets(message.tickets);
          setTicketsLoading(false);
          if (message.error) {
            console.log("Failed to load tickets:", message.error);
          }
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
        mode,
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

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Standup Builder</h1>
      <p className={styles.subtitle}>
        Generate AI-powered standup updates from your git commits
      </p>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Linear Ticket</div>
        <TicketSelector
          tickets={linearTickets}
          selectedTicket={selectedTicket}
          onTicketChange={setSelectedTicket}
          isLoading={ticketsLoading}
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionTitle}>Mode</div>
        <ModeSelector mode={mode} onModeChange={setMode} />
      </div>

      <StandupForm
        timeWindow={timeWindow}
        targetBranch={targetBranch}
        tickets={tickets}
        mode={mode}
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
        />
      )}
    </div>
  );
}

export default App;

