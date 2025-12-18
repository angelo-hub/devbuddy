import React, { useEffect, useRef } from "react";
import { useEditor, EditorContent, ReactNodeViewRenderer } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { Table, TableRow, TableCell, TableHeader } from "@tiptap/extension-table";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { Markdown } from "tiptap-markdown";
import { FloatingToolbar } from "./FloatingToolbar";
import { SlashCommands } from "./SlashCommands";
import { CodeBlockComponent } from "./CodeBlockComponent";
import styles from "./MarkdownEditor.module.css";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  autoFocus?: boolean;
  disabled?: boolean;
}

export const MarkdownEditor: React.FC<MarkdownEditorProps> = ({
  value,
  onChange,
  placeholder = "Write something...",
  minHeight = 150,
  autoFocus = false,
  disabled = false,
}) => {
  // Ref to prevent infinite loops when syncing content
  const isUpdatingRef = useRef(false);
  // Ref to store the last value we set programmatically
  const lastValueRef = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Configure heading levels
        heading: {
          levels: [1, 2, 3],
        },
        // Disable default codeBlock - we use CodeBlockLowlight instead
        codeBlock: false,
        // Configure horizontal rule
        horizontalRule: {},
        // Configure blockquote
        blockquote: {},
      }),
      // Code blocks with syntax highlighting
      CodeBlockLowlight.extend({
        addNodeView() {
          return ReactNodeViewRenderer(CodeBlockComponent);
        },
      }).configure({
        lowlight,
        defaultLanguage: "text",
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: styles.link,
        },
      }),
      Placeholder.configure({
        placeholder,
        emptyEditorClass: styles.isEmpty,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableCell,
      TableHeader,
      // Markdown extension for serialization/deserialization
      Markdown.configure({
        html: false, // Don't allow HTML
        tightLists: true,
        tightListClass: "tight",
        bulletListMarker: "-",
        linkify: false, // We use our own Link extension
        breaks: true,
        transformPastedText: true,
        transformCopiedText: true,
      }),
      // Slash commands
      SlashCommands,
    ],
    content: value,
    editable: !disabled,
    autofocus: autoFocus ? "end" : false,
    editorProps: {
      attributes: {
        class: styles.editor,
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      // Skip if we're in the middle of a programmatic update
      if (isUpdatingRef.current) {
        return;
      }
      
      // Get markdown content using tiptap-markdown storage
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const storage = editor.storage as any;
      const markdown = storage.markdown?.getMarkdown?.() ?? "";
      lastValueRef.current = markdown;
      onChange(markdown);
    },
  });

  // Update content when value prop changes (external updates)
  useEffect(() => {
    if (editor && value !== lastValueRef.current) {
      // Mark that we're doing a programmatic update
      isUpdatingRef.current = true;
      editor.commands.setContent(value);
      lastValueRef.current = value;
      // Reset the flag after a tick to allow future user edits
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 0);
    }
  }, [editor, value]);

  // Update editable state
  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return (
      <div className={styles.container} style={{ minHeight }}>
        <div className={styles.loading}>Loading editor...</div>
      </div>
    );
  }

  return (
    <div className={`${styles.container} ${disabled ? styles.disabled : ""}`}>
      <FloatingToolbar editor={editor} />
      <EditorContent editor={editor} className={styles.editorContent} />
      <div className={styles.hint}>
        Type <code>/</code> for commands, or use Markdown shortcuts
      </div>
    </div>
  );
};

export default MarkdownEditor;
