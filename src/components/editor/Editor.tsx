"use client"

import { useEffect } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import Collaboration from '@tiptap/extension-collaboration'
import { CustomCursor } from './CustomCursor'
import Placeholder from '@tiptap/extension-placeholder'
import * as Y from 'yjs'
import { Awareness } from 'y-protocols/awareness'
import { Bold, Italic, Strikethrough, Heading1, Heading2, List, ListOrdered, Quote, Code } from 'lucide-react'

import type { Editor as TipTapEditor } from '@tiptap/core'

interface EditorProps {
  doc: Y.Doc
  awareness: Awareness | null
  user: { id: string, name: string | null }
  onEditorReady?: (editor: TipTapEditor) => void
}

export default function Editor({ doc, awareness, user, onEditorReady }: EditorProps) {
  useEffect(() => {
    if (awareness) {
      const colors = ['#f783ac', '#8ce99a', '#74c0fc', '#ffa94d', '#c0eb75', '#ffc078']
      const color = colors[Math.abs(user.id.charCodeAt(0)) % colors.length]
      
      awareness.setLocalStateField('user', {
        name: user.name || 'Anonymous',
        color,
      })
    }
  }, [awareness, user])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Collaboration provides its own Yjs-based undo/redo. In TipTap v3 the
        // StarterKit history extension was renamed to `undoRedo`; disabling it
        // avoids "not compatible with @tiptap/extension-undo-redo" and prevents
        // two competing undo stacks.
        undoRedo: false,
      }),
      Collaboration.configure({
        document: doc,
        field: 'content',
      }),
      ...(awareness ? [
        CustomCursor.configure({
          provider: { awareness },
          user: { name: user.name || 'Anonymous', color: '#f783ac' }
        })
      ] : []),
      Placeholder.configure({
        placeholder: 'Press / for commands, or start typing...',
      }),
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-zinc dark:prose-invert max-w-none focus:outline-none min-h-[500px] prose-p:leading-relaxed prose-headings:font-semibold prose-pre:bg-zinc-100 dark:prose-pre:bg-zinc-900 *:bg-transparent *:!text-zinc-900 dark:*:!text-zinc-100',
      },
    },
    onCreate: ({ editor }) => {
      onEditorReady?.(editor)
    }
  })

  // Also call onEditorReady whenever editor changes
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor)
    }
  }, [editor, onEditorReady])

  return (
    <div className="w-full relative group">
      {editor && (
        <BubbleMenu editor={editor} className="flex items-center bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden py-1 px-1 gap-1">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${editor.isActive('bold') ? 'text-brand bg-accent' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            <Bold size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${editor.isActive('italic') ? 'text-brand bg-accent' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            <Italic size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${editor.isActive('strike') ? 'text-brand bg-accent' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            <Strikethrough size={16} />
          </button>
          <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-1" />
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${editor.isActive('heading', { level: 2 }) ? 'text-brand bg-accent' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            <Heading2 size={16} />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-700 ${editor.isActive('blockquote') ? 'text-brand bg-accent' : 'text-zinc-600 dark:text-zinc-300'}`}
          >
            <Quote size={16} />
          </button>
        </BubbleMenu>
      )}

      {editor && (
        <FloatingMenu editor={editor} className="flex flex-col bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200 dark:border-zinc-700 rounded-lg overflow-hidden py-2 min-w-[200px]">
          <div className="px-3 pb-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Turn into</div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left text-sm text-zinc-700 dark:text-zinc-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500"><Heading1 size={16} /></div>
            <div>
              <div className="font-medium">Heading 1</div>
              <div className="text-xs text-zinc-500">Big section heading.</div>
            </div>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left text-sm text-zinc-700 dark:text-zinc-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500"><Heading2 size={16} /></div>
            <div>
              <div className="font-medium">Heading 2</div>
              <div className="text-xs text-zinc-500">Medium section heading.</div>
            </div>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left text-sm text-zinc-700 dark:text-zinc-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500"><List size={16} /></div>
            <div>
              <div className="font-medium">Bulleted list</div>
              <div className="text-xs text-zinc-500">Create a simple bulleted list.</div>
            </div>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className="flex items-center gap-3 px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-left text-sm text-zinc-700 dark:text-zinc-200"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-zinc-500"><Code size={16} /></div>
            <div>
              <div className="font-medium">Code block</div>
              <div className="text-xs text-zinc-500">Capture a code snippet.</div>
            </div>
          </button>
        </FloatingMenu>
      )}

      <EditorContent editor={editor} />
    </div>
  )
}
