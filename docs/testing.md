# Testing Strategy — Atla Daily

To ensure a production-grade experience, Atla Daily implements a multi-layered testing strategy.

## Backend Testing (API)
- **Framework**: Jest + Supertest.
- **Scope**:
    - **Unit Tests**: Logic for AI fallback chains and prompt building.
    - **Integration Tests**: API endpoints for Auth, Wardrobe, and Outfit management.
    - **Mocking**: External APIs (Groq, Vertex) are mocked to prevent cost and latency during CI.

## Frontend Testing (Mobile)
- **Framework**: Detox (E2E) and Jest (Unit).
- **Scope**:
    - **Smoke Tests**: Verifying the app boots and navigates correctly.
    - **E2E Flows**: Login flow, adding an item, and starting an AI chat session.

## AI Quality Assurance
- **Prompt Benchmarking**: Regression testing for AI prompts to ensure JSON output remains consistent.
- **Latency Monitoring**: Tracking response times for generative models.
