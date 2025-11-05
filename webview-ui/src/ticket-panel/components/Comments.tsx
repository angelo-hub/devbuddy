import React from "react";
import styles from "./Comments.module.css";

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    avatarUrl?: string;
  };
}

interface CommentsProps {
  comments?: {
    nodes: Comment[];
  };
}

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  if (seconds < 2592000) return `${Math.floor(seconds / 604800)}w ago`;
  return date.toLocaleDateString();
}

export const Comments: React.FC<CommentsProps> = ({ comments }) => {
  const commentCount = comments?.nodes?.length || 0;

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        <span className={styles.titleIcon}>💬</span>
        Comments ({commentCount})
      </h3>

      {commentCount === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No comments yet</p>
          <p className={styles.emptySubtext}>
            Use the comment form below to add the first comment
          </p>
        </div>
      ) : (
        <div className={styles.commentsList}>
          {comments!.nodes.map((comment) => (
            <div key={comment.id} className={styles.commentItem}>
              <div className={styles.commentHeader}>
                <div className={styles.userInfo}>
                  {comment.user?.avatarUrl && (
                    <img
                      src={comment.user.avatarUrl}
                      alt={comment.user.name}
                      className={styles.avatar}
                    />
                  )}
                  <span className={styles.userName}>
                    {comment.user?.name || "Unknown User"}
                  </span>
                  <span className={styles.timestamp}>
                    {formatRelativeTime(comment.createdAt)}
                  </span>
                </div>
              </div>
              <div className={styles.commentBody}>{comment.body}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

