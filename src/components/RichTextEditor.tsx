import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Bold, Italic, List, ListOrdered, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: "text-primary underline" } }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: "min-h-[120px] w-full rounded-md bg-secondary border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring prose prose-invert prose-sm max-w-none",
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-1 flex-wrap">
        <Button type="button" variant={editor.isActive("bold") ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="h-3 w-3" />
        </Button>
        <Button type="button" variant={editor.isActive("italic") ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="h-3 w-3" />
        </Button>
        <Button type="button" variant={editor.isActive("bulletList") ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="h-3 w-3" />
        </Button>
        <Button type="button" variant={editor.isActive("orderedList") ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="h-3 w-3" />
        </Button>
        <Button type="button" variant={editor.isActive("link") ? "default" : "outline"} size="icon" className="h-7 w-7" onClick={addLink}>
          <LinkIcon className="h-3 w-3" />
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function RichTextDisplay({ content }: { content: string }) {
  if (!content) return null;
  return (
    <div
      className="prose prose-invert prose-sm max-w-none text-muted-foreground [&_a]:text-primary [&_a]:underline"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
