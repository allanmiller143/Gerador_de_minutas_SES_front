import { useRef, useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "./RichTextEditor.css";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  minHeight?: string;
}

export const RichTextEditor = ({
  value,
  onChange,
  readOnly = false,
  placeholder = "Digite aqui...",
  minHeight = "420px",
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const isInitialized = useRef(false);

  useEffect(() => {
    if (editorRef.current) {
      const isFocused = document.activeElement === editorRef.current;
      if (!isFocused && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.contentEditable = !readOnly ? "true" : "false";
    }
  }, [readOnly]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    isActive = false,
  }: {
    onClick: () => void;
    icon: any;
    title: string;
    isActive?: boolean;
  }) => (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        onClick();
      }}
      title={title}
      disabled={readOnly}
      className={cn(
        "p-2 rounded transition-colors text-sm hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed",
        isActive && "bg-primary text-primary-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );

  return (
    <div className="rich-text-editor-container" data-readonly={readOnly}>
      {!readOnly && (
        <div className="rich-text-toolbar">
          <ToolbarButton
            onClick={() => execCommand("bold")}
            icon={Bold}
            title="Negrito (Ctrl+B)"
          />
          <ToolbarButton
            onClick={() => execCommand("italic")}
            icon={Italic}
            title="Itálico (Ctrl+I)"
          />
          <ToolbarButton
            onClick={() => execCommand("strikeThrough")}
            icon={Strikethrough}
            title="Riscado"
          />

          <div className="toolbar-divider" />

          <ToolbarButton
            onClick={() => execCommand("formatBlock", "h1")}
            icon={Heading1}
            title="Título 1"
          />
          <ToolbarButton
            onClick={() => execCommand("formatBlock", "h2")}
            icon={Heading2}
            title="Título 2"
          />

          <div className="toolbar-divider" />

          <ToolbarButton
            onClick={() => execCommand("insertUnorderedList")}
            icon={List}
            title="Lista com pontos"
          />
          <ToolbarButton
            onClick={() => execCommand("insertOrderedList")}
            icon={ListOrdered}
            title="Lista numerada"
          />
          <ToolbarButton
            onClick={() => execCommand("formatBlock", "blockquote")}
            icon={Quote}
            title="Citação"
          />

          <div className="toolbar-divider" />

          <ToolbarButton
            onClick={() => execCommand("undo")}
            icon={Undo2}
            title="Desfazer"
          />
          <ToolbarButton
            onClick={() => execCommand("redo")}
            icon={Redo2}
            title="Refazer"
          />
        </div>
      )}

      <div
        ref={editorRef}
        onInput={handleInput}
        className="rich-text-content"
        style={{ minHeight }}
        suppressContentEditableWarning
      />
    </div>
  );
};
