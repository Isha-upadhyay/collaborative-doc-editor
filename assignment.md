# House of Edtech - Full Stack Developer Full-Time Assignment 2

**Date:** April 2026

---

# Overview

Develop a **Local-First Collaborative Document Editor** with:

* Offline Synchronization
* Deterministic Conflict Resolution
* Granular Version Control
* Authentication & Authorization
* Security against malformed synchronization payloads
* AI-powered productivity features

The application should continue functioning without internet connectivity and automatically synchronize once connectivity is restored.

---

# Expectations

This is **NOT** a CRUD assignment.

The goal is to demonstrate:

* Strong software engineering skills
* Distributed systems knowledge
* Browser memory management
* Offline-first architecture
* Real-time collaboration
* State synchronization
* Conflict resolution
* Production-ready system design
* Scalability
* Security
* AI integration

Avoid building:

* Todo apps
* Task managers
* Simple CRUD applications

---

# Mandatory Skills

* Next.js 16
* React.js
* Git
* Tailwind CSS
* PostgreSQL

---

# Good to Have

Experience with:

* Vercel AI SDK
* Gemini
* OpenAI
* Groq

---

# Technology Stack

## Frontend

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS
* shadcn/ui (recommended)

## Backend

* Next.js Route Handlers
* TypeScript

## Database

Choose an appropriate database.

Examples:

* PostgreSQL (preferred)
* MySQL
* MongoDB

---

# Functional Requirements

## 1. Local-First Architecture

The client-side database must be the primary source of truth.

Requirements:

* Zero network requests should block typing.
* Documents must be editable offline.
* Users should be able to open, edit, and close documents without internet.
* Local state should survive browser refreshes.

---

## 2. Background Synchronization Engine

Implement a synchronization engine capable of:

* Queuing local operations
* Background synchronization
* Offline queue persistence
* Retry mechanism
* Network reconnection handling
* Fetching remote updates
* Uploading local updates

The engine must never overwrite offline work.

---

## 3. Version History & Time Travel

Implement snapshot-based versioning.

Requirements:

* Save snapshots
* View version timeline
* Restore previous versions
* Never corrupt active collaborative sessions
* Safe restoration
* Time travel

---

## 4. Data Validation

All synchronization payloads must be validated.

The server must reject:

* Invalid payloads
* Malformed CRDT updates
* Corrupted synchronization requests

---

## 5. User Interface

Build a clean UI using:

* Tailwind CSS
* shadcn/ui
* Radix UI (optional)

Requirements:

* Responsive
* Accessible
* Real-time connection status
* Good UX

---

## 6. AI Features

Use AI to implement useful productivity features.

Examples:

* Document summary
* Change summary
* Meeting notes extraction
* Action item generation
* AI document chat
* Smart document insights

---

## 7. Deployment

Deploy on:

* Vercel
* Netlify

Include:

* CI/CD
* Production deployment

---

## 8. Code Quality

Requirements:

* Clean architecture
* Type safety
* Performance optimization
* SSR
* Code splitting
* Caching
* Documentation
* Maintainability

---

## 9. Production Readiness

Consider:

* Scalability
* Error handling
* Security
* Browser memory limits
* Large document handling
* Long-running collaboration sessions

---

# Authentication & Authorization

Implement secure authentication.

Examples:

* Auth.js
* NextAuth

Required roles:

* Owner
* Editor
* Viewer

Rules:

* Owners have full control.
* Editors can edit.
* Viewers can only read.
* Viewers must never push synchronization updates.

---

# Security Requirements

Discuss and implement strategies for:

* Payload validation
* Malformed synchronization protection
* OOM attack prevention
* API security
* Tenant isolation
* PostgreSQL Row Level Security (RLS) or strict ORM scoping
* Authorization enforcement

---

# Testing

Recommended:

* Unit tests
* Integration tests
* End-to-end tests

Especially test:

* Offline synchronization
* Conflict resolution
* Version history
* Authentication
* Authorization

---

# Evaluation Criteria

## Functionality

* Offline synchronization
* Deterministic conflict resolution
* Version history
* Data validation
* Authentication
* Authorization

---

## User Interface

* Responsiveness
* Accessibility
* Real-time indicators
* User experience

---

## Code Quality

* Clean architecture
* Maintainability
* Documentation
* Performance
* Complex synchronization logic

---

## Testing

* Unit tests
* Integration tests
* End-to-end tests

Focus on:

* Local-first sync engine

---

## Deployment

* Live deployment
* CI/CD

---

## Real-World Considerations

Demonstrate solutions for:

* Large document growth
* Long-running collaboration
* Scalability
* Production challenges

---

# Submission Requirements

Submit:

* GitHub Repository
* Live Deployment URL

Application footer must include:

* Your Name
* GitHub Profile
* LinkedIn Profile

---

# Primary Goal

The final application should demonstrate production-grade engineering skills rather than simply satisfying feature requirements.

The solution should emphasize:

* Offline-first architecture
* Deterministic synchronization
* Distributed systems thinking
* Security
* Scalability
* Maintainability
* Performance
* Excellent user experience
