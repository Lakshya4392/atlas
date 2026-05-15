# Changelog — Veyra (formerly Atla Daily → Fashion X)

All notable changes to this project will be documented in this file.
Format: [Semantic Version] — Date — Summary — Files Changed.

---

## [2.0.0] — 2026-05-15
### 🎨 Glassmorphism Item Detail Redesign
- **Item Detail** screen completely redesigned to match editorial e-commerce reference.
- All buttons (back, heart, menu, cart) use **frosted glassmorphism** — `rgba(255,255,255,0.65)` with 1.5px white border and elevated shadows.
- Rounded image card with `borderRadius: 32`, white inner border, and soft drop shadow.
- Removed clutter: price, size pills, color picker, and rating row stripped out for minimal clean layout.
- Bottom action bar with dark pill **"Try On ✨"** button + glassmorphism cart icon.
- Item name truncated to 2 lines max with proper `lineHeight`.
- Brand/source displayed below name in muted grey.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/item-detail.tsx` | Complete rewrite — new render layout, all styles replaced with glassmorphism tokens |

---

## [1.9.0] — 2026-05-15
### 🗄️ Category Seeding & SerpAPI Auto-Fetch
- Batch SQL script (`seed-categories.js`) to categorize all 470 existing `CachedProduct` items by title pattern matching.
- Added **"Hats"** as a new dedicated category across frontend and backend.
- `getByCategory` threshold changed from `0 → 5`: if a category has fewer than 5 items, SerpAPI auto-fetches and saves 20+ new products.
- After seeding: Tops (132), Bottoms (32), Shoes (30+), Hats (30+), Outerwear (150), Accessories (0→auto-fetch).
- `guessCategory()` helper added to both backend controller and frontend dressing room.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/seed-categories.js` | New file — batch SQL update script for categorizing CachedProduct items |
| `backend/test-db.js` | New file — DB connectivity & category count verification script |
| `backend/src/controllers/fashionController.ts` | Added `guessCategory()`, `getByCategory()`, `seedAllCategories()` functions; threshold < 5 logic |
| `backend/src/routes/fashion.ts` | Added `GET /category/:cat` and `POST /seed` routes |
| `mobile/app/dressing-room.tsx` | Added "Hats" to CATEGORIES array; updated `guessCategoryFromTitle()` with hat/cap/beanie detection |

---

## [1.8.0] — 2026-05-14
### 🏪 Dressing Room — Category-Based SerpAPI Integration
- **New endpoint**: `GET /api/fashion/category/:cat` — fetches items by category, auto-seeds from SerpAPI if empty.
- **New endpoint**: `POST /api/fashion/seed` — bulk seeds all categories (Shoes, Tops, Bottoms, Hats, Outerwear, Accessories) in one call.
- Dressing room now fetches from `/api/fashion/category/Shoes` (etc.) instead of generic search — much faster, properly categorized.
- Category queries: `"men's trending sneakers shoes 2025"`, `"men's fashion hats caps beanies 2025"`, etc.
- All fetched items saved to `CachedProduct` table with `category` field for instant future loads.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/src/controllers/fashionController.ts` | Added `getByCategory` and `seedAllCategories` exports; `getCachedOrFetch` now accepts optional `category` param and saves it |
| `backend/src/routes/fashion.ts` | Imported new controllers, registered `/category/:cat` and `/seed` routes |
| `mobile/app/dressing-room.tsx` | `fetchByCategory()` now calls `/api/fashion/category/:cat` instead of `/api/fashion/search` |

---

## [1.7.0] — 2026-05-14
### 🔄 Dressing Room Dual Data Source & Skeleton Loading
- Dressing room now fetches from **two sources**: user's personal closet (`/api/clothes/:userId`) + SerpAPI cached products (`/api/fashion/feed/:userId`).
- **Skeleton loading cards**: 4 grey shimmer placeholders shown while items load (replaced "No items in closet" text).
- Category filter pills: `All`, `Tops`, `Bottoms`, `Shoes`, `Hats`, `Outerwear`, `Accessories`.
- **Back button crash fix**: `GO_BACK` action error resolved — safe fallback to `/(tabs)` if no history.
- **Save collection fix**: Direct `fetch()` to `/api/outfits` instead of `outfitsAPI.saveOutfit()` which caused foreign key violations on SerpAPI items.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/dressing-room.tsx` | Rewrote `loadUserAndCloset()` to merge closet + SerpAPI data; added `skeletonShimmer` cards; fixed `router.back()` crash with `canGoBack()` check; rewrote `handleSaveCollection()` |

