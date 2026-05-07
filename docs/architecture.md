# Architecture Overview — Atla Daily

Atla Daily is a premium fashion wardrobe operating system designed for "Corporate Luxury" aesthetics. It leverages a modern full-stack architecture to provide seamless AI-driven styling and virtual try-on experiences.

## System Workflow
1. **Frontend (Mobile)**: React Native (Expo) app handles user interaction, wardrobe management, and AI chat.
2. **Backend (API)**: Node.js Express server manages data persistence, authentication, and orchestrates complex AI pipelines.
3. **Database**: PostgreSQL (via Neon) stores user profiles, clothing items, and generated outfits.
4. **Media Storage**: Cloudinary handles image hosting and optimizations.

## Architecture Decisions
- **Monorepo Structure**: To maintain consistency between frontend models and backend API contracts.
- **Expo Router**: File-based routing for mobile to simplify navigation and deep linking.
- **Prisma ORM**: Type-safe database interactions for high developer velocity.
- **Fallback Chain**: Implementing a multi-model fallback for AI services to ensure 99.9% availability.

## Tech Stack
- **Mobile**: React Native, Expo, TypeScript, Linear Gradient, Ionicons.
- **Backend**: Node.js, Express, Prisma, Multer.
- **AI**: Groq (Llama 3/Mixtral), NVIDIA (Phi-4 Multimodal), Vertex AI (Imagen 2).
- **Storage**: Cloudinary, Neon PostgreSQL.
