# Affiliate & Monetization System — Atla Daily

This document outlines the proposed affiliate integration for scaling the Atla Daily ecosystem.

## System Workflow
1. **Ideal Addition**: The AI Stylist identifies missing pieces in a user's wardrobe (e.g., "A Loro Piana cashmere overcoat").
2. **Matching Engine**: Searches affiliate partner catalogs (Farfetch, SSENSE) for matching items.
3. **Deeplinking**: Provides the user with a direct purchase link with an embedded affiliate ID.

## Architecture Decisions
- **Non-Intrusive Integration**: Affiliate suggestions are presented as "Ideal Additions" to maintain the premium feel.
- **Brand Alignment**: Filters to ensure only luxury and "Corporate Luxe" brands are suggested.

## Future Direction
- **One-Tap Checkout**: Direct integration with Apple Pay/Google Pay for partner retailers.
- **Price Tracking**: Notifying users when an "Ideal Addition" goes on sale.
