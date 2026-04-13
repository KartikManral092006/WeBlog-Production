"use client";

import { useEffect } from "react";
import { Editor, EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Link from "@tiptap/extension-link";

type BlogRichEditorProps = {
  value: string;
  placeholder: string;
  onChange: (html: string, text: string) => void;
  onEditorReady?: (editor: Editor | null) => void;
};

export function BlogRichEditor({
  value,
  placeholder,
  onChange,
  onEditorReady,
}: BlogRichEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        protocols: ["http", "https", "mailto"],
      }),
    ],
    content: value || "",
    onUpdate: ({ editor: activeEditor }) => {
      onChange(activeEditor.getHTML(), activeEditor.getText());
    },
    editorProps: {
      attributes: {
        class: "blog-rich-editor",
      },
    },
  });

  useEffect(() => {
    onEditorReady?.(editor ?? null);
    return () => {
      onEditorReady?.(null);
    };
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHtml = editor.getHTML();
    if (value !== currentHtml) {
      editor.commands.setContent(value || "<p></p>", { emitUpdate: false });
    }
  }, [editor, value]);

  return <EditorContent editor={editor} />;
}
