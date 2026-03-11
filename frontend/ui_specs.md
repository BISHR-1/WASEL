# Frontend UI Specifications

## 1. Design Tokens & Theme

### Colors (Premium Green Theme)
| Token | Value | usage |
|---|---|---|
| `primary-main` | `#1F7A63` | Main brand color, Headers, Primary Buttons |
| `primary-hover` | `#165948` | Hover state for primary |
| `secondary-accent`| `#2FA36B` | CTAs, Highlights, Success states |
| `bg-page` | `#F9FAF8` | Main page background (Warm off-white) |
| `bg-card` | `#FFFFFF` | Card backgrounds |
| `text-main` | `#1F2933` | Primary text (Almost black) |
| `text-muted` | `#7B8794` | Secondary text, descriptions |
| `border-subtle` | `#E4E7EB` | Dividers, Card borders |
| `danger` | `#E12D39` | Error states, Delete actions |

### Typography
**Font Family**: `Tajawal`, sans-serif (Arabic/English support).

| Scale | Size (px) | Weight | Line Height | Usage |
|---|---|---|---|---|
| `heading-xl` | 32 | 700 | 1.2 | Page Titles |
| `heading-lg` | 24 | 700 | 1.3 | Section Headers |
| `heading-md` | 20 | 600 | 1.4 | Card Titles |
| `body-lg` | 18 | 400 | 1.5 | Lead text |
| `body-md` | 16 | 400 | 1.5 | General content |
| `body-sm` | 14 | 400 | 1.4 | Meta info, descriptions |
| `caption` | 12 | 400 | 1.2 | Stamps, Badges |

### Spacing & Grid
- **Base Unit**: `4px`
- **Container**: Max-width `1200px`, centered.
- **Grid**:
  - **Mobile**: 2 Columns (`gap-4`)
  - **Tablet**: 3 Columns (`gap-6`)
  - **Desktop**: 4 Columns (`gap-8`)

## 2. Component Specifications

### Product Card (`<ProductCard />`)
A compact, high-density card design.

**Visual Specs:**
- **Dimensions**: Responsive width, Aspect Ratio ~2:3.
- **Image**: Square aspect ratio (1:1), `border-radius: 8px`.
- **Shadow**: `box-shadow: 0 2px 4px rgba(0,0,0,0.05)` (Basic), `0 8px 16px rgba(0,0,0,0.1)` (Hover).
- **Interactions**:
  - Entire card click -> Navigate to Product Details.
  - Hover -> Show "Quick Add" button overlay on image.

**DOM Structure:**
```html
<article class="product-card group relative bg-white rounded-lg overflow-hidden border border-border-subtle hover:shadow-lg transition-all">
  
  <!-- Image Container -->
  <div class="aspect-square relative overflow-hidden bg-gray-100">
    <img src="{image_url}" alt="{title}" class="w-full h-full object-cover" />
    
    <!-- Discount Badge -->
    <div v-if="hasDiscount" class="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded">
      -50%
    </div>

    <!-- Favorite Button -->
    <button class="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white text-gray-400 hover:text-red-500 transition-colors">
      <HeartIcon />
    </button>
    
    <!-- Quick Add Overlay (Desktop Hover) -->
    <div class="absolute inset-x-0 bottom-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform bg-gradient-to-t from-black/50 to-transparent">
        <button class="w-full bg-secondary-accent text-white py-2 rounded font-bold shadow-md hover:bg-primary-main">
          + Add to Cart
        </button>
    </div>
  </div>

  <!-- Content -->
  <div class="p-3">
    <!-- Title -->
    <h3 class="text-text-main font-semibold text-sm truncate">{title}</h3>
    
    <!-- Description -->
    <p class="text-text-muted text-xs line-clamp-2 mt-1">{description}</p>
    
    <!-- Price -->
    <div class="mt-2 flex items-center gap-2">
      <span class="text-primary-main font-bold text-lg font-mono">
        {price_formatted}
      </span>
      <span v-if="oldPrice" class="text-gray-400 text-xs line-through">
        {old_price_formatted}
      </span>
    </div>
  </div>
</article>
```

### Loading States (`<Skeleton />`)
- Use shimmering gray placeholders (`bg-gray-200` to `bg-gray-300` animation) for image and text lines.

## 3. Global UI Rules
1. **Optimistic UI**: Buttons (Like, Add to Cart) update state *immediately* on click. Revert on server error with a Toast notification.
2. **Numeric Formatting**: Always use English numerals (0-9) for prices, even in Arabic locale.
3. **Images**: Use `object-fit: cover` to ensure uniformity.
