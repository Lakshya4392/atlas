# Veyra v2.0 — Design & UX Standards

> **RULE**: Every screen in Veyra must feel premium, modern, and minimal. No basic UI ever.

---

## 🎨 Design Language: Glassmorphism + Editorial Minimalism

### Core Principles
1. **Premium First** — Every pixel must look like a $10M startup designed it.
2. **Glassmorphism Everywhere** — All interactive elements use frosted glass.
3. **Minimal & Clean** — Remove clutter. Only show what matters.
4. **Reference-Driven** — When a screenshot reference is provided, match it pixel-perfectly.
5. **No Basic UI** — Default unstyled React Native components are NEVER acceptable.
6. **Neutral Editorial Tone** — Fashion-forward, clean, magazine-like feel.

---

## 🖼️ Reference Breakdown (3 Core Screens)

### REF 1: Welcome / Onboarding
- **Background**: Full-bleed fashion photo collage grid (4-6 images, varying sizes)
- **Overlay**: Dark gradient from bottom (`rgba(0,0,0,0.7)` → `transparent`)
- **Heading**: Large bold white text, 28-32px, line-height tight
  - Example: "Change your Perspective In Style"
- **Subtitle**: Light grey text, 14px, below heading
- **CTA Button**: Full-width, `#000` background, `borderRadius: 30`, white text "Continue", centered
  - Bottom-pinned with safe area padding

### REF 2: Home / Discover
- **Header**: Two glass circle icons (grid + notifications) on right, no back button
- **Title**: "Discover\nYour Best Clothes" — large 28px bold, 2-line, left-aligned
- **Category Pills Row**:
  - Active: `backgroundColor: '#000'`, white text, icon on left
  - Inactive: `backgroundColor: '#FFF'`, dark text, `borderRadius: 20`
  - Horizontal scroll, `gap: 10`
  - "See All" link on right side
- **Promo Banner Card**:
  - Full-width rounded card (`borderRadius: 20`)
  - Background image with dark overlay gradient
  - White text overlay: "Today only\n50% Off With Jackets"
  - Brand tag at bottom
- **Popular Section**:
  - "Popular" heading + "See All" link
  - Product cards: white bg, `borderRadius: 16`, shadow
  - Heart icon (outline, top-right of card)
  - Star ⭐ + "4.9" rating badge (bottom-left)
  - Item name below card: "Winter Jackets"
  - Price: "$30.00" grey text
- **Bottom Tab Bar**: 5 icons (home, search, ?, heart, profile)
  - Active = filled dark, Inactive = outline grey

### REF 3: Product Detail
- **Header**: Glass circle back `<` (left) + "Product Details" (center) + glass circle `...` (right)
- **Image Card**: Large rounded card `borderRadius: 28-32`, grey bg `#E3E3E3`
  - Product image centered, `resizeMode: 'contain'`
  - Takes ~60% screen height
- **Name Row**: Product name (bold 20-22px) + glass circle heart ♡ on right
- **Price**: Below name, `fontSize: 16`, grey-ish
- **Color Picker**: Pill with color dot + "Colors" label + chevron-down
  - `backgroundColor: 'rgba(255,255,255,0.8)'`, `borderRadius: 24`
- **Size Pills Row**: S, M, L, XL circles
  - Default: white bg, grey border
  - Selected: `#000` bg, white text
  - `width: 40, height: 40, borderRadius: 20`
- **Rating Row**: ⭐ 4.9 Rating • 1.5k+ Sold (inline, grey text)
- **Bottom Bar**: Dark "Buy Now" pill (full-width) + glass cart icon (circle)

### REF 4: Dressup / Closet Browse
- **Header**: Back arrow + "Dressup" centered + shuffle + menu icons
- **Section Pattern** (repeating):
  - Section label: Small caps grey text ("TOPS", "PANTS", "SHOES", "CAPS")
  - Sub-category: Bold black centered text ("Shirts", "Trousers", "Sneakers")
  - Sub-filter tabs: Horizontally scrollable text tabs (active = bold underlined)
  - Item strip: Horizontal scroll of product images
    - Items float on white background, NO card borders
    - Products shown as flat-lay cutouts (transparent/white bg)
    - `height: ~100-120`, auto-width, `gap: 12`
