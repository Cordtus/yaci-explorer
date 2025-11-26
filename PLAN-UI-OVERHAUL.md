# UI/Theme/Styles Overhaul Implementation Plan

## Overview

This plan outlines a systematic migration from the current styling system (Tailwind CSS + shadcn/ui + Radix UI) to a modern, type-safe styling system using Panda CSS + Park UI + Ark UI.

**Current Stack:**
- Tailwind CSS 3.4.17
- shadcn/ui components
- Radix UI primitives
- class-variance-authority (CVA)
- clsx + tailwind-merge

**Target Stack:**
- Panda CSS 1.5.x
- Park UI (panda-preset)
- Ark UI (React primitives)
- Built-in recipes and patterns
- Bun for package management

## Phase 1: Project Configuration and Dependencies

### 1.1 Add Panda CSS and Park UI

Add new dependencies:
```
@pandacss/dev
@pandacss/preset-base
@park-ui/panda-preset
@ark-ui/react
```

Remove old dependencies:
```
tailwindcss
tailwindcss-animate
postcss (replace config)
autoprefixer
class-variance-authority
tailwind-merge
@radix-ui/* (replaced by @ark-ui/react)
```

### 1.2 Configure Panda CSS

Create `panda.config.ts`:
- Enable React JSX framework
- Set include paths for src/**/*.{ts,tsx}
- Configure styled-system output directory
- Add Park UI preset with theme colors
- Configure semantic tokens for charts
- Remove default Panda preset colors

### 1.3 Update PostCSS Config

Replace `postcss.config.js` with `postcss.config.ts`:
- Add @pandacss/dev/postcss plugin
- Keep autoprefixer if needed

### 1.4 Update Build System

**package.json changes:**
- Add `"prepare": "panda codegen"` script
- Add `"panda:watch": "panda codegen --watch"` for development
- Update dev/build scripts for new tooling
- Consider migration to Bun (optional but recommended per branch)

### 1.5 Update TypeScript Config

- Add styled-system paths to tsconfig.json
- Update path aliases if needed

## Phase 2: Core Infrastructure

### 2.1 Generate Styled System

Run `panda codegen` to generate:
- `styled-system/css/` - css(), cx() utilities
- `styled-system/jsx/` - JSX factory and patterns
- `styled-system/recipes/` - Component recipes from Park UI
- `styled-system/tokens/` - Design tokens
- `styled-system/types/` - TypeScript types
- `styled-system/styles.css` - Generated CSS

### 2.2 Update Entry Points

**src/index.css:**
Replace Tailwind directives with Panda CSS layers:
```css
@layer reset, base, tokens, recipes, utilities;
```

**index.html:**
Link to styled-system/styles.css

**src/main.tsx (new):**
- Create new client-side entry point
- Replace react-router config with createBrowserRouter
- Set up router with all routes

### 2.3 Update Root Layout

**src/root.tsx:**
- Replace Tailwind classes with `css()` function
- Update layout structure for Panda patterns
- Remove old CSS imports

### 2.4 Create Theme Configuration

**src/theme/chartTheme.ts:**
- Create utilities for reading Panda CSS variables
- Provide fallbacks for SSR
- Export getChartColors() function

## Phase 3: UI Component Migration

Migrate each component in `src/components/ui/` from shadcn/ui to Park UI patterns.

### 3.1 Core Components (Priority 1)

| Component | Current | Target | Notes |
|-----------|---------|--------|-------|
| button.tsx | CVA + Tailwind | buttonRecipe | Map legacy variants |
| card.tsx | Tailwind classes | cardRecipe | Preserve slot structure |
| badge.tsx | CVA + Tailwind | badgeRecipe | Add custom variants |
| input.tsx | Tailwind | inputRecipe | Direct mapping |
| skeleton.tsx | Tailwind animate | skeletonRecipe | Simple replacement |

### 3.2 Form Components (Priority 2)

| Component | Current | Target |
|-----------|---------|--------|
| select.tsx | Radix Select | Ark UI Select |
| checkbox.tsx | Radix Checkbox | Ark UI Checkbox |
| label.tsx | Tailwind | formLabelRecipe |

### 3.3 Layout Components (Priority 3)

| Component | Current | Target |
|-----------|---------|--------|
| table.tsx | Tailwind | tableRecipe |
| separator.tsx | Radix | separatorRecipe or css() |
| tabs.tsx | Radix Tabs | Ark UI Tabs |
| pagination.tsx | Custom | paginationRecipe |

### 3.4 Overlay Components (Priority 4)

| Component | Current | Target |
|-----------|---------|--------|
| dialog.tsx | Radix Dialog | Ark UI Dialog |
| tooltip.tsx | Radix Tooltip | Ark UI Tooltip |
| collapsible.tsx | Radix | Ark UI Collapsible |

### Component Migration Pattern

For each component:
1. Import from styled-system: `import { css, cx } from '@/styled-system/css'`
2. Import recipe if available: `import { button } from '@/styled-system/recipes'`
3. Replace Tailwind utility classes with `css({...})` calls
4. Use recipe variants for component-specific styling
5. Maintain same public API for backwards compatibility
6. Add legacy variant mapping if API differs

Example migration (Button):
```tsx
// Before
className={cn(buttonVariants({ variant, size }), className)}

// After
className={cx(buttonRecipe({ variant: mapVariant(variant), size: mapSize(size) }), className)}
```

