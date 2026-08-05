"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Pilcrow,
  Quote,
  Underline,
} from "lucide-react";

import { ImageGalleryDialog } from "@/features/media/components/image-gallery-dialog";
import { cn } from "@/lib/utils";

/**
 * A dependency-free WYSIWYG editor built on `contentEditable` + `execCommand`.
 * It's uncontrolled: the initial HTML is written once on mount so the caret
 * never jumps, and every edit is pushed up through `onChange`. Output is a
 * plain HTML string rendered later inside the scoped `.rich-text` prose style.
 */
export function RichTextEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (html: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const savedRange = useRef<Range | null>(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Seed the editor once. We deliberately don't sync `value` back in on every
  // render — doing so would reset the caret to the start mid-typing.
  useEffect(() => {
    if (ref.current) ref.current.innerHTML = value || "";
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const emit = () => onChange(ref.current?.innerHTML ?? "");

  // Remember the caret/selection so it survives losing focus (e.g. opening the
  // image gallery dialog), then restore it before inserting content.
  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount && ref.current?.contains(sel.anchorNode)) {
      savedRange.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    ref.current?.focus();
    const sel = window.getSelection();
    if (sel && savedRange.current) {
      sel.removeAllRanges();
      sel.addRange(savedRange.current);
    }
  };

  const exec = (command: string, arg?: string) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL", "https://");
    if (url) exec("createLink", url);
  };

  const insertImage = (url: string) => {
    restoreSelection();
    document.execCommand("insertImage", false, url);
    emit();
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-subtle/60 p-1">
        <ToolButton label="Bold" onClick={() => exec("bold")}>
          <Bold className="size-4" />
        </ToolButton>
        <ToolButton label="Italic" onClick={() => exec("italic")}>
          <Italic className="size-4" />
        </ToolButton>
        <ToolButton label="Underline" onClick={() => exec("underline")}>
          <Underline className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Heading" onClick={() => exec("formatBlock", "H2")}>
          <Heading2 className="size-4" />
        </ToolButton>
        <ToolButton label="Subheading" onClick={() => exec("formatBlock", "H3")}>
          <Heading3 className="size-4" />
        </ToolButton>
        <ToolButton label="Paragraph" onClick={() => exec("formatBlock", "P")}>
          <Pilcrow className="size-4" />
        </ToolButton>
        <ToolButton label="Quote" onClick={() => exec("formatBlock", "BLOCKQUOTE")}>
          <Quote className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Bulleted list" onClick={() => exec("insertUnorderedList")}>
          <List className="size-4" />
        </ToolButton>
        <ToolButton label="Numbered list" onClick={() => exec("insertOrderedList")}>
          <ListOrdered className="size-4" />
        </ToolButton>
        <Divider />
        <ToolButton label="Add link" onClick={addLink}>
          <Link2 className="size-4" />
        </ToolButton>
        <ToolButton
          label="Insert image"
          onClick={() => {
            saveSelection();
            setGalleryOpen(true);
          }}
        >
          <ImagePlus className="size-4" />
        </ToolButton>
      </div>

      {/* Editable surface — shares the `.rich-text` prose style with the render. */}
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        role="textbox"
        aria-multiline="true"
        onInput={emit}
        onBlur={saveSelection}
        onKeyUp={saveSelection}
        onMouseUp={saveSelection}
        className="rich-text min-h-40 max-h-[28rem] overflow-y-auto bg-white px-4 py-3 text-sm outline-none"
      />

      <ImageGalleryDialog
        open={galleryOpen}
        onOpenChange={setGalleryOpen}
        selectedUrls={[]}
        onSelect={(files) => files[0] && insertImage(files[0].url)}
      />
    </div>
  );
}

function ToolButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      // Keep the editor's selection: mousedown default would blur it before the
      // command runs, so the formatting would apply to nothing.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors",
        "hover:bg-white hover:text-ink hover:shadow-sm",
      )}
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />;
}
