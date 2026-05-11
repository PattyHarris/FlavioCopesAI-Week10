"use client";

import { useEffect, useRef, useState } from "react";

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
  const [activeStates, setActiveStates] = useState({
    bold: false,
    italic: false,
    underline: false,
    unorderedList: false,
    heading: false,
    paragraph: true,
    quote: false,
  });

  useEffect(() => {
    const editor = editorRef.current;

    if (!editor) {
      return;
    }

    if (editor.innerHTML !== value) {
      editor.innerHTML = value || "";
    }
  }, [value]);

  useEffect(() => {
    function syncToolbarState() {
      const editor = editorRef.current;
      const selection = window.getSelection();

      if (!editor || !selection || selection.rangeCount === 0) {
        return;
      }

      const anchorNode = selection.anchorNode;

      if (anchorNode && !editor.contains(anchorNode)) {
        return;
      }

      const block = anchorNode instanceof Element ? anchorNode.closest("h2, p, blockquote") : anchorNode?.parentElement?.closest("h2, p, blockquote");
      const blockTag = block?.tagName?.toLowerCase() ?? "p";

      setActiveStates({
        bold: document.queryCommandState("bold"),
        italic: document.queryCommandState("italic"),
        underline: document.queryCommandState("underline"),
        unorderedList: document.queryCommandState("insertUnorderedList"),
        heading: blockTag === "h2",
        paragraph: blockTag === "p",
        quote: blockTag === "blockquote",
      });
    }

    document.addEventListener("selectionchange", syncToolbarState);
    return () => document.removeEventListener("selectionchange", syncToolbarState);
  }, []);

  function focusEditor() {
    editorRef.current?.focus();
  }

  function syncValue() {
    onChange(editorRef.current?.innerHTML ?? "");
  }

  function refreshToolbarState() {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return;
    }

    document.dispatchEvent(new Event("selectionchange"));
  }

  function runCommand(command: string, commandValue?: string) {
    focusEditor();
    document.execCommand(command, false, commandValue);
    syncValue();
    refreshToolbarState();
  }

  function handleBlockAction(label: string, command: string, commandValue?: string) {
    const isHeading = label === "H2" && activeStates.heading;
    const isQuote = label === "Quote" && activeStates.quote;

    if (isHeading || isQuote) {
      runCommand("formatBlock", "p");
      return;
    }

    runCommand(command, commandValue);
  }

  function insertLink() {
    focusEditor();
    const url = window.prompt("Enter a full URL for this link", "https://");

    if (!url) {
      return;
    }

    document.execCommand("createLink", false, url);
    syncValue();
    refreshToolbarState();
  }

  function handleInput() {
    syncValue();
    refreshToolbarState();
  }

  return (
    <div className="rich-editor">
      <div className="rich-editor-toolbar" role="toolbar" aria-label="Campaign formatting tools">
        <div className="rich-editor-group">
          {formatActions.map((action) => (
            <button
              className={`rich-editor-button ${activeStates[action.command as keyof typeof activeStates] ? "rich-editor-button-active" : ""}`}
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
              className={`rich-editor-button ${
                (action.label === "H2" && activeStates.heading) ||
                (action.label === "P" && activeStates.paragraph) ||
                (action.label === "• List" && activeStates.unorderedList) ||
                (action.label === "Quote" && activeStates.quote)
                  ? "rich-editor-button-active"
                  : ""
              }`}
              key={`${action.command}-${action.label}`}
              onClick={() => handleBlockAction(action.label, action.command, action.value)}
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