- **Section Background**: Alternating white and `#F5F5F5` light grey bands
- **Bottom FABs**: White circle "+" button + white circle camera/AR icon
  - Both: `width: 48, height: 48, borderRadius: 24`
  - Subtle shadow, positioned at bottom center

### REF 5: Virtual Dressing Room / Try-On
- **Header**: Glass circle back `<` + "Model" centered title + glass circle `...`
- **Avatar Canvas**: Full-height neutral grey background
  - Model/avatar centered, full-body shot
  - Background: `#D8D8D8` or `#E0E0E0` (soft warm grey)
- **Floating Item Tags**: Small white cards floating on the model
  - `width: 36-40, height: 46-50`, `borderRadius: 8`
  - Item thumbnail inside, `resizeMode: 'contain'`
  - Red X close button: `position: absolute, top: -6, right: -6`
    - `width: 16, height: 16, borderRadius: 8, backgroundColor: '#FF3B30'`
- **Filter Row** (bottom, above carousel):
  - Left: "Filter" pill — white glass, icon + text
    - `backgroundColor: 'rgba(255,255,255,0.9)'`, `borderRadius: 20`
    - `paddingHorizontal: 14, paddingVertical: 8`
  - Right: Category dropdown "Shoes ▼" — same glass pill style
- **Item Carousel** (horizontal scroll):
  - White square cards: `width: 76-80, height: 76-80`
  - `borderRadius: 14`, `backgroundColor: '#FFF'`
  - `borderWidth: 2, borderColor: '#F0F0F0'`
  - Selected card: `borderColor: '#000'` or green checkmark badge
  - `gap: 12`
- **Save Button**: Full-width dark pill at bottom
  - `backgroundColor: '#1E1E1E'`, `borderRadius: 30`
  - `paddingVertical: 16`, white text "Save collection"
  - Heavy shadow

---

## 🎯 Extracted Design Tokens

### Colors
| Token | Value | Usage |
|-------|-------|-------|
| `bg-page` | `#EFEFEF` | Page backgrounds |
| `bg-card` | `#FFFFFF` | Cards, pills, inputs |
| `bg-image` | `#E3E3E3` | Image card placeholder |
| `bg-avatar` | `#D8D8D8` | Dressing room canvas |
| `bg-glass` | `rgba(255,255,255,0.65)` | Glass buttons |
| `bg-cta` | `#1A1A1A` | Primary action buttons |
| `text-primary` | `#111111` | Headings, names |
| `text-secondary` | `#888888` | Brands, labels |
| `text-muted` | `#999999` | Subtle info |
| `text-on-dark` | `#FFFFFF` | Text on dark buttons |
| `border-glass` | `rgba(255,255,255,0.85)` | Glass border |
| `border-card` | `#F0F0F0` | Card borders |
| `accent-red` | `#FF3B30` | Close/delete, fav active |
| `accent-star` | `#F5A623` | Rating star |
| `accent-green` | `#34C759` | Checkmark, success |

### Typography Scale
| Element | Size | Weight | Letter Spacing |
|---------|------|--------|----------------|
| Page Title | 28-32px | 700-800 | -0.5 |
| Section Heading | 20-24px | 700 | -0.4 |
| Card Title | 15-16px | 600 | 0 |
| Body Text | 14-15px | 500 | 0 |
| Label | 12-13px | 600 | 0.3 |
| Category Cap | 10-11px | 700 | 2.0 (uppercase) |
| Price | 16px | 600 | 0 |
| Button Text | 15-16px | 600-700 | 0.5 |

### Spacing
| Token | Value |
|-------|-------|
| Page horizontal padding | 20-28px |
| Section gap | 24-32px |
| Card gap | 12-16px |
| Pill gap | 8-10px |
| Bottom bar padding top | 16-18px |
| Bottom bar padding bottom | 22px (Android) / 36px (iOS) |

