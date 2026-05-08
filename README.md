# Atla Daily — Premium Wardrobe OS

Atla Daily is a high-end fashion operating system that transforms your personal closet into a dynamic, AI-driven experience. Built for the "Corporate Luxury" aesthetic, Atla combines cutting-edge generative AI with minimalist Scandanavian design.

## ✨ Features

- **Pinterest-Style Wardrobe**: A beautiful, masonry-grid interface for browsing your clothes.
- **AI Stylist**: A multi-agent reasoning engine that curates outfits based on your calendar, weather, and personal style.
- **Virtual Try-On (VTO)**: Photorealistic AI fitting using Google Vertex AI Imagen 2.
- **Moodboard Engine**: Visual inspiration generated specifically for your wardrobe.
- **Smart Analytics**: Track your wear count, favorite items, and style level.

## 🤖 AI Workflows

- **Reasoning**: Groq Inference (Llama 3 / Mixtral) with automatic fallback.
- **Vision**: NVIDIA Phi-4-Multimodal for automatic garment cataloging.
- **Imaging**: Vertex AI Imagen 2 for photorealistic generative try-ons.

## 🛠 Tech Stack

- **Mobile**: React Native (Expo), TypeScript, Expo Router.
- **Backend**: Node.js, Express, Prisma ORM.
- **Database**: PostgreSQL (Neon).
- **Media**: Cloudinary.

## 🚀 Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- Expo Go on your mobile device
- Neon PostgreSQL database
- Cloudinary account

### 2. Installation
```bash
# Clone the repository
git clone https://github.com/Lakshya4392/atla.git

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Fill in your API keys in .env
```

### 3. Running the App
```bash
# Start the backend server
cd server
npm install
npm run dev

# Start the mobile app (in root)
npx expo start
```

## 🗺 Roadmap
- [ ] v1.3.0: Community Moodboard Feed
- [ ] v1.4.0: One-Tap Affiliate Checkout
- [ ] v1.5.0: Advanced Pose-Based Try-On

## 📄 License
MIT © 2026 Atla Fashion

---
*Orchestrated by AGBRAIN*