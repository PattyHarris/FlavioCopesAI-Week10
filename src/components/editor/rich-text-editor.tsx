"use client";

import { useEffect, useRef } from "react";

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
};

const formatActions = [
  { label: "B", command: "bold", title: "Bold" },
  { label: "I", command: "italic", title: "Italic" },
  { label: "U", command: "underline", title: "Underline" },
] as const;

const blockActions: Array<{
  label: string;
  command: string;
  title: string;
  value?: string;
}> = [
  { label: "H2", command: "formatBlock", value: "h2", title: "Heading" },
  { label: "P", command: "formatBlock", value: "p", title: "Paragraph" },
  { label: "• List", command: "insertUnorderedList", title: "Bulleted list" },
  { label: "Quote", command: "formatBlock", value: "blockquote", title: "Quote" },
];

export function RichTextEditor({ value, onChange, placeholder = "Write your campaign..." }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function syncValue() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function runCommand(command: string, commandValue?: string) {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncValue();
  }

  function insertLink() {
    focusEditor();
    const url = window.prompt("Enter a full URL for this link", "https://");

    if (!url) {
      return;
    }

    document.execCommand("createLink", false, url);
    syncValue();
  }

  function handleInput() {
    syncValue();
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar" role="toolbar" aria-label="Campaign formatting tools">
        <div className="rich-editor-group">
          {formatActions.map((action) => (
            <button
              className="rich-editor-button"
              key={action.command}
              onClick={() => runCommand(action.command)}
              title={action.title}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="rich-editor-group">
          {blockActions.map((action) => (
            <button
              className="rich-editor-button"
              key={`${action.command}-${action.label}`}
              onClick={() => runCommand(action.command, action.value)}
              title={action.title}
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
        <div className="rich-editor-group">
          <button className="rich-editor-button" onClick={insertLink} title="Insert link" type="button">
            Link
          </button>
        </div>
      </div>
      <div
        aria-label="Campaign body"
        className="rich-editor-surface"
        contentEditable
        data-placeholder={placeholder}
        onInput={handleInput}
        ref={editorRef}
        role="textbox"
        suppressContentEditableWarning
      />
    </div>
  );
}
