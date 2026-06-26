import { localDb } from './schema'

export async function appendToOutbox(documentId: string, updateBlob: Uint8Array) {
  await localDb.outbox.add({
    documentId,
    updateBlob,
    status: 'pending',
    attempts: 0,
    createdAt: Date.now()
  })
}

export async function getPendingOutbox(documentId: string) {
  return await localDb.outbox
    .where({ documentId, status: 'pending' })
    .sortBy('id')
}

export async function ackOutboxEntry(id: number) {
  await localDb.outbox.delete(id)
}

export async function rejectOutboxEntry(id: number) {
  await localDb.outbox.update(id, { status: 'rejected' })
}

export async function clearOutbox(documentId: string) {
  await localDb.outbox.where({ documentId, status: 'acked' }).delete()
}
