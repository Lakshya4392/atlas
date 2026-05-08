# Architecture & Planning

> **⚠️ CRITICAL AGENT DIRECTIVE ⚠️**
> **BEFORE reading this architecture or writing ANY code, you MUST read `.cursorrules` and follow the Git Worktree isolation rules strictly. Do NOT touch the `main` branch directly. Failure to comply will result in immediate termination of the agent session.**

## 1. Current State (Atla Daily v1.2.0)
Atla Daily is a high-end fashion operating system (Corporate Luxury aesthetic).
- **Frontend (Kiro's Domain):** React Native (Expo), TypeScript, Expo Router. Features a Pinterest-style masonry grid and a Corporate Luxury UI.
- **Backend (Claude's Domain):** Node.js, Express, Prisma ORM, PostgreSQL (Neon), Cloudinary for media.
- **AI Integrations:** 
  - Vision: NVIDIA Phi-4-Multimodal (Garment cataloging)
  - Reasoning: Groq Inference (Llama 3 / Mixtral) with a 5-model fallback chain
  - Imaging: Google Vertex AI Imagen 2 (Virtual Try-On)

## 2. Immediate Objective: Fix Registration & Onboarding Flow
**Problem:** Currently, the onboarding flow does not properly trigger after user registration, and there are UI navigation glitches.
**Goal:** Ensure a smooth, seamless flow where the user registers -> data (like first name) is saved to the database -> user is smoothly navigated to onboarding -> user preferences are saved.

### Implementation Plan & Agent Assignments:
- **Phase 1 (Claude - Backend/Logic):** 
  - Fix the backend registration flow to correctly save user data (first name, etc.).
  - Ensure the API correctly serves this data when fetched during the onboarding phase.
  - Implement/fix the endpoint to save onboarding preferences to the user's profile.
- **Phase 2 (Kiro - Frontend/UI):** 
  - Fix the Expo Router navigation so that successful registration routes directly to onboarding.
  - Fix any UI issues on the onboarding screens for a smooth, premium "Corporate Luxury" aesthetic experience.
- **Phase 3 (AG Gemini - Visual/UI Testing):** 
  - As Orchestrator, I will verify the visual flow, ensuring the UI is glitch-free and the navigation feels smooth.

## 3. Backlog Objective: Intelligent Outfit Pipeline
We need to implement a Context-Aware, 3-Level Priority Fashion Suggestion Pipeline (User Closet -> Cached Database -> Live SerpAPI). This will be tackled after the onboarding flow is perfected.

## 4. Testing & Verification
- [ ] Verify Claude's backend flow properly saves and fetches first name and preferences.
- [ ] Verify Kiro's frontend routing correctly transitions from Register -> Onboard -> Dashboard.
