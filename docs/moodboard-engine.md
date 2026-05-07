# Moodboard Engine — Atla Daily

The Moodboard Engine generates cohesive visual inspirations based on user preferences and current fashion trends.

## System Workflow
1. **Mood Detection**: AI Stylist extracts "vibes" from user chat history (e.g., "Old Money", "Street Luxe").
2. **Contextualization**: Current weather and seasonal trends are added to the prompt.
3. **Generation**: Generative models create a grid of inspiration images.

## Architecture Decisions
- **Pinterest Aesthetic**: The UI uses a masonry grid to mimic professional moodboards.
- **Dynamic Weighting**: The system prioritizes items already in the user's wardrobe to ensure inspiration is actionable.

## Future Direction
- **Community Feed**: Allowing users to share generated moodboards.
- **Affiliate Integration**: Linking moodboard items to external luxury retailers.
