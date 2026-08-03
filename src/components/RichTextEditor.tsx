import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "tiptap-markdown";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Undo2,
  Redo2,
  Code2,
  Eye,
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
  placeholder = "Digite a minuta em Markdown...",
  minHeight = "420px",
}: RichTextEditorProps) => {
  const [mode, setMode] = useState<"visual" | "code">("visual");

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Markdown.configure({
        html: false,
        transformCopiedText: true,
        transformPastedText: true,
      }),
    ],
    content: value || "",
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      const md = editor.storage.markdown?.getMarkdown() ?? editor.getText();
      onChange(md);
    },
  });

  // Synchronize external value changes to TipTap editor
  useEffect(() => {
    if (!editor) return;

    editor.setEditable(!readOnly);

    if (editor.isFocused) return;

    const currentMd = editor.storage.markdown?.getMarkdown() ?? editor.getText();

    if ((value || "").trim() !== (currentMd || "").trim()) {
      editor.commands.setContent(value || "");
    }
  }, [value, editor, readOnly]);

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
      <div className="rich-text-toolbar">
        {mode === "visual" && editor && !readOnly && (
          <>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              icon={Bold}
              title="Negrito (Ctrl+B)"
              isActive={editor.isActive("bold")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              icon={Italic}
              title="Itálico (Ctrl+I)"
              isActive={editor.isActive("italic")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              icon={Strikethrough}
              title="Riscado"
              isActive={editor.isActive("strike")}
            />

            <div className="toolbar-divider" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              icon={Heading1}
              title="Título 1 (#)"
              isActive={editor.isActive("heading", { level: 1 })}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              icon={Heading2}
              title="Título 2 (##)"
              isActive={editor.isActive("heading", { level: 2 })}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              icon={Heading3}
              title="Título 3 (###)"
              isActive={editor.isActive("heading", { level: 3 })}
            />

            <div className="toolbar-divider" />

            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              icon={List}
              title="Lista com pontos (-)"
              isActive={editor.isActive("bulletList")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              icon={ListOrdered}
              title="Lista numerada (1.)"
              isActive={editor.isActive("orderedList")}
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              icon={Quote}
              title="Citação (>)"
              isActive={editor.isActive("blockquote")}
            />

            <div className="toolbar-divider" />

            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              icon={Undo2}
              title="Desfazer (Ctrl+Z)"
            />
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              icon={Redo2}
              title="Refazer (Ctrl+Y)"
            />
          </>
        )}

        <div className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={() => setMode(mode === "visual" ? "code" : "visual")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-border bg-background hover:bg-secondary text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            title={mode === "visual" ? "Alternar para Código Markdown" : "Alternar para Editor Visual"}
          >
            {mode === "visual" ? (
              <>
                <Code2 className="h-3.5 w-3.5 text-primary" />
                <span>Markdown (Raw)</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-primary" />
                <span>Visual (Editor)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {mode === "visual" ? (
        <EditorContent
          editor={editor}
          className="rich-text-content"
          style={{ minHeight }}
        />
      ) : (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          placeholder={placeholder}
          className="raw-markdown-editor"
          style={{ minHeight }}
        />
      )}
    </div>
  );
};
