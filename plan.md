# Veyra / Fashion X: Production-Grade Architecture & AI Pipeline Plan

This document outlines the current state of the main features in the app, the bottlenecks they face in a production environment, and a comprehensive improvement plan leveraging a strategic mix of AI providers (Google, Hugging Face, Nvidia, Grok) to maximize performance and minimize cost.

---

## 1. Current Main Features & Context

### A. The "Digital Twin" Virtual Try-On (VTON)
* **Context**: Users upload a photo of themselves to create an AI avatar. When they want to try on clothes, the app merges the clothing item with their avatar.
* **Current Bottleneck**: Doing full-image generation for every try-on is extremely expensive, slow, and prone to hallucinations (e.g., body morphing, weird hands).
* **Improvement Need**: We need a caching system and a preprocessing pipeline that parses the body *once* and only generates the specific clothing region.

### B. AI Stylist (Outfit Generation)
* **Context**: Uses LLMs (currently a multi-model fallback on Groq) to take user prompts, weather data, and closet inventory, outputting 3 distinct outfits with search queries.
* **Current Bottleneck**: Sending the entire closet as text to the LLM every time scales poorly. As closets grow, token limits will be hit, and the AI will struggle to match items perfectly.
* **Improvement Need**: Move to Semantic Vector Search. Convert clothes to embeddings, search locally/cheaply, and only pass the top 10 relevant items to the LLM.

### C. Wardrobe Management (Clothing Uploads)
* **Context**: Users upload photos of clothes. 
* **Current Bottleneck**: Users upload messy photos (clothes on beds, bad lighting). Standardizing these into clean, white-background, catalog-ready images is missing or manual.
* **Improvement Need**: Automated background removal, alignment, and auto-tagging upon upload. 

### D. Fashion Feed & Discovery
* **Context**: Recommends items based on user preferences.
* **Current Bottleneck**: Constantly polling external shopping APIs is slow and expensive.
* **Improvement Need**: Database caching and asynchronous product syncing.

---

## 2. Strategic AI Model Allocation

To achieve a production-grade app, we must stop using expensive models for cheap tasks. Here is the exact allocation strategy:

### A. Low-Need & Local Tasks (Hugging Face & On-Device)
Use these for high-volume, repetitive tasks that don't require massive GPU clusters.
* **Background Removal**: Hugging Face `briaai/RMBG-1.4` or `rembg`. Run this locally or on a cheap server.
* **Embeddings Generation**: Hugging Face `CLIP` models. Convert every clothing image into a vector once upon upload.
* **Duplicate Detection**: Perceptual hashing (Phash) to ensure users don't upload the same shirt twice.

### B. Vision & Categorization (Google Models)
Use Google's vision capabilities for fast, accurate metadata extraction.
* **Auto-Tagging & Categorization**: `Gemini 1.5 Flash` Vision. Pass the clean clothing image and ask for JSON: `{ category, color, material, fit, tags }`. It is extremely fast and cheap for this exact task.
* **Style Analysis**: Gemini Flash can also analyze user moodboards or inspiration photos to extract a "style profile".

### C. Heavy Synthesis & Try-On (Nvidia & Specialized GPUs)
Use high-end compute ONLY for the final visual output.
* **Virtual Try-On (VTON)**: Nvidia GPUs running `IDM-VTON` or `OOTDiffusion`. 
* **Optimization**: Use Nvidia TensorRT to compile the model for production, reducing generation time from 15 seconds to ~3 seconds.
* **Body Parsing**: Run densepose/segmentation on Nvidia hardware *once* when the Digital Twin is created, saving the masks.

### D. Fast Reasoning & Agentic Logic (Groq / Grok)
Use Groq's LPU infrastructure for instant conversational responses.
* **AI Stylist Generation**: Continue using `Llama-3` or `Mixtral` on Groq for the actual outfit building. Because Groq is nearly instant, the user feels no latency in the chat interface.

---

## 3. The Production Improvement Pipeline

To implement the above, we need to build the following backend systems:

### Pipeline 1: The "Process Once" Upload Flow
When a user uploads a piece of clothing:
1. **Clean**: Run Hugging Face `RMBG` to remove the background.
2. **Crop & Align**: Center the clothing item automatically.
3. **Analyze**: Send to Google Gemini Flash Vision -> Get `category`, `color`, `style`.
4. **Embed**: Run Hugging Face `CLIP` -> Generate vector embedding.
5. **Store**: Save clean PNG to S3/Cloudinary, save metadata to Postgres, save embedding to Vector DB (Pinecone/PgVector).

### Pipeline 2: The "Smart Context" Stylist Flow
When a user asks the Stylist for an outfit:
1. **Embed Prompt**: Convert user's text prompt to a vector.
2. **Semantic Search**: Search the user's Vector DB for the top 15 most relevant clothes they own.
3. **Generate**: Send ONLY those 15 items + Weather data to Groq (Llama-3).
4. **Output**: Groq returns the 3 outfits instantly.

### Pipeline 3: The "Masked" VTON Flow
When a user clicks "Try On":
1. **Cache Check**: Has this `User_ID` tried on this `Cloth_ID` before? If yes, return the cached image immediately.
2. **Masking**: Use the pre-computed body masks of the user's Digital Twin.
3. **Generate**: Send the clean cloth + user mask to the Nvidia GPU VTON cluster.
4. **Store & Cache**: Save the result so it never has to be generated again.

---

## 4. Next Steps for Implementation

1. **Setup Vector Database**: Add `pgvector` to your Prisma schema for the `ClothingItem` model.
2. **Build the Upload Preprocessor**: Create an API route that handles the 5-step "Process Once" flow using Hugging Face Inference Endpoints and Gemini.
3. **Refactor `ai.ts`**: Update the Groq prompt to accept a pre-filtered list of clothes from the Vector DB rather than the entire closet.
4. **Implement Try-On Caching**: Create a `TryOnCache` table in the database mapping `userId` + `clothingId` -> `resultImageUrl`.
