# 🚀 Collaborativa - Local-First Collaborative Document Editor

**Collaborativa** is a modern, local-first document editor built for real-time collaboration and seamless offline editing. It ensures that your work is never blocked by network latency or internet outages. By leveraging Conflict-Free Replicated Data Types (CRDTs), it guarantees deterministic merges without data loss, whether you are online or offline.

![Collaborativa Cover](https://via.placeholder.com/1000x500.png?text=Collaborativa+-+Local-First+Editor)

---

## ✨ Key Features

- ⚡ **Local-First Architecture:** Edits are instantly saved to your browser's IndexedDB. The UI never blocks waiting for a network request.
- 🔄 **Real-Time Collaboration:** Powered by WebSockets and **Yjs**, multiple users can edit the same document simultaneously with live cursors and presence.
- 🛡️ **Offline Support & Auto-Sync:** Lose internet? Keep typing. Changes are stored locally and automatically synced to the PostgreSQL database the moment you come back online.
- 👥 **Role-Based Access Control (RBAC):** Share documents with granular permissions (`OWNER`, `EDITOR`, `VIEWER`). Database-level isolation ensures secure multi-tenancy.
- 📝 **Rich Text Editing:** A beautiful, Notion-like editing experience built on top of **Tiptap** and ProseMirror.
- 🤖 **AI Assistant Integration:** Integrated AI features to help you write, summarize, and brainstorm right inside your document context.
- 🕰️ **Version History:** Granular document history tracking to restore previous versions seamlessly.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router, Server Actions)
- **Database:** [PostgreSQL](https://www.postgresql.org/) (hosted on [Neon](https://neon.tech/))
- **ORM:** [Prisma](https://www.prisma.io/)
- **CRDT Engine:** [Yjs](https://docs.yjs.dev/)
- **Editor:** [Tiptap](https://tiptap.dev/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) (Google & GitHub OAuth)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [shadcn/ui](https://ui.shadcn.com/)
- **Realtime Sync:** Custom Node.js WebSocket Relay Server (`y-websocket`)

---

## 🚀 Getting Started (Local Development)

Follow these steps to run the project locally.

### 1. Clone the repository
```bash
git clone https://github.com/Isha-upadhyay/collaborative-doc-editor.git
cd collaborative-doc-editor
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Create a `.env` file in the root directory and add the following variables:
```env
# Database
DATABASE_URL="postgresql://<user>:<password>@<host>/<db>?sslmode=require"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
AUTH_SECRET="your-super-secret-string"

# OAuth Providers (Google & GitHub)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GITHUB_ID="your-github-id"
GITHUB_SECRET="your-github-secret"
```

### 4. Initialize the Database
```bash
npx prisma generate
npx prisma db push
```

### 5. Start the Development Server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result!

---

## 🏗️ Architecture Highlights

### The Sync Engine
The backbone of Collaborativa is a custom Sync Engine that acts as the durable half of the local-first architecture:
1. **Push:** Drains the local IndexedDB outbox of user edits to Postgres via HTTP polling.
2. **Pull:** Hydrates the local `Y.Doc` from the durable Postgres log so a brand-new device can reconstruct an existing document without needing another peer online.

### WebSockets & Yjs
Real-time fan-out is handled by a separate WebSocket relay (`/relay` folder). The WebSocket is strictly used for ephemeral data (live cursors) and ultra-low latency edit sharing, while PostgreSQL remains the ultimate source of truth.

---

## 👩‍💻 Author

Built with ❤️ by **Isha Upadhyay**
- GitHub: [@Isha-upadhyay](https://github.com/Isha-upadhyay)
- LinkedIn: [Isha Upadhyay](https://www.linkedin.com/in/isha-upadhyay-b974a528b)

---

> **Note for Reviewers:** This project demonstrates advanced concepts in modern web development, including CRDTs, offline-first syncing strategies, and complex state management across client and server boundaries.
