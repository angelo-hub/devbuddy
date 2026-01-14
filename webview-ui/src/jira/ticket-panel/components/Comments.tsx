import React from "react";
import { renderADF } from "@shared/utils/adfRenderer";
import type { EnrichedTicketMetadata } from "@shared/types/messages";
import styles from "./Comments.module.css";

interface Comment {
  id: string;
  body: string;
  author: {
    accountId: string;
    displayName: string;
    avatarUrls?: {
      "48x48"?: string;
    };
  };
  created: string;
  updated: string;
}

interface CommentsProps {
  comments: Comment[];
  onTicketClick?: (ticketId: string) => void;
  enrichedMetadata?: Map<string, EnrichedTicketMetadata>;
}

export const Comments: React.FC<CommentsProps> = ({ comments, onTicketClick, enrichedMetadata }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return "Today";
    } else if (days === 1) {
      return "Yesterday";
    } else if (days < 7) {
      return `${days} days ago`;
    } else {
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
      });
    }
  };

  const renderCommentBody = (body: string) => {
    try {
      const adf = JSON.parse(body);
      if (adf && adf.type === "doc") {
        return renderADF(adf, { enrichedMetadata, onTicketClick });
      }
      return body;
    } catch {
      return body;
    }
  };

  if (!comments || comments.length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.heading}>Comments</h3>
        <p className={styles.emptyState}>No comments yet</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.heading}>Comments ({comments.length})</h3>
      <div className={styles.commentsList}>
        {comments.map((comment) => (
          <div key={comment.id} className={styles.comment}>
            <div className={styles.commentHeader}>
              <div className={styles.authorInfo}>
                {comment.author.avatarUrls?.["48x48"] && (
                  <img
                    src={comment.author.avatarUrls["48x48"]}
                    alt={comment.author.displayName}
                    className={styles.avatar}
                  />
                )}
                <span className={styles.authorName}>{comment.author.displayName}</span>
              </div>
              <span className={styles.date}>{formatDate(comment.created)}</span>
            </div>
            <div className={styles.commentBody}>{renderCommentBody(comment.body)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