### Border Radius
| Element | Radius |
|---------|--------|
| Image cards | 28-32px |
| Product cards | 14-16px |
| CTA buttons | 28-30px |
| Category pills | 20px |
| Glass circle buttons | 50% (22px for 44px) |
| Item thumbnail cards | 14px |
| Promo banners | 20px |
| Size pills | 50% (20px for 40px) |

### Shadow Levels
| Level | Properties |
|-------|-----------|
| Subtle | `shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: {0, 2}` |
| Light | `shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: {0, 2}` |
| Medium | `shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: {0, 4}` |
| Heavy | `shadowOpacity: 0.15, shadowRadius: 16, shadowOffset: {0, 8}` |
| CTA | `shadowOpacity: 0.25, shadowRadius: 20, shadowOffset: {0, 10}` |

### Glass Button Template
```
width: 44, height: 44, borderRadius: 22,
backgroundColor: 'rgba(255,255,255,0.65)',
borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.85)',
shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
shadowOpacity: 0.08, shadowRadius: 12, elevation: 4,
alignItems: 'center', justifyContent: 'center',
```

### CTA Button Template
```
flex: 1, flexDirection: 'row',
backgroundColor: '#1A1A1A',
paddingVertical: 17, borderRadius: 30,
alignItems: 'center', justifyContent: 'center',
shadowColor: '#000', shadowOffset: { width: 0, height: 10 },
shadowOpacity: 0.25, shadowRadius: 20, elevation: 10,
```

### Category Pill Template
```
Active:
  backgroundColor: '#000', paddingHorizontal: 16, paddingVertical: 10,
  borderRadius: 20, flexDirection: 'row', gap: 6

Inactive:
  backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10,
  borderRadius: 20, borderWidth: 1, borderColor: '#E5E5E5'
```

---

## 🛠️ Tech Stack

### Vertex AI (VTON)
- Google Vertex AI Imagen 2 for virtual try-ons
- Service account: `backend/vton-project-*.json` (gitignored)
- Fallback: IDM-VTON (Gradio) → Vertex AI → placeholder

### SerpAPI
- `GET /api/fashion/category/:cat` — auto-seeds if < 5 items
- Categories: Tops, Bottoms, Shoes, Hats, Outerwear, Accessories

### Database
- Neon PostgreSQL + Prisma ORM
- Tables: User, ClothingItem, Outfit, OutfitItem, CachedProduct

---

## 📋 Screen Status

| Screen | Status | Style Reference |
|--------|--------|-----------------|
| Welcome/Onboarding | ✅ | REF 1 — collage grid + dark CTA |
| Home/Discover | ✅ | REF 2 — category pills + promo banner + popular grid |
| Product Detail | ✅ v2.0 | REF 3 — glassmorphism editorial |
| Closet/Dressup | 🔄 Needs update | REF 4 — section-based category browse |
| Dressing Room | ✅ v2.0 | REF 5 — avatar canvas + item carousel |
| Login/Register | ✅ | Hero image + glass inputs |
| AI Stylist | ✅ | Chat bubbles + styled input |
| Profile | ✅ | Gradient header + stats |
| Calendar | ✅ | Date picker + outfits |

---

## ⚡ UX Rules
1. **Skeleton loading** — Never blank screens, always shimmer placeholders
2. **Smooth transitions** — LayoutAnimation on state changes
3. **Error states** — Beautiful illustrations, not raw text
4. **Empty states** — Styled empty with illustration + CTA
5. **Back navigation** — Always safe with canGoBack() fallback to tabs
6. **Haptic feedback** — On save, try-on, favorite actions
7. **Image loading** — Progressive load with grey placeholder
8. **Pull to refresh** — On scrollable lists
9. **Floating tags** — Items applied on model show as small cards with red X

---

*Last updated: 2026-05-15 | Version: 2.0.0 | Based on 5 reference screens*