## Phase 4: Route Page Migration

### 4.1 Page Migration Strategy

Each route file needs conversion from Tailwind classes to Panda CSS.

**Pattern for route files:**
1. Add imports: `import { css } from '@/styled-system/css'`
2. Create a `styles` object at bottom of file with all style definitions
3. Replace inline `className="..."` with `className={styles.xxx}`
4. Group related styles logically

**Files to migrate (in order):**
1. `src/routes/home.tsx` - Dashboard page
2. `src/routes/blocks.tsx` - Block list
3. `src/routes/blocks.$id.tsx` - Block detail
4. `src/routes/transactions.tsx` - Transaction list
5. `src/routes/transactions.$hash.tsx` - Transaction detail
6. `src/routes/addr.$id.tsx` - Address detail
7. `src/routes/analytics.tsx` - Analytics dashboard
8. `src/routes/governance.tsx` - Governance list
9. `src/routes/governance.$id.tsx` - Proposal detail

### 4.2 Common Style Patterns to Define

Create reusable style patterns:
- `stack4`: `{ display: 'flex', flexDir: 'column', gap: '4' }`
- `grid2`: `{ display: 'grid', gridTemplateColumns: '2', gap: '4' }`
- `grid4`: `{ display: 'grid', gridTemplateColumns: { base: '1', md: '2', lg: '4' }, gap: '4' }`
- `backLink`: Link with icon styling
- `centeredEmpty`: Empty state centering
- `mutedText`: Muted foreground text

## Phase 5: Additional Component Migration

### 5.1 Layout Components

**src/components/layout/header.tsx:**
- Add missing `css` and `cx` imports
- Update navigation styles
- Ensure responsive behavior preserved

### 5.2 Common Components

**src/components/common/:**
- `search-bar.tsx` - Form input with icon
- `DashboardMetrics.tsx` - Metric cards grid
- `reset-notice.tsx` - Alert banner (still has Tailwind)
- `DenomDisplay.tsx` - Token display

### 5.3 Analytics Components

**src/components/analytics/:**
- `ActiveAddressesChart.tsx`
- `BlockIntervalChart.tsx`
- `NetworkMetricsCard.tsx`
- `TopMessageTypesCard.tsx`
- `TransactionVolumeChart.tsx`

Use chart theme tokens for consistent colors.

## Phase 6: Cleanup and Testing

### 6.1 Remove Old Dependencies

- Delete `tailwind.config.ts`
- Delete `components.json` (shadcn config)
- Remove Tailwind/Radix packages from package.json
- Delete unused CSS files

### 6.2 Fix Known Issues from feat/styling-rework Branch

Issues identified in the existing branch that need fixing:

1. **header.tsx** - Missing `cx` and `css` imports at top of file
2. **root.tsx** - Duplicate closing braces at end of file
3. **DashboardMetrics.tsx** - Still has ~20+ Tailwind class strings
4. **reset-notice.tsx** - All styling still Tailwind
5. **Various routes** - Mix of converted and unconverted styles
6. **DashboardMetrics.tsx** - References `YaciAPIClient` which doesn't exist (should be `api`)

### 6.3 Type Safety

- Ensure all styled-system types are generated
- Fix any TypeScript errors from migration
- Update type imports (EnhancedTransaction moved to types/blockchain.ts)

### 6.4 Build Verification

- Run typecheck: `yarn typecheck` or `bun run typecheck`
- Run build: `yarn build` or `bun run build`
- Fix any build errors
- Test development server

### 6.5 Visual Testing

- Compare each page visually against current production
- Verify responsive behavior
- Check dark mode if applicable
- Verify chart rendering

## Phase 7: Documentation Updates

### 7.1 Update CLAUDE.md

- Document new styling approach
- Update component creation patterns
- Add Panda CSS workflow notes

### 7.2 Update .env.example if needed

## Implementation Order Summary

1. **Configuration** (Phase 1) - Set up tooling
2. **Infrastructure** (Phase 2) - Generate styled-system, update entry points
3. **UI Components** (Phase 3) - Migrate all ui/ components
4. **Routes** (Phase 4) - Convert all page files
5. **Additional Components** (Phase 5) - Layout, common, analytics
6. **Cleanup** (Phase 6) - Remove old code, fix issues, test
7. **Documentation** (Phase 7) - Update docs

## Estimated Scope

- **Files to modify:** ~40-50 files
- **New files:** ~5-10 (mostly config)
- **Files to delete:** ~5-10 (old configs)
- **Generated files:** styled-system directory (~50+ files, auto-generated)

## Key Decisions

1. **Package Manager:** Migrate to Bun (per existing branch) or keep Yarn
2. **React Router:** Switch from file-based routes to programmatic router
3. **Theme Colors:** Use Park UI blue/slate preset
4. **Border Radius:** Use 'md' (matches current 0.5rem)
5. **Backwards Compatibility:** Maintain component APIs where possible

## Notes from feat/styling-rework Branch Analysis

The existing branch has significant progress but is incomplete:
- Core infrastructure is set up correctly
- Many components migrated but some have leftover Tailwind
- Some import errors need fixing
- The approach is sound - this plan follows the same pattern

This plan can be executed by cherry-picking and completing the work from that branch, or by doing a fresh implementation following these guidelines.
