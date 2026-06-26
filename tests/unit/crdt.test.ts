import { describe, it, expect } from 'vitest'
import * as Y from 'yjs'

describe('CRDT Operations', () => {
  it('should initialize a Y.Doc and apply updates correctly', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Client 1 types
    const text1 = doc1.getText('default')
    text1.insert(0, 'Hello World')

    // Generate update
    const update = Y.encodeStateAsUpdate(doc1)

    // Client 2 applies update
    Y.applyUpdate(doc2, update)

    const text2 = doc2.getText('default')
    expect(text2.toString()).toBe('Hello World')
  })

  it('should merge concurrent offline edits deterministically', () => {
    const doc1 = new Y.Doc()
    const doc2 = new Y.Doc()

    // Sync initial state
    const text1 = doc1.getText('default')
    const text2 = doc2.getText('default')
    
    text1.insert(0, 'Start')
    Y.applyUpdate(doc2, Y.encodeStateAsUpdate(doc1))

    // Concurrent offline edits
    text1.insert(5, ' End1')
    text2.insert(5, ' End2')

    // Exchange state vectors and merge
    const update1 = Y.encodeStateAsUpdate(doc1)
    const update2 = Y.encodeStateAsUpdate(doc2)

    Y.applyUpdate(doc1, update2)
    Y.applyUpdate(doc2, update1)

    // Both should converge to exactly the same string
    expect(doc1.getText('default').toString()).toBe(doc2.getText('default').toString())
  })
})