---

## [1.6.0] — 2026-05-14
### 📐 Item Detail — Minimal Editorial Redesign
- Transitioned from cluttered UI to **minimal, editorial e-commerce** aesthetic.
- Full-bleed image area with horizontal swipe + dot pagination.
- Floating black pill **"TRY ON ✨"** button replaced heavy CTA.
- Info card with category tag, item name, brand, color/price/wear chips, and size pill selector.
- Try-On flow routes to `/dressing-room` with item data passed via params.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/item-detail.tsx` | Rewrote render: `productImageArea` with horizontal `ScrollView`, `floatingAction` TRY ON pill, `infoCard` with chips and size pills; new `StyleSheet` with editorial styles |

---

## [1.5.0] — 2026-05-14
### 👗 Dressing Room — Category Filtering & Closet Sync
- Horizontal scrollable **category pill filters** added to bottom drawer.
- Direct API integration (`/api/clothes/:userId`) replaced generic service calls for reliability.
- `getBackendUrl()` dynamic helper ensures connectivity across emulator/physical device.
- Floating tag system shows applied items on avatar with red ✕ close button.
- Try-On loading overlay with "Tailoring fit..." message.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/dressing-room.tsx` | Added `CATEGORIES` array, `fetchByCategory()`, `guessCategoryFromTitle()`, `filterRow` + `catPill` styles; `getBackendUrl()` helper added at top; floating tag JSX + `tagCloseBtn` |

---

## [1.4.0] — 2026-05-14
### 📱 Responsive Layout & Device Compatibility
- All screens updated with `Dimensions.get('window')` for responsive sizing.
- Fixed layout overflow on smaller devices (< 360px width).
- Tab bar, headers, and cards now scale proportionally.
- Safe area insets properly handled via `react-native-safe-area-context`.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/index.tsx` | Replaced hardcoded widths with `Dimensions.get('window').width` calculations |
| `mobile/app/(tabs)/closet.tsx` | Card widths now `(width - 48) / 2` for 2-column grid |
| `mobile/app/(tabs)/profile.tsx` | Avatar and stats cards responsive to screen width |
| `mobile/app/(tabs)/outfits.tsx` | Outfit card sizing dynamic |
| `mobile/app/(tabs)/_layout.tsx` | Tab bar height and icon sizes standardized |

---

## [1.3.8] — 2026-05-14
### 📅 Calendar Screen Completion
- Calendar view fully functional with date selection.
- Outfit history linked to calendar dates.
- Removed placeholder content, connected to real outfit data.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/calendar.tsx` | Connected date picker to outfit API; rendering outfit cards per selected date |

---

## [1.3.7] — 2026-05-14
### 👤 Profile Screen Premium Redesign
- Profile page redesigned with premium feel — gradient header, stats cards, settings list.
- Digital Twin preview integrated into profile.
- Preferred brands, style preferences, and streak data displayed.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/profile.tsx` | Rewrote JSX with gradient header, `statsRow`, digital twin image preview, settings list with `Ionicons` |

---

## [1.3.6] — 2026-05-14
### 🔐 Login & Onboarding Flow Fix
- Fixed onboarding not showing after login — users now go directly to home if already onboarded.
- Login screen redirects to onboarding for new users, home for returning users.
- `AsyncStorage` session persistence fixed.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/login.tsx` | Auth check on mount; redirect logic based on `user.onboarded` flag |
| `mobile/app/register.tsx` | Post-registration flow routes to `/onboarding` then home |
| `mobile/app/_layout.tsx` | Root layout checks AsyncStorage for existing session on app launch |

---

