# AI System Design — Atla Daily

Atla Daily uses a sophisticated multi-agent AI system to power its "AI Stylist" and "Moodboard Engine."

## AI Pipeline Flow

### 1. Stylist Reasoning (Groq)
- **Engine**: Groq Inference Engine.
- **Models**: Fallback chain (llama-3.1-8b → mixtral-8x7b → gemma2-9b).
- **Process**: Takes user prompt + weather data + wardrobe catalog → returns structured JSON with outfit suggestions and styling advice.

### 2. Visual Analysis (NVIDIA)
- **Engine**: NVIDIA NIM.
- **Model**: phi-4-multimodal-instruct.
- **Process**: Analyzes uploaded clothing images to generate detailed fashion metadata (category, color, fabric, fit) for the database.

### 3. Virtual Try-On (Vertex AI)
- **Engine**: Google Cloud Vertex AI.
- **Model**: Imagen 2 (imagegeneration@006).
- **Process**: Combines user avatar + garment description → Photorealistic in-painting of the garment onto the user.

## External API Usage
- **Groq**: Core reasoning and JSON extraction.
- **OpenWeather**: Real-time context for styling.
- **Vertex AI**: Generative image editing.
- **NVIDIA VLM**: Image-to-text metadata generation.

## Future Scalability
- **Self-Hosting**: Moving logic to dedicated NIM instances for lower latency.
- **Fine-Tuning**: training a LoRA for specific "Corporate Luxury" aesthetics.
