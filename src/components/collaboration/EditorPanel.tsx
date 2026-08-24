"use client";

import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { useEffect, useRef, useCallback } from "react";
import { defineMonacoThemes, LANGUAGE_CONFIG } from "@/app/(root)/_constants";
import { Editor, OnMount } from "@monaco-editor/react";
import { useSocketCollaborationStore } from "@/store/useSocketCollaborationStore";
import type * as MonacoType from "monaco-editor";

// Inject per-user cursor CSS (once per color)
const injectedClasses = new Set<string>();
function injectCursorStyle(color: string, userId: string) {
  const className = `remote-cursor-${userId.replace(/[^a-zA-Z0-9]/g, "_")}`;
  if (injectedClasses.has(className)) return className;
  injectedClasses.add(className);
  const s = document.createElement("style");
  s.textContent = `
    .${className}-cursor { border-left: 2px solid ${color} !important; }
    .${className}-label {
      background: ${color}; color: #fff; font-size: 10px; font-weight: 600;
      padding: 1px 4px; border-radius: 2px; white-space: nowrap;
      position: absolute; top: -16px; pointer-events: none;
    }
  `;
  document.head.appendChild(s);
  return className;
}

const CollaborationEditorPanel = () => {
  const { language, theme, fontSize, editor, setEditor } = useCodeEditorStore();
  const {
    sendCodeChange,
    sendCursorChange,
    cursors,
    isInRoom,
    remoteCode,
    setRemoteCode,
  } = useSocketCollaborationStore();

  // Flag to suppress sendCodeChange when WE applied a remote change
  const isApplyingRemote = useRef(false);

  const decorationCollections = useRef<
    Record<string, MonacoType.editor.IEditorDecorationsCollection>
  >({});

  // ── Apply remote code from store (room-state / code-update) ─────────────
  // This is the ONLY place editor.setValue() is called for remote content.
  // isApplyingRemote prevents the onChange handler from echoing it back.
  useEffect(() => {
    if (!editor || remoteCode === null) return;
    isApplyingRemote.current = true;
    const pos = editor.getPosition();
    editor.setValue(remoteCode);
    if (pos) editor.setPosition(pos);
    setRemoteCode(null);
    // Monaco fires onChange synchronously inside setValue, so by the time
    // we reach here onChange has already been suppressed. Reset the flag.
    isApplyingRemote.current = false;
  }, [remoteCode, editor, setRemoteCode]);

  // ── Apply local saved code on language switch (only when NOT in a room) ──
  useEffect(() => {
    if (!editor || isInRoom) return; // Room code comes from server, not localStorage
    isApplyingRemote.current = true;
    const savedCode = localStorage.getItem(`editor-code-${language}`);
    editor.setValue(savedCode || LANGUAGE_CONFIG[language].defaultCode);
    isApplyingRemote.current = false;
  }, [language, editor, isInRoom]);

  // ── Remote cursor decorations ────────────────────────────────────────────
  useEffect(() => {
    if (!editor) return;
    const activeIds = new Set(Object.keys(cursors));

    for (const uid of Object.keys(decorationCollections.current)) {
      if (!activeIds.has(uid)) {
        decorationCollections.current[uid].clear();
        delete decorationCollections.current[uid];
      }
    }

    for (const [uid, cursor] of Object.entries(cursors)) {
      const cls = injectCursorStyle(cursor.color, uid);
      const decorations: MonacoType.editor.IModelDeltaDecoration[] = [{
        range: new (window as any).monaco.Range(
          cursor.lineNumber, cursor.column, cursor.lineNumber, cursor.column
        ),
        options: {
          className: `${cls}-cursor`,
          beforeContentClassName: `${cls}-cursor`,
          stickiness: (window as any).monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
          hoverMessage: { value: cursor.userName },
        },
      }];

      if (!decorationCollections.current[uid]) {
        decorationCollections.current[uid] = editor.createDecorationsCollection(decorations);
      } else {
        decorationCollections.current[uid].set(decorations);
      }
    }
  }, [cursors, editor]);

  // ── User types → send to room, save to localStorage ─────────────────────
  const handleEditorChange = useCallback((value: string | undefined) => {
    if (isApplyingRemote.current || value === undefined) return; // suppress echo
    localStorage.setItem(`editor-code-${language}`, value);
    if (isInRoom) sendCodeChange(value);
  }, [language, isInRoom, sendCodeChange]);

  const handleEditorMount: OnMount = useCallback((mountedEditor) => {
    setEditor(mountedEditor);
    mountedEditor.onDidChangeCursorPosition((e) => {
      if (isInRoom) {
        sendCursorChange(e.position.lineNumber, e.position.column);
      }
    });
  }, [setEditor, isInRoom, sendCursorChange]);

  return (
    <div className="flex-1 relative overflow-hidden">
      <Editor
        height="100%"
        language={LANGUAGE_CONFIG[language]?.monacoLanguage ?? "javascript"}
        onChange={handleEditorChange}
        theme={theme}
        beforeMount={defineMonacoThemes}
        onMount={handleEditorMount}
        options={{
          minimap: { enabled: true },
          fontSize,
          automaticLayout: true,
          scrollBeyondLastLine: false,
          padding: { top: 16, bottom: 16 },
          renderWhitespace: "selection",
          fontFamily: '"Fira Code", "Cascadia Code", Consolas, monospace',
          fontLigatures: true,
          cursorBlinking: "smooth",
          smoothScrolling: true,
          contextmenu: true,
          renderLineHighlight: "all",
          lineHeight: 1.6,
          letterSpacing: 0.5,
          roundedSelection: true,
          scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
        }}
      />
    </div>
  );
};

export default CollaborationEditorPanel;
