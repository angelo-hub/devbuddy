import React, { useState, useRef, useEffect } from "react";
import { Editor, useEditorState } from "@tiptap/react";
import { BubbleMenu } from "@tiptap/react/menus";
import styles from "./FloatingToolbar.module.css";

interface FloatingToolbarProps {
  editor: Editor;
}

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  editor,
}) => {
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const linkInputRef = useRef<HTMLInputElement>(null);

  // Use useEditorState for reactive updates
  const { isBold, isItalic, isStrike, isCode, isLink, isCodeBlock, isBlockquote } = useEditorState({
    editor,
    selector: (ctx) => ({
      isBold: ctx.editor.isActive("bold"),
      isItalic: ctx.editor.isActive("italic"),
      isStrike: ctx.editor.isActive("strike"),
      isCode: ctx.editor.isActive("code"),
      isLink: ctx.editor.isActive("link"),
      isCodeBlock: ctx.editor.isActive("codeBlock"),
      isBlockquote: ctx.editor.isActive("blockquote"),
    }),
  });

  // Focus input when shown
  useEffect(() => {
    if (showLinkInput && linkInputRef.current) {
      // Get existing link URL if editing
      const existingUrl = editor.getAttributes("link").href || "";
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLinkUrl(existingUrl);
      linkInputRef.current.focus();
      linkInputRef.current.select();
    }
  }, [showLinkInput, editor]);

  const handleLinkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (linkUrl.trim() === "") {
      // Remove link if URL is empty
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
    } else {
      // Set link
      editor.chain().focus().extendMarkRange("link").setLink({ href: linkUrl.trim() }).run();
    }
    
    setShowLinkInput(false);
    setLinkUrl("");
  };

  const handleLinkCancel = () => {
    setShowLinkInput(false);
    setLinkUrl("");
    editor.chain().focus().run();
  };

  const handleRemoveLink = () => {
    editor.chain().focus().extendMarkRange("link").unsetLink().run();
    setShowLinkInput(false);
    setLinkUrl("");
  };

  if (!editor) {
    return null;
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{
        placement: "top",
        offset: 8,
        flip: true,
      }}
      shouldShow={({ editor: ed, state }: { editor: Editor; state: any }) => {
        // Don't show if selection is empty
        if (state.selection.empty) {
          return false;
        }
        // Don't show inside code blocks
        if (ed.isActive("codeBlock")) {
          return false;
        }
        return true;
      }}
    >
      <div className={styles.toolbar}>
        {showLinkInput ? (
          <form onSubmit={handleLinkSubmit} className={styles.linkForm}>
            <input
              ref={linkInputRef}
              type="url"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder="https://example.com"
              className={styles.linkInput}
              onKeyDown={(e) => {
                if (e.key === "Escape") {
                  handleLinkCancel();
                }
              }}
            />
            <button type="submit" className={styles.linkButton} title="Apply">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </button>
            {isLink && (
              <button
                type="button"
                onClick={handleRemoveLink}
                className={styles.linkButton}
                title="Remove link"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleLinkCancel}
              className={styles.linkButton}
              title="Cancel"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          </form>
        ) : (
          <>
            {/* Bold */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`${styles.button} ${isBold ? styles.active : ""}`}
              title="Bold (Cmd+B)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
                <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z" />
              </svg>
            </button>

            {/* Italic */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`${styles.button} ${isItalic ? styles.active : ""}`}
              title="Italic (Cmd+I)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="4" x2="10" y2="4" />
                <line x1="14" y1="20" x2="5" y2="20" />
                <line x1="15" y1="4" x2="9" y2="20" />
              </svg>
            </button>

            {/* Strikethrough */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`${styles.button} ${isStrike ? styles.active : ""}`}
              title="Strikethrough"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <path d="M16 6C16 6 14.5 4 12 4C9.5 4 7 5.5 7 8C7 10.5 9 11 12 12" />
                <path d="M8 18C8 18 9.5 20 12 20C14.5 20 17 18.5 17 16C17 13.5 15 13 12 12" />
              </svg>
            </button>

            <div className={styles.divider} />

            {/* Inline Code */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCode().run()}
              className={`${styles.button} ${isCode ? styles.active : ""}`}
              title="Inline Code"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </button>

            {/* Link */}
            <button
              type="button"
              onClick={() => setShowLinkInput(true)}
              className={`${styles.button} ${isLink ? styles.active : ""}`}
              title="Link (Cmd+K)"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
            </button>

            <div className={styles.divider} />

            {/* Code Block */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleCodeBlock().run()}
              className={`${styles.button} ${isCodeBlock ? styles.active : ""}`}
              title="Code Block"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <polyline points="9 10 7 12 9 14" />
                <polyline points="15 10 17 12 15 14" />
              </svg>
            </button>

            {/* Blockquote */}
            <button
              type="button"
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`${styles.button} ${isBlockquote ? styles.active : ""}`}
              title="Quote"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
                <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
              </svg>
            </button>
          </>
        )}
      </div>
    </BubbleMenu>
  );
};

export default FloatingToolbar;
