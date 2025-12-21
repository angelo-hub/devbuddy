import React, { useEffect } from "react";
import { ModeSelector } from "./components/ModeSelector";
import { TicketSelector } from "./components/TicketSelector";
import { StandupForm } from "./components/StandupForm";
import { ProgressIndicator } from "./components/ProgressIndicator";
import { ResultsDisplay } from "./components/ResultsDisplay";
import { CommitsAndFiles } from "./components/CommitsAndFiles";
import {
  useMode,
  useTimeWindow,
  useTargetBranch,
  useTickets,
  useSelectedTicket,
  useLinearTickets,
  useTicketsLoading,
  useIsGenerating,
  useProgressMessage,
  useError,
  useResults,
  useStandupBuilderActions,
} from "../../standup-builder/store";
import styles from "./App.module.css";

function App() {
  // State from store
  const mode = useMode();
  const timeWindow = useTimeWindow();
  const targetBranch = useTargetBranch();
  const tickets = useTickets();
  const selectedTicket = useSelectedTicket();
  const linearTickets = useLinearTickets();
  const ticketsLoading = useTicketsLoading();
  const isGenerating = useIsGenerating();
  const progressMessage = useProgressMessage();
  const error = useError();
  const results = useResults();

  // Actions from store
  const {
    init,
    setMode,
    setTimeWindow,
    setTargetBranch,
    setTickets,
    setSelectedTicket,
    generate,
    copyAll,
    copyAnswers,
    openSettings,
  } = useStandupBuilderActions();

  // Initialize store
  useEffect(() => {
    return init();
  }, [init]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    generate();
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
        onOpenSettings={openSettings}
        isGenerating={isGenerating}
      />

      <ProgressIndicator message={progressMessage} visible={!!progressMessage} />

      {error && <div className={styles.error}>Error: {error}</div>}

      <ResultsDisplay
        results={results}
        onCopyAll={copyAll}
        onCopyAnswers={copyAnswers}
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