## [1.3.5] — 2026-05-14
### 💬 AI Stylist Chat UI Overhaul
- Removed "Veyra Pro" branding from chat.
- Welcome message shows centered greeting + fashion-related prompt.
- Chat input modernized with clean border, send button, and proper keyboard handling.
- Back button + chat icon added to header.
- Bottom tab bar visibility fixed during chat.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/ai-stylist.tsx` | Rewrote header with back button; new `welcomeCard` component; input field redesigned; `KeyboardAvoidingView` added |

---

## [1.3.4] — 2026-05-14
### 🏠 Home Screen UI Polish
- Welcome message shows only on first load, not on every request.
- Bottom navigation bar improved with proper icons and labels.
- Text input field redesigned with modern styling.
- Premium card layouts for trending items and outfit suggestions.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/index.tsx` | Conditional welcome render; new card components for trending items; input field styles |
| `mobile/app/(tabs)/_layout.tsx` | Tab bar icons and labels updated, active color set to `#000` |

---

## [1.3.0] — 2026-05-14
### 🎨 Full Rebranding: Fashion X → Veyra
- All hardcoded strings updated from "Fashion X" / "Alta Daily" to **"Veyra"**.
- App name, splash screen references, and API responses updated.
- Welcome carousel images regenerated with Veyra branding.
- Login/Register screens restyled with new brand identity.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app.json` | `name` and `slug` changed to "Veyra" |
| `mobile/app/(tabs)/index.tsx` | Welcome text updated to "Veyra" |
| `mobile/app/(tabs)/ai-stylist.tsx` | Chat header title → "Veyra AI Stylist" |
| `mobile/app/login.tsx` | Logo text + hero image updated |
| `mobile/app/register.tsx` | Brand name + background image updated |
| `mobile/app/welcome.tsx` | Carousel slides rebranded with Veyra text + new generated images |
| `backend/src/controllers/aiController.ts` | System prompt changed from "Fashion X" to "Veyra" |

---

## [1.2.5] — 2026-05-10
### 🐛 Outfit Detail & Database Fixes
- Outfit detail screen now fetches real data from database instead of mock arrays.
- Fixed property name mismatches between frontend models and API responses.
- `OutfitItem` foreign key constraints properly handled.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/outfit-detail.tsx` | Replaced `OUTFITS.find()` with `fetch()` to `/api/outfits/:id`; null-safe property access |
| `backend/src/controllers/outfitController.ts` | `getOutfitById` includes `items` relation with `clothingItem` eager load |

---

## [1.2.4] — 2026-05-10
### 🔄 Multi-Token HF Pipeline Fallbacks
- Added dynamic token rotation for all Hugging Face API calls.
- If one HF token is rate-limited, automatically falls back to the next.
- Applied to: AI Stylist, garment tagging, image generation pipelines.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/src/services/hfService.ts` | `HF_TOKENS` array; `getNextToken()` round-robin function; retry logic with 429 detection |
| `backend/src/controllers/aiController.ts` | Uses `hfService.generateWithFallback()` instead of direct API call |

---

## [1.2.3] — 2026-05-10
### 🤖 AI Wardrobe Extraction & VTON Fallbacks
- **AI Wardrobe Extraction**: Upload a messy clothing photo → AI generates clean flat-lay version → auto-saved to closet.
- **Smart Router**: 3-level outfit suggestion priority (User Closet → Cached DB → Live SerpAPI).
- **VTON Fallback Chain**: IDM-VTON (Gradio) → Vertex AI Imagen → placeholder, for maximum reliability.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/src/controllers/clothesController.ts` | `extractAndSave` endpoint: processes upload, calls HF for clean image, saves to Cloudinary + DB |
| `backend/src/controllers/aiController.ts` | `suggestOutfit` now checks closet → cached → SerpAPI in order |
| `backend/src/services/vtonService.ts` | 3-tier VTON: `tryIDMVTON()` → `tryVertexAI()` → `fallbackPlaceholder()` |
| `backend/src/routes/clothes.ts` | Added `POST /extract` route |
| `mobile/app/(tabs)/closet.tsx` | "Extract from Photo" button added to closet screen |

---

