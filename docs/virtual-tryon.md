# Virtual Try-On Engine — Atla Daily

The Virtual Try-On (VTO) system is the core competitive advantage of Atla Daily, providing photorealistic previews of clothes on the user's body.

## System Workflow
1. **Input**: User selects a garment and provides a "Body Reference" photo.
2. **Analysis**: NVIDIA Phi-4-multimodal describes the garment in high detail (texture, fit, draping).
3. **Synthesis**: Vertex AI Imagen 2 uses **In-Painting** to replace the original clothing in the reference photo with the new garment.
4. **Post-Processing**: Cloudinary optimizes the generated image for mobile delivery.

## Architecture Decisions
- **Instruction-based Editing**: Using `EDIT_MODE_DEFAULT` in Imagen 2 to allow the AI to handle garment fitting without requiring a manual mask from the user.
- **Asynchronous Processing**: VTO requests are handled with a loading state (15-30s) to accommodate generative model latency.

## Future Direction
- **Body Segmentation**: Implementing a dedicated segmentation model to create precise masks for higher accuracy.
- **Pose Estimation**: Aligning garment orientation with user pose for "Action" try-ons.
