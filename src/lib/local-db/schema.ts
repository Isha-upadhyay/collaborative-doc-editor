import Dexie, { Table } from 'dexie'

export interface OutboxEntry {
  id?: number
  documentId: string
  updateBlob: Uint8Array
  status: 'pending' | 'rejected'
  attempts: number
  createdAt: number
}

export interface DocumentMeta {
  id: string
  title: string
  role: string
  updatedAt: number
}

export class LocalDatabase extends Dexie {
  outbox!: Table<OutboxEntry, number>
  documentsMeta!: Table<DocumentMeta, string>
  syncCursor!: Table<{ documentId: string; lastAckedId: string }, string>

  constructor() {
    super('CollaborativaLocalDB')
    this.version(1).stores({
      outbox: '++id, documentId, status',
      documentsMeta: 'id, updatedAt',
      syncCursor: 'documentId'
    })
  }
}

export const localDb = new LocalDatabase()