## [1.2.2] — 2026-05-08
### 🔑 Password Authentication System
- Prisma schema updated with `password` field on User model.
- `bcryptjs` hashing for registration and login.
- Auth context updated to propagate password during signup flow.
- Registration and Login UI components updated for password input.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Added `password String?` to User model |
| `backend/src/controllers/authController.ts` | `register()` hashes password with bcrypt; `login()` verifies with `bcrypt.compare()` |
| `mobile/app/login.tsx` | Password `TextInput` added with `secureTextEntry`; passed to API |
| `mobile/app/register.tsx` | Password + confirm password fields; validation before submit |
| `mobile/contexts/AuthContext.tsx` | `signUp()` and `signIn()` now include password in payload |

---

## [1.2.1] — 2026-05-08
### ⚙️ Backend & Auth Fixes
- Applied all recent auth, onboarding, and backend fixes in single commit.
- Safe `.env.example` published (no real keys).
- Environment variables properly configured for Neon PostgreSQL, Cloudinary, SerpAPI, Groq, NVIDIA.
- AGBRAIN sync badge added to README.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/.env.example` | Template with all required env vars (no real values) |
| `README.md` | AGBRAIN sync badge + updated setup instructions |
| `backend/src/index.ts` | CORS config, port binding, route mounting order fixed |

---

## [1.2.0] — 2026-05-07
### 🏗️ Engineering Overhaul & Visual Unification
- **Pinterest Grid**: New masonry layout for Dashboard and Closet.
- **Vertex AI VTO**: Integrated Google Vertex AI Imagen 2 for high-quality virtual try-ons.
- **NVIDIA VLM**: Integrated Phi-4-multimodal for automatic garment description.
- **Corporate Luxury UI**: Comprehensive overhaul of all main screens.
- **AI Stylist**: Added 5-model fallback chain for extreme reliability.
- **Backend Architecture**: Restructured into production-style engineering setup.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/index.tsx` | Pinterest-style masonry grid with `MasonryFlashList` |
| `mobile/app/(tabs)/closet.tsx` | 2-column card grid with favorite badges |
| `mobile/app/(tabs)/profile.tsx` | Corporate luxury profile layout |
| `mobile/app/(tabs)/outfits.tsx` | Outfit cards with AI badge |
| `backend/src/services/vertexService.ts` | New file — Vertex AI Imagen 2 integration |
| `backend/src/services/nvidiaService.ts` | New file — NVIDIA Phi-4 VLM for garment tagging |
| `backend/src/controllers/aiController.ts` | 5-model fallback: Groq → Gemini → HF → NVIDIA → static |
| `backend/src/index.ts` | Route restructure, middleware setup |

---

## [1.1.0] — 2026-05-06
### 🌤️ Weather Integration & Wardrobe Management
- AI suggestions now account for local weather conditions.
- Ability to add, edit, and favorite clothing items.

**Files Changed:**
| File | Change |
|------|--------|
| `mobile/app/(tabs)/ai-stylist.tsx` | Weather data passed in AI prompt context |
| `mobile/services/weatherService.ts` | New file — OpenWeather API integration |
| `mobile/app/(tabs)/closet.tsx` | Add item modal, edit flow, favorite toggle |
| `backend/src/controllers/clothesController.ts` | CRUD endpoints: create, update, toggleFavorite |

---

## [1.0.0] — 2026-05-05
### 🚀 Initial MVP
- Basic AI Stylist chat and wardrobe view.
- Neon PostgreSQL database with Prisma ORM.
- Cloudinary image upload support.

**Files Changed:**
| File | Change |
|------|--------|
| `backend/prisma/schema.prisma` | Initial schema: User, ClothingItem, Outfit, OutfitItem models |
| `backend/src/index.ts` | Express server setup with CORS, routes |
| `backend/src/controllers/` | Initial controllers: auth, clothes, outfits, ai |
| `mobile/app/` | Initial screens: login, register, tabs layout, closet, ai-stylist |
| `mobile/services/api.ts` | API service with axios for all backend calls |
| `docker-compose.yml` | Dev PostgreSQL container config |
