import React, { useState } from "react";
import styles from "./ShareButton.module.css";

interface ShareButtonProps {
  identifier: string;
  url?: string;
}

export const ShareButton: React.FC<ShareButtonProps> = ({ identifier, url }) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipText, setTooltipText] = useState("Copy ticket ID");

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setTooltipText(`Copied ${label}!`);
      setTimeout(() => {
        setTooltipText(label === "ID" ? "Copy ticket ID" : "Copy ticket URL");
      }, 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
      setTooltipText("Failed to copy");
      setTimeout(() => {
        setTooltipText(label === "ID" ? "Copy ticket ID" : "Copy ticket URL");
      }, 2000);
    }
  };

  const handleCopyId = (e: React.MouseEvent) => {
    e.preventDefault();
    copyToClipboard(identifier, "ID");
  };

  const handleCopyUrl = (e: React.MouseEvent) => {
    e.preventDefault();
    if (url) {
      copyToClipboard(url, "URL");
    }
  };

  return (
    <div className={styles.shareContainer}>
      <button
        className={styles.shareButton}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onClick={handleCopyId}
        title="Copy ticket ID"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
        </svg>
      </button>

      {url && (
        <button
          className={styles.shareButton}
          onMouseEnter={() => {
            setShowTooltip(true);
            setTooltipText("Copy ticket URL");
          }}
          onMouseLeave={() => {
            setShowTooltip(false);
            setTooltipText("Copy ticket ID");
          }}
          onClick={handleCopyUrl}
          title="Copy ticket URL"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path>
          </svg>
        </button>
      )}

      {showTooltip && (
        <div className={styles.tooltip}>
          {tooltipText}
        </div>
      )}
    </div>
  );
};

