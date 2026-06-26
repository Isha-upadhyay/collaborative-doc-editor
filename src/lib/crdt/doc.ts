import * as Y from 'yjs'
import { IndexeddbPersistence } from 'y-indexeddb'
export function createLocalDoc(documentId: string): Promise<{ doc: Y.Doc, provider: IndexeddbPersistence }> {
  return new Promise((resolve) => {
    const doc = new Y.Doc()
    const provider = new IndexeddbPersistence(`ydoc-${documentId}`, doc)
    
    provider.on('synced', () => {
      resolve({ doc, provider })
    })
  })
}
