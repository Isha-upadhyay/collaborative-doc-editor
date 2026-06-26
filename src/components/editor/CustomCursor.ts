import { Extension } from '@tiptap/core'
import { yCursorPlugin } from '@tiptap/y-tiptap'

export interface CustomCursorOptions {
  provider: any
  user: {
    name: string | null
    color: string | null
  }
}

export const CustomCursor = Extension.create<CustomCursorOptions>({
  name: 'customCursor',

  addOptions() {
    return {
      provider: null,
      user: {
        name: null,
        color: null,
      },
    }
  },

  addProseMirrorPlugins() {
    if (!this.options.provider?.awareness) {
      return []
    }

    return [
      yCursorPlugin(
        this.options.provider.awareness,
        {
          cursorBuilder: (user: any) => {
            const cursor = document.createElement('span')
            cursor.classList.add('collaboration-cursor__caret')
            cursor.setAttribute('style', `border-color: ${user.color || '#000'}`)

            const label = document.createElement('div')
            label.classList.add('collaboration-cursor__label')
            label.setAttribute('style', `background-color: ${user.color || '#000'}`)
            label.insertBefore(document.createTextNode(user.name || 'Anonymous'), null)

            cursor.insertBefore(label, null)
            return cursor
          }
        }
      ),
    ]
  },
})
