import { z } from 'zod'

export const updatePayloadSchema = z.object({
  update: z.string().min(1).max(5000000, "Update payload too large") // 5MB limit
})

export const snapshotPayloadSchema = z.object({
  versionId: z.string().min(1).max(100),
  stateVector: z.string().min(1).max(5000000)
})

export const aiChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system", "data"]),
    content: z.string()
  })),
  documentContent: z.string().max(100000, "Document too large for context window").optional()
})

export const createDocumentSchema = z.object({
  title: z.string().min(1).max(255).optional().default("Untitled Document"),
})
