import { createGroq } from '@ai-sdk/groq'
import { smoothStream, streamText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth/config'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { aiChatSchema } from '@/lib/validation/schemas'
import { documentChatSystemPrompt } from '@/lib/ai/prompts'

export const maxDuration = 30

export async function POST(req: Request) {
  const nextReq = req as unknown as NextRequest
  const rateLimitError = checkRateLimit(nextReq)
  if (rateLimitError) return rateLimitError

  const session = await auth()
  
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const contentLength = Number(req.headers.get('content-length') || '0')
  if (contentLength > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
  }

  try {
    const body = await req.json()
    const { messages, documentContent } = aiChatSchema.parse(body)

    // Truncate document context to prevent excessive token usage
    const truncatedContent = documentContent 
      ? documentContent.slice(0, 8000) + (documentContent.length > 8000 ? '\n\n[Document truncated for context window...]' : '')
      : ''

    const groq = createGroq({
      apiKey: process.env.GROQ_API_KEY || ''
    })

    const result = streamText({
      model: groq('llama-3.3-70b-versatile'),
      system: documentChatSystemPrompt(truncatedContent),
      messages: messages as any,
    })

    // Return plain text stream — readable directly by browser's getReader()
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of result.textStream) {
            controller.enqueue(encoder.encode(chunk))
          }
        } catch (err) {
          console.error('Stream error:', err)
        } finally {
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'Cache-Control': 'no-cache',
      }
    })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Invalid request payload or AI Error' }, { status: 400 })
  }
}
