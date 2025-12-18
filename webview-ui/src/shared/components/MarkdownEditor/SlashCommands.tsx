import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import { Extension } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { SuggestionProps, SuggestionKeyDownProps } from "@tiptap/suggestion";
import styles from "./SlashCommands.module.css";

// Command item type
interface CommandItem {
  title: string;
  description: string;
  icon: React.ReactNode;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  command: (props: { editor: any; range: any }) => void;
}

// All available slash commands
const commands: CommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="M17 10v8" />
        <path d="M17 10l3-2" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run();
    },
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 12h8" />
        <path d="M4 18V6" />
        <path d="M12 18V6" />
        <path d="M17.5 10.5c1.5-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
        <path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a bulleted list",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <circle cx="4" cy="6" r="1" fill="currentColor" />
        <circle cx="4" cy="12" r="1" fill="currentColor" />
        <circle cx="4" cy="18" r="1" fill="currentColor" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a numbered list",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="10" y1="6" x2="21" y2="6" />
        <line x1="10" y1="12" x2="21" y2="12" />
        <line x1="10" y1="18" x2="21" y2="18" />
        <text x="3" y="8" fontSize="8" fill="currentColor" stroke="none">1</text>
        <text x="3" y="14" fontSize="8" fill="currentColor" stroke="none">2</text>
        <text x="3" y="20" fontSize="8" fill="currentColor" stroke="none">3</text>
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Task List",
    description: "Create a task checklist",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="5" width="6" height="6" rx="1" />
        <path d="M5 11l1 1 2-2" />
        <rect x="3" y="13" width="6" height="6" rx="1" />
        <line x1="12" y1="8" x2="21" y2="8" />
        <line x1="12" y1="16" x2="21" y2="16" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: "Code Block",
    description: "Add a code snippet",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run();
    },
  },
  {
    title: "Quote",
    description: "Add a blockquote",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
        <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Divider",
    description: "Add a horizontal rule",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="2" y1="12" x2="22" y2="12" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setHorizontalRule().run();
    },
  },
  {
    title: "Table",
    description: "Insert a table",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    ),
    command: ({ editor, range }) => {
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run();
    },
  },
];

// Command list component props
interface CommandListProps {
  items: CommandItem[];
  command: (item: CommandItem) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  editor: any;
  clientRect: (() => DOMRect | null) | null;
}

// Ref type for command list
interface CommandListRef {
  onKeyDown: (props: SuggestionKeyDownProps) => boolean;
}

// Command list component
const CommandList = forwardRef<CommandListRef, CommandListProps>(
  ({ items, command, clientRect }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedIndex(0);
    }, [items]);

    // Update position based on clientRect
    useEffect(() => {
      if (clientRect) {
        const rect = clientRect();
        if (rect) {
          // For position: fixed, use viewport-relative coordinates directly
          // getBoundingClientRect() already returns viewport-relative values
          // eslint-disable-next-line react-hooks/set-state-in-effect
          setPosition({
            top: rect.bottom + 4,
            left: rect.left,
          });
        }
      }
    }, [clientRect]);

    // Scroll selected item into view
    useEffect(() => {
      const container = containerRef.current;
      if (!container) {
        return;
      }

      const selectedItem = container.children[selectedIndex] as HTMLElement;
      if (selectedItem) {
        selectedItem.scrollIntoView({ block: "nearest" });
      }
    }, [selectedIndex]);

    const selectItem = useCallback(
      (index: number) => {
        const item = items[index];
        if (item) {
          command(item);
        }
      },
      [items, command]
    );

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }: SuggestionKeyDownProps) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) => (prev + items.length - 1) % items.length);
          return true;
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) => (prev + 1) % items.length);
          return true;
        }

        if (event.key === "Enter") {
          selectItem(selectedIndex);
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div 
          className={styles.commandList}
          style={{ 
            position: "fixed",
            top: `${position.top}px`, 
            left: `${position.left}px` 
          }}
        >
          <div className={styles.noResults}>No commands found</div>
        </div>
      );
    }

    return (
      <div 
        className={styles.commandList} 
        ref={containerRef}
        style={{ 
          position: "fixed",
          top: `${position.top}px`, 
          left: `${position.left}px` 
        }}
      >
        {items.map((item, index) => (
          <button
            key={item.title}
            type="button"
            className={`${styles.commandItem} ${index === selectedIndex ? styles.selected : ""}`}
            onClick={() => selectItem(index)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <div className={styles.commandIcon}>{item.icon}</div>
            <div className={styles.commandContent}>
              <div className={styles.commandTitle}>{item.title}</div>
              <div className={styles.commandDescription}>{item.description}</div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

CommandList.displayName = "CommandList";

// Render function for suggestion popup
const renderSuggestion = () => {
  let component: ReactRenderer<CommandListRef> | null = null;
  let popup: HTMLDivElement | null = null;

  return {
    onStart: (props: SuggestionProps<CommandItem>) => {
      // Create popup container
      popup = document.createElement("div");
      popup.style.position = "fixed";
      popup.style.zIndex = "9999";
      document.body.appendChild(popup);

      // Create React component
      component = new ReactRenderer(CommandList, {
        props: {
          items: props.items,
          command: props.command,
          editor: props.editor,
          clientRect: props.clientRect,
        },
        editor: props.editor,
      });

      // Append component to popup
      if (popup && component.element) {
        popup.appendChild(component.element);
      }
    },

    onUpdate: (props: SuggestionProps<CommandItem>) => {
      if (component) {
        component.updateProps({
          items: props.items,
          command: props.command,
          editor: props.editor,
          clientRect: props.clientRect,
        });
      }
    },

    onKeyDown: (props: SuggestionKeyDownProps) => {
      if (props.event.key === "Escape") {
        popup?.remove();
        component?.destroy();
        popup = null;
        component = null;
        return true;
      }

      return component?.ref?.onKeyDown(props) ?? false;
    },

    onExit: () => {
      popup?.remove();
      component?.destroy();
      popup = null;
      component = null;
    },
  };
};

// Complete suggestion configuration
export const slashCommandsSuggestion = {
  char: "/",
  startOfLine: false,
  allowSpaces: false,
  items: ({ query }: { query: string }) => {
    return commands.filter((item) =>
      item.title.toLowerCase().includes(query.toLowerCase())
    );
  },
  render: renderSuggestion,
  command: ({
    editor,
    range,
    props,
  }: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editor: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    range: any;
    props: CommandItem;
  }) => {
    props.command({ editor, range });
  },
};

// Slash commands extension
export const SlashCommands = Extension.create({
  name: "slashCommands",

  addOptions() {
    return {
      suggestion: slashCommandsSuggestion,
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
      }),
    ];
  },
});

export default SlashCommands;
