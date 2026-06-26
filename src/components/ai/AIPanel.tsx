"use client"

import { useState, useEffect, useRef } from 'react'
import * as Y from 'yjs'
import { Send, Sparkles, Loader2, FileEdit, Check, Wand2, ListChecks, FileText, ScrollText } from 'lucide-react'
import type { Editor as TipTapEditor } from '@tiptap/core'
import { marked } from 'marked'

interface Message {
  role: 'user' | 'assistant'
  content: string
  appliedToDoc?: boolean
  canApply?: boolean
}

const QUICK_ACTIONS = [
  { icon: Wand2, label: 'Improve writing', hint: 'applies to doc', prompt: 'Improve the writing and clarity of this document', accent: true },
  { icon: Check, label: 'Fix grammar', hint: 'applies to doc', prompt: 'Fix grammar and spelling errors in this document', accent: true },
  { icon: ScrollText, label: 'Summarize', hint: 'in chat', prompt: 'Summarize this document in key bullet points', accent: false },
  { icon: ListChecks, label: 'Action items', hint: 'in chat', prompt: 'Extract all action items and next steps from this document', accent: false },
  { icon: FileText, label: 'Meeting notes', hint: 'in chat', prompt: 'Generate professional meeting notes from this document', accent: false },
] as const

function textToHtml(text: string): string {
  try {
    return marked.parse(text, { async: false }) as string
  } catch {
    return `<p>${text}</p>`
  }
}

function isEditIntent(msg: string): boolean {
  const editKeywords = [
    'improve', 'rewrite', 'fix', 'enhance', 'expand', 'shorten', 'simplify',
    'rephrase', 'polish', 'edit', 'correct', 'update', 'refine', 'revise',
    'make it', 'change it', 'write a', 'generate', 'create',
  ]
  const lower = msg.toLowerCase()
  return editKeywords.some((k) => lower.includes(k))
}

export function AIPanel({ doc, editorRef }: { doc: Y.Doc; editorRef?: React.RefObject<TipTapEditor | null> }) {
  const [docContent, setDocContent] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    const extractText = () => {
      try {
        const xml = doc.getXmlFragment('content').toString()
        setDocContent(xml.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim())
      } catch {
        setDocContent('')
      }
    }
    doc.on('update', extractText)
    extractText()
    return () => {
      doc.off('update', extractText)
    }
  }, [doc])

  const applyToDocument = (content: string, msgIndex: number) => {
    const editor = editorRef?.current
    if (!editor) return
    editor.commands.setContent(textToHtml(content))
    setMessages((prev) => prev.map((m, i) => (i === msgIndex ? { ...m, appliedToDoc: true } : m)))
  }

  const handleSubmit = async (e: React.FormEvent, overrideInput?: string) => {
    e.preventDefault()
    const text = (overrideInput ?? input).trim()
    if (!text || isLoading) return

    const editMode = isEditIntent(text)
    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setIsLoading(true)

    try {
      const systemHint = editMode
        ? '\n\nIMPORTANT: The user wants you to directly rewrite/edit the document. Provide ONLY the improved document text, no explanations or preamble. Start directly with the content.'
        : ''

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          documentContent: docContent,
          systemHint,
        }),
      })

      if (!res.body) throw new Error('No body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let fullContent = ''
      const assistantMsg: Message = { role: 'assistant', content: '', canApply: editMode }
      setMessages((prev) => [...prev, assistantMsg])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        fullContent += decoder.decode(value, { stream: true })
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...assistantMsg, content: fullContent }
          return updated
        })
      }

      if (editMode && editorRef?.current && fullContent.trim()) {
        editorRef.current.commands.setContent(textToHtml(fullContent.trim()))
        setMessages((prev) => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...assistantMsg, content: fullContent, appliedToDoc: true }
          return updated
        })
      }
    } catch (err) {
      console.error(err)
      setMessages((prev) => [...prev, { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' }])
    } finally {
      setIsLoading(false)
    }
  }

  const quickAction = (prompt: string) => {
    handleSubmit({ preventDefault: () => {} } as React.FormEvent, prompt)
  }

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col bg-card/40">
      {/* Header */}
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-brand/15 text-brand">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <h2 className="text-sm font-semibold tracking-tight">AI Assistant</h2>
        <span className="ml-auto rounded-full border border-border bg-secondary px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
          Groq · Llama 3.3
        </span>
      </div>

      {/* Messages */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand/10 text-brand">
              <Sparkles className="h-6 w-6" />
            </span>
            <p className="text-sm font-medium">Ask anything about your document</p>
            <p className="text-xs text-muted-foreground">Edit actions apply changes directly to the page.</p>

            <div className="mt-3 grid w-full gap-2">
              {QUICK_ACTIONS.map((a) => (
                <button
                  key={a.label}
                  onClick={() => quickAction(a.prompt)}
                  className={`group flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors ${
                    a.accent
                      ? 'border-brand/25 bg-accent/50 hover:bg-accent'
                      : 'border-border bg-secondary/60 hover:bg-secondary'
                  }`}
                >
                  <a.icon className={`h-4 w-4 shrink-0 ${a.accent ? 'text-brand' : 'text-muted-foreground'}`} />
                  <span className="font-medium">{a.label}</span>
                  <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">{a.hint}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex flex-col gap-1 ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div
                className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'rounded-br-sm bg-brand text-brand-foreground'
                    : 'rounded-bl-sm border border-border bg-card text-card-foreground'
                }`}
              >
                {m.content || '…'}
              </div>
              {m.role === 'assistant' && m.content && !m.appliedToDoc && (
                <button
                  onClick={() => applyToDocument(m.content, i)}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-brand transition-colors hover:bg-accent"
                >
                  <FileEdit className="h-3 w-3" /> Apply to document
                </button>
              )}
              {m.role === 'assistant' && m.appliedToDoc && (
                <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400">
                  <Check className="h-3 w-3" /> Applied to document
                </div>
              )}
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm border border-border bg-card px-3.5 py-2.5 text-xs text-muted-foreground w-fit">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand" /> Thinking…
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <div className="shrink-0 border-t border-border p-3">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 rounded-xl border border-border bg-background p-1.5 focus-within:border-brand/50 focus-within:ring-2 focus-within:ring-brand/15">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask, or say “improve my document”…"
            aria-label="Message the AI assistant"
            className="flex-1 bg-transparent px-2 text-sm outline-none placeholder:text-muted-foreground/70"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            aria-label="Send message"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </button>
        </form>
      </div>
    </div>
  )
}
