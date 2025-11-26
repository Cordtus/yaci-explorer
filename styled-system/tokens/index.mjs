const tokens = {
  "animations.backdrop-in": {
    "value": "fade-in 250ms var(--easings-emphasized-in)",
    "variable": "var(--animations-backdrop-in)"
  },
  "animations.backdrop-out": {
    "value": "fade-out 200ms var(--easings-emphasized-out)",
    "variable": "var(--animations-backdrop-out)"
  },
  "animations.dialog-in": {
    "value": "slide-in 400ms var(--easings-emphasized-in)",
    "variable": "var(--animations-dialog-in)"
  },
  "animations.dialog-out": {
    "value": "slide-out 200ms var(--easings-emphasized-out)",
    "variable": "var(--animations-dialog-out)"
  },
  "animations.drawer-in-left": {
    "value": "slide-in-left 400ms var(--easings-emphasized-in)",
    "variable": "var(--animations-drawer-in-left)"
  },
  "animations.drawer-out-left": {
    "value": "slide-out-left 200ms var(--easings-emphasized-out)",
    "variable": "var(--animations-drawer-out-left)"
  },
  "animations.drawer-in-right": {
    "value": "slide-in-right 400ms var(--easings-emphasized-in)",
    "variable": "var(--animations-drawer-in-right)"
  },
  "animations.drawer-out-right": {
    "value": "slide-out-right 200ms var(--easings-emphasized-out)",
    "variable": "var(--animations-drawer-out-right)"
  },
  "animations.skeleton-pulse": {
    "value": "skeleton-pulse 2s var(--easings-pulse) infinite",
    "variable": "var(--animations-skeleton-pulse)"
  },
  "animations.fade-in": {
    "value": "fade-in 400ms var(--easings-emphasized-in)",
    "variable": "var(--animations-fade-in)"
  },
  "animations.collapse-in": {
    "value": "collapse-in 250ms var(--easings-emphasized-in)",
    "variable": "var(--animations-collapse-in)"
  },
  "animations.collapse-out": {
    "value": "collapse-out 200ms var(--easings-emphasized-out)",
    "variable": "var(--animations-collapse-out)"
  },
  "animations.spin": {
    "value": "spin 1s linear infinite",
    "variable": "var(--animations-spin)"
  },
  "blurs.sm": {
    "value": "4px",
    "variable": "var(--blurs-sm)"
  },
  "blurs.base": {
    "value": "8px",
    "variable": "var(--blurs-base)"
  },
  "blurs.md": {
    "value": "12px",
    "variable": "var(--blurs-md)"
  },
  "blurs.lg": {
    "value": "16px",
    "variable": "var(--blurs-lg)"
  },
  "blurs.xl": {
    "value": "24px",
    "variable": "var(--blurs-xl)"
  },
  "blurs.2xl": {
    "value": "40px",
    "variable": "var(--blurs-2xl)"
  },
  "blurs.3xl": {
    "value": "64px",
    "variable": "var(--blurs-3xl)"
  },
  "borders.none": {
    "value": "none",
    "variable": "var(--borders-none)"
  },
  "durations.fastest": {
    "value": "50ms",
    "variable": "var(--durations-fastest)"
  },
  "durations.faster": {
    "value": "100ms",
    "variable": "var(--durations-faster)"
  },
  "durations.fast": {
    "value": "150ms",
    "variable": "var(--durations-fast)"
  },
  "durations.normal": {
    "value": "200ms",
    "variable": "var(--durations-normal)"
  },
  "durations.slow": {
    "value": "300ms",
    "variable": "var(--durations-slow)"
  },
  "durations.slower": {
    "value": "400ms",
    "variable": "var(--durations-slower)"
  },
  "durations.slowest": {
    "value": "500ms",
    "variable": "var(--durations-slowest)"
  },
  "easings.pulse": {
    "value": "cubic-bezier(0.4, 0.0, 0.6, 1.0)",
    "variable": "var(--easings-pulse)"
  },
  "easings.default": {
    "value": "cubic-bezier(0.2, 0.0, 0, 1.0)",
    "variable": "var(--easings-default)"
  },
  "easings.emphasized-in": {
    "value": "cubic-bezier(0.05, 0.7, 0.1, 1.0)",
    "variable": "var(--easings-emphasized-in)"
  },
  "easings.emphasized-out": {
    "value": "cubic-bezier(0.3, 0.0, 0.8, 0.15)",
    "variable": "var(--easings-emphasized-out)"
  },
  "fonts.sans": {
    "value": "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, \"Helvetica Neue\", Arial, \"Noto Sans\", sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\"",
    "variable": "var(--fonts-sans)"
  },
  "fonts.serif": {
    "value": "ui-serif, Georgia, Cambria, \"Times New Roman\", Times, serif",
    "variable": "var(--fonts-serif)"
  },
  "fonts.mono": {
    "value": "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, \"Liberation Mono\", \"Courier New\", monospace",
    "variable": "var(--fonts-mono)"
  },
  "fontSizes.2xs": {
    "value": "0.5rem",
    "variable": "var(--font-sizes-2xs)"
  },
  "fontSizes.xs": {
    "value": "0.75rem",
    "variable": "var(--font-sizes-xs)"
  },
  "fontSizes.sm": {
    "value": "0.875rem",
    "variable": "var(--font-sizes-sm)"
  },
  "fontSizes.md": {
    "value": "1rem",
    "variable": "var(--font-sizes-md)"
  },
  "fontSizes.lg": {
    "value": "1.125rem",
    "variable": "var(--font-sizes-lg)"
  },
  "fontSizes.xl": {
    "value": "1.25rem",
    "variable": "var(--font-sizes-xl)"
  },
  "fontSizes.2xl": {
    "value": "1.5rem",
    "variable": "var(--font-sizes-2xl)"
  },
  "fontSizes.3xl": {
    "value": "1.875rem",
    "variable": "var(--font-sizes-3xl)"
  },
  "fontSizes.4xl": {
    "value": "2.25rem",
    "variable": "var(--font-sizes-4xl)"
  },
  "fontSizes.5xl": {
    "value": "3rem",
    "variable": "var(--font-sizes-5xl)"
  },
  "fontSizes.6xl": {
    "value": "3.75rem",
    "variable": "var(--font-sizes-6xl)"
  },
  "fontSizes.7xl": {
    "value": "4.5rem",
    "variable": "var(--font-sizes-7xl)"
  },
  "fontSizes.8xl": {
    "value": "6rem",
    "variable": "var(--font-sizes-8xl)"
  },
  "fontSizes.9xl": {
    "value": "8rem",
    "variable": "var(--font-sizes-9xl)"
  },
  "fontWeights.thin": {
    "value": "100",
    "variable": "var(--font-weights-thin)"
  },
  "fontWeights.extralight": {
    "value": "200",
    "variable": "var(--font-weights-extralight)"
  },
  "fontWeights.light": {
    "value": "300",
    "variable": "var(--font-weights-light)"
  },
  "fontWeights.normal": {
    "value": "400",
    "variable": "var(--font-weights-normal)"
  },
  "fontWeights.medium": {
    "value": "500",
    "variable": "var(--font-weights-medium)"
  },
  "fontWeights.semibold": {
    "value": "600",
    "variable": "var(--font-weights-semibold)"
  },
  "fontWeights.bold": {
    "value": "700",
    "variable": "var(--font-weights-bold)"
  },
  "fontWeights.extrabold": {
    "value": "800",
    "variable": "var(--font-weights-extrabold)"
  },
  "fontWeights.black": {
    "value": "900",
    "variable": "var(--font-weights-black)"
  },
  "letterSpacings.tighter": {
    "value": "-0.05em",
    "variable": "var(--letter-spacings-tighter)"
  },
  "letterSpacings.tight": {
    "value": "-0.025em",
    "variable": "var(--letter-spacings-tight)"
  },
  "letterSpacings.normal": {
    "value": "0em",
    "variable": "var(--letter-spacings-normal)"
  },
  "letterSpacings.wide": {
    "value": "0.025em",
    "variable": "var(--letter-spacings-wide)"
  },
  "letterSpacings.wider": {
    "value": "0.05em",
    "variable": "var(--letter-spacings-wider)"
  },
  "letterSpacings.widest": {
    "value": "0.1em",
    "variable": "var(--letter-spacings-widest)"
  },
  "lineHeights.none": {
    "value": "1",
    "variable": "var(--line-heights-none)"
  },
  "lineHeights.tight": {
    "value": "1.25",
    "variable": "var(--line-heights-tight)"
  },
  "lineHeights.normal": {
    "value": "1.5",
    "variable": "var(--line-heights-normal)"
  },
  "lineHeights.relaxed": {
    "value": "1.75",
    "variable": "var(--line-heights-relaxed)"
  },
  "lineHeights.loose": {
    "value": "2",
    "variable": "var(--line-heights-loose)"
  },
  "radii.none": {
    "value": "0",
    "variable": "var(--radii-none)"
  },
  "radii.2xs": {
    "value": "0.0625rem",
    "variable": "var(--radii-2xs)"
  },
  "radii.xs": {
    "value": "0.125rem",
    "variable": "var(--radii-xs)"
  },
  "radii.sm": {
    "value": "0.25rem",
    "variable": "var(--radii-sm)"
  },
  "radii.md": {
    "value": "0.375rem",
    "variable": "var(--radii-md)"
  },
  "radii.lg": {
    "value": "0.5rem",
    "variable": "var(--radii-lg)"
  },
  "radii.xl": {
    "value": "0.75rem",
    "variable": "var(--radii-xl)"
  },
  "radii.2xl": {
    "value": "1rem",
    "variable": "var(--radii-2xl)"
  },
  "radii.3xl": {
    "value": "1.5rem",
    "variable": "var(--radii-3xl)"
  },
  "radii.full": {
    "value": "9999px",
    "variable": "var(--radii-full)"
  },
  "spacing.0": {
    "value": "0rem",
    "variable": "var(--spacing-0)"
  },
  "spacing.1": {
    "value": "0.25rem",
    "variable": "var(--spacing-1)"
  },
  "spacing.2": {
    "value": "0.5rem",
    "variable": "var(--spacing-2)"
  },
  "spacing.3": {
    "value": "0.75rem",
    "variable": "var(--spacing-3)"
  },
  "spacing.4": {
    "value": "1rem",
    "variable": "var(--spacing-4)"
  },
  "spacing.5": {
    "value": "1.25rem",
    "variable": "var(--spacing-5)"
  },
  "spacing.6": {
    "value": "1.5rem",
    "variable": "var(--spacing-6)"
  },
  "spacing.7": {
    "value": "1.75rem",
    "variable": "var(--spacing-7)"
  },
  "spacing.8": {
    "value": "2rem",
    "variable": "var(--spacing-8)"
  },
  "spacing.9": {
    "value": "2.25rem",
    "variable": "var(--spacing-9)"
  },
  "spacing.10": {
    "value": "2.5rem",
    "variable": "var(--spacing-10)"
  },
  "spacing.11": {
    "value": "2.75rem",
    "variable": "var(--spacing-11)"
  },
  "spacing.12": {
    "value": "3rem",
    "variable": "var(--spacing-12)"
  },
  "spacing.14": {
    "value": "3.5rem",
    "variable": "var(--spacing-14)"
  },
  "spacing.16": {
    "value": "4rem",
    "variable": "var(--spacing-16)"
  },
  "spacing.20": {
    "value": "5rem",
    "variable": "var(--spacing-20)"
  },
  "spacing.24": {
    "value": "6rem",
    "variable": "var(--spacing-24)"
  },
  "spacing.28": {
    "value": "7rem",
    "variable": "var(--spacing-28)"
  },
  "spacing.32": {
    "value": "8rem",
    "variable": "var(--spacing-32)"
  },
  "spacing.36": {
    "value": "9rem",
    "variable": "var(--spacing-36)"
  },
  "spacing.40": {
    "value": "10rem",
    "variable": "var(--spacing-40)"
  },
  "spacing.44": {
    "value": "11rem",
    "variable": "var(--spacing-44)"
  },
  "spacing.48": {
    "value": "12rem",
    "variable": "var(--spacing-48)"
  },
  "spacing.52": {
    "value": "13rem",
    "variable": "var(--spacing-52)"
  },
  "spacing.56": {
    "value": "14rem",
    "variable": "var(--spacing-56)"
  },
  "spacing.60": {
    "value": "15rem",
    "variable": "var(--spacing-60)"
  },
  "spacing.64": {
    "value": "16rem",
    "variable": "var(--spacing-64)"
  },
  "spacing.72": {
    "value": "18rem",
    "variable": "var(--spacing-72)"
  },
  "spacing.80": {
    "value": "20rem",
    "variable": "var(--spacing-80)"
  },
  "spacing.96": {
    "value": "24rem",
    "variable": "var(--spacing-96)"
  },
  "spacing.0.5": {
    "value": "0.125rem",
    "variable": "var(--spacing-0\\.5)"
  },
  "spacing.1.5": {
    "value": "0.375rem",
    "variable": "var(--spacing-1\\.5)"
  },
  "spacing.2.5": {
    "value": "0.625rem",
    "variable": "var(--spacing-2\\.5)"
  },
  "spacing.3.5": {
    "value": "0.875rem",
    "variable": "var(--spacing-3\\.5)"
  },
  "spacing.4.5": {
    "value": "1.125rem",
    "variable": "var(--spacing-4\\.5)"
  },
  "zIndex.hide": {
    "value": -1,
    "variable": "var(--z-index-hide)"
  },
  "zIndex.base": {
    "value": 0,
    "variable": "var(--z-index-base)"
  },
  "zIndex.docked": {
    "value": 10,
    "variable": "var(--z-index-docked)"
  },
  "zIndex.dropdown": {
    "value": 1000,
    "variable": "var(--z-index-dropdown)"
  },
  "zIndex.sticky": {
    "value": 1100,
    "variable": "var(--z-index-sticky)"
  },
  "zIndex.banner": {
    "value": 1200,
    "variable": "var(--z-index-banner)"
  },
  "zIndex.overlay": {
    "value": 1300,
    "variable": "var(--z-index-overlay)"
  },
  "zIndex.modal": {
    "value": 1400,
    "variable": "var(--z-index-modal)"
  },
  "zIndex.popover": {
    "value": 1500,
    "variable": "var(--z-index-popover)"
  },
  "zIndex.skipLink": {
    "value": 1600,
    "variable": "var(--z-index-skip-link)"
  },
  "zIndex.toast": {
    "value": 1700,
    "variable": "var(--z-index-toast)"
  },
  "zIndex.tooltip": {
    "value": 1800,
    "variable": "var(--z-index-tooltip)"
  },
  "sizes.0": {
    "value": "0rem",
    "variable": "var(--sizes-0)"
  },
  "sizes.1": {
    "value": "0.25rem",
    "variable": "var(--sizes-1)"
  },
  "sizes.2": {
    "value": "0.5rem",
    "variable": "var(--sizes-2)"
  },
  "sizes.3": {
    "value": "0.75rem",
    "variable": "var(--sizes-3)"
  },
  "sizes.4": {
    "value": "1rem",
    "variable": "var(--sizes-4)"
  },
  "sizes.5": {
    "value": "1.25rem",
    "variable": "var(--sizes-5)"
  },
  "sizes.6": {
    "value": "1.5rem",
    "variable": "var(--sizes-6)"
  },
  "sizes.7": {
    "value": "1.75rem",
    "variable": "var(--sizes-7)"
  },
  "sizes.8": {
    "value": "2rem",
    "variable": "var(--sizes-8)"
  },
  "sizes.9": {
    "value": "2.25rem",
    "variable": "var(--sizes-9)"
  },
  "sizes.10": {
    "value": "2.5rem",
    "variable": "var(--sizes-10)"
  },
  "sizes.11": {
    "value": "2.75rem",
    "variable": "var(--sizes-11)"
  },
  "sizes.12": {
    "value": "3rem",
    "variable": "var(--sizes-12)"
  },
  "sizes.14": {
    "value": "3.5rem",
    "variable": "var(--sizes-14)"
  },
  "sizes.16": {
    "value": "4rem",
    "variable": "var(--sizes-16)"
  },
  "sizes.20": {
    "value": "5rem",
    "variable": "var(--sizes-20)"
  },
  "sizes.24": {
    "value": "6rem",
    "variable": "var(--sizes-24)"
  },
  "sizes.28": {
    "value": "7rem",
    "variable": "var(--sizes-28)"
  },
  "sizes.32": {
    "value": "8rem",
    "variable": "var(--sizes-32)"
  },
  "sizes.36": {
    "value": "9rem",
    "variable": "var(--sizes-36)"
  },
  "sizes.40": {
    "value": "10rem",
    "variable": "var(--sizes-40)"
  },
  "sizes.44": {
    "value": "11rem",
    "variable": "var(--sizes-44)"
  },
  "sizes.48": {
    "value": "12rem",
    "variable": "var(--sizes-48)"
  },
  "sizes.52": {
    "value": "13rem",
    "variable": "var(--sizes-52)"
  },
  "sizes.56": {
    "value": "14rem",
    "variable": "var(--sizes-56)"
  },
  "sizes.60": {
    "value": "15rem",
    "variable": "var(--sizes-60)"
  },
  "sizes.64": {
    "value": "16rem",
    "variable": "var(--sizes-64)"
  },
  "sizes.72": {
    "value": "18rem",
    "variable": "var(--sizes-72)"
  },
  "sizes.80": {
    "value": "20rem",
    "variable": "var(--sizes-80)"
  },
  "sizes.96": {
    "value": "24rem",
    "variable": "var(--sizes-96)"
  },
  "sizes.0.5": {
    "value": "0.125rem",
    "variable": "var(--sizes-0\\.5)"
  },
  "sizes.1.5": {
    "value": "0.375rem",
    "variable": "var(--sizes-1\\.5)"
  },
  "sizes.2.5": {
    "value": "0.625rem",
    "variable": "var(--sizes-2\\.5)"
  },
  "sizes.3.5": {
    "value": "0.875rem",
    "variable": "var(--sizes-3\\.5)"
  },
  "sizes.2xs": {
    "value": "16rem",
    "variable": "var(--sizes-2xs)"
  },
  "sizes.xs": {
    "value": "20rem",
    "variable": "var(--sizes-xs)"
  },
  "sizes.sm": {
    "value": "24rem",
    "variable": "var(--sizes-sm)"
  },
  "sizes.md": {
    "value": "28rem",
    "variable": "var(--sizes-md)"
  },
  "sizes.lg": {
    "value": "32rem",
    "variable": "var(--sizes-lg)"
  },
  "sizes.xl": {
    "value": "36rem",
    "variable": "var(--sizes-xl)"
  },
  "sizes.2xl": {
    "value": "42rem",
    "variable": "var(--sizes-2xl)"
  },
  "sizes.3xl": {
    "value": "48rem",
    "variable": "var(--sizes-3xl)"
  },
  "sizes.4xl": {
    "value": "56rem",
    "variable": "var(--sizes-4xl)"
  },
  "sizes.5xl": {
    "value": "64rem",
    "variable": "var(--sizes-5xl)"
  },
  "sizes.6xl": {
    "value": "72rem",
    "variable": "var(--sizes-6xl)"
  },
  "sizes.7xl": {
    "value": "80rem",
    "variable": "var(--sizes-7xl)"
  },
  "sizes.8xl": {
    "value": "90rem",
    "variable": "var(--sizes-8xl)"
  },
  "sizes.full": {
    "value": "100%",
    "variable": "var(--sizes-full)"
  },
  "sizes.min": {
    "value": "min-content",
    "variable": "var(--sizes-min)"
  },
  "sizes.max": {
    "value": "max-content",
    "variable": "var(--sizes-max)"
  },
  "sizes.fit": {
    "value": "fit-content",
    "variable": "var(--sizes-fit)"
  },
  "sizes.4.5": {
    "value": "1.125rem",
    "variable": "var(--sizes-4\\.5)"
  },
  "sizes.breakpoint-sm": {
    "value": "640px",
    "variable": "var(--sizes-breakpoint-sm)"
  },
  "sizes.breakpoint-md": {
    "value": "768px",
    "variable": "var(--sizes-breakpoint-md)"
  },
  "sizes.breakpoint-lg": {
    "value": "1024px",
    "variable": "var(--sizes-breakpoint-lg)"
  },
  "sizes.breakpoint-xl": {
    "value": "1280px",
    "variable": "var(--sizes-breakpoint-xl)"
  },
  "sizes.breakpoint-2xl": {
    "value": "1536px",
    "variable": "var(--sizes-breakpoint-2xl)"
  },
  "colors.current": {
    "value": "currentColor",
    "variable": "var(--colors-current)"
  },
  "colors.black": {
    "value": "#000000",
    "variable": "var(--colors-black)"
  },
  "colors.black.a1": {
    "value": "rgba(0, 0, 0, 0.05)",
    "variable": "var(--colors-black-a1)"
  },
  "colors.black.a2": {
    "value": "rgba(0, 0, 0, 0.1)",
    "variable": "var(--colors-black-a2)"
  },
  "colors.black.a3": {
    "value": "rgba(0, 0, 0, 0.15)",
    "variable": "var(--colors-black-a3)"
  },
  "colors.black.a4": {
    "value": "rgba(0, 0, 0, 0.2)",
    "variable": "var(--colors-black-a4)"
  },
  "colors.black.a5": {
    "value": "rgba(0, 0, 0, 0.3)",
    "variable": "var(--colors-black-a5)"
  },
  "colors.black.a6": {
    "value": "rgba(0, 0, 0, 0.4)",
    "variable": "var(--colors-black-a6)"
  },
  "colors.black.a7": {
    "value": "rgba(0, 0, 0, 0.5)",
    "variable": "var(--colors-black-a7)"
  },
  "colors.black.a8": {
    "value": "rgba(0, 0, 0, 0.6)",
    "variable": "var(--colors-black-a8)"
  },
  "colors.black.a9": {
    "value": "rgba(0, 0, 0, 0.7)",
    "variable": "var(--colors-black-a9)"
  },
  "colors.black.a10": {
    "value": "rgba(0, 0, 0, 0.8)",
    "variable": "var(--colors-black-a10)"
  },
  "colors.black.a11": {
    "value": "rgba(0, 0, 0, 0.9)",
    "variable": "var(--colors-black-a11)"
  },
  "colors.black.a12": {
    "value": "rgba(0, 0, 0, 0.95)",
    "variable": "var(--colors-black-a12)"
  },
  "colors.white": {
    "value": "#ffffff",
    "variable": "var(--colors-white)"
  },
  "colors.white.a1": {
    "value": "rgba(255, 255, 255, 0.05)",
    "variable": "var(--colors-white-a1)"
  },
  "colors.white.a2": {
    "value": "rgba(255, 255, 255, 0.1)",
    "variable": "var(--colors-white-a2)"
  },
  "colors.white.a3": {
    "value": "rgba(255, 255, 255, 0.15)",
    "variable": "var(--colors-white-a3)"
  },
  "colors.white.a4": {
    "value": "rgba(255, 255, 255, 0.2)",
    "variable": "var(--colors-white-a4)"
  },
  "colors.white.a5": {
    "value": "rgba(255, 255, 255, 0.3)",
    "variable": "var(--colors-white-a5)"
  },
  "colors.white.a6": {
    "value": "rgba(255, 255, 255, 0.4)",
    "variable": "var(--colors-white-a6)"
  },
  "colors.white.a7": {
    "value": "rgba(255, 255, 255, 0.5)",
    "variable": "var(--colors-white-a7)"
  },
  "colors.white.a8": {
    "value": "rgba(255, 255, 255, 0.6)",
    "variable": "var(--colors-white-a8)"
  },
  "colors.white.a9": {
    "value": "rgba(255, 255, 255, 0.7)",
    "variable": "var(--colors-white-a9)"
  },
  "colors.white.a10": {
    "value": "rgba(255, 255, 255, 0.8)",
    "variable": "var(--colors-white-a10)"
  },
  "colors.white.a11": {
    "value": "rgba(255, 255, 255, 0.9)",
    "variable": "var(--colors-white-a11)"
  },
  "colors.white.a12": {
    "value": "rgba(255, 255, 255, 0.95)",
    "variable": "var(--colors-white-a12)"
  },
  "colors.transparent": {
    "value": "rgb(0 0 0 / 0)",
    "variable": "var(--colors-transparent)"
  },
  "colors.blue.light.1": {
    "value": "#fbfdff",
    "variable": "var(--colors-blue-light-1)"
  },
  "colors.blue.light.2": {
    "value": "#f4faff",
    "variable": "var(--colors-blue-light-2)"
  },
  "colors.blue.light.3": {
    "value": "#e6f4fe",
    "variable": "var(--colors-blue-light-3)"
  },
  "colors.blue.light.4": {
    "value": "#d5efff",
    "variable": "var(--colors-blue-light-4)"
  },
  "colors.blue.light.5": {
    "value": "#c2e5ff",
    "variable": "var(--colors-blue-light-5)"
  },
  "colors.blue.light.6": {
    "value": "#acd8fc",
    "variable": "var(--colors-blue-light-6)"
  },
  "colors.blue.light.7": {
    "value": "#8ec8f6",
    "variable": "var(--colors-blue-light-7)"
  },
  "colors.blue.light.8": {
    "value": "#5eb1ef",
    "variable": "var(--colors-blue-light-8)"
  },
  "colors.blue.light.9": {
    "value": "#0090ff",
    "variable": "var(--colors-blue-light-9)"
  },
  "colors.blue.light.10": {
    "value": "#0588f0",
    "variable": "var(--colors-blue-light-10)"
  },
  "colors.blue.light.11": {
    "value": "#0d74ce",
    "variable": "var(--colors-blue-light-11)"
  },
  "colors.blue.light.12": {
    "value": "#113264",
    "variable": "var(--colors-blue-light-12)"
  },
  "colors.blue.light.a1": {
    "value": "#0080ff04",
    "variable": "var(--colors-blue-light-a1)"
  },
  "colors.blue.light.a2": {
    "value": "#008cff0b",
    "variable": "var(--colors-blue-light-a2)"
  },
  "colors.blue.light.a3": {
    "value": "#008ff519",
    "variable": "var(--colors-blue-light-a3)"
  },
  "colors.blue.light.a4": {
    "value": "#009eff2a",
    "variable": "var(--colors-blue-light-a4)"
  },
  "colors.blue.light.a5": {
    "value": "#0093ff3d",
    "variable": "var(--colors-blue-light-a5)"
  },
  "colors.blue.light.a6": {
    "value": "#0088f653",
    "variable": "var(--colors-blue-light-a6)"
  },
  "colors.blue.light.a7": {
    "value": "#0083eb71",
    "variable": "var(--colors-blue-light-a7)"
  },
  "colors.blue.light.a8": {
    "value": "#0084e6a1",
    "variable": "var(--colors-blue-light-a8)"
  },
  "colors.blue.light.a9": {
    "value": "#0090ff",
    "variable": "var(--colors-blue-light-a9)"
  },
  "colors.blue.light.a10": {
    "value": "#0086f0fa",
    "variable": "var(--colors-blue-light-a10)"
  },
  "colors.blue.light.a11": {
    "value": "#006dcbf2",
    "variable": "var(--colors-blue-light-a11)"
  },
  "colors.blue.light.a12": {
    "value": "#002359ee",
    "variable": "var(--colors-blue-light-a12)"
  },
  "colors.blue.dark.1": {
    "value": "#0d1520",
    "variable": "var(--colors-blue-dark-1)"
  },
  "colors.blue.dark.2": {
    "value": "#111927",
    "variable": "var(--colors-blue-dark-2)"
  },
  "colors.blue.dark.3": {
    "value": "#0d2847",
    "variable": "var(--colors-blue-dark-3)"
  },
  "colors.blue.dark.4": {
    "value": "#003362",
    "variable": "var(--colors-blue-dark-4)"
  },
  "colors.blue.dark.5": {
    "value": "#004074",
    "variable": "var(--colors-blue-dark-5)"
  },
  "colors.blue.dark.6": {
    "value": "#104d87",
    "variable": "var(--colors-blue-dark-6)"
  },
  "colors.blue.dark.7": {
    "value": "#205d9e",
    "variable": "var(--colors-blue-dark-7)"
  },
  "colors.blue.dark.8": {
    "value": "#2870bd",
    "variable": "var(--colors-blue-dark-8)"
  },
  "colors.blue.dark.9": {
    "value": "#0090ff",
    "variable": "var(--colors-blue-dark-9)"
  },
  "colors.blue.dark.10": {
    "value": "#3b9eff",
    "variable": "var(--colors-blue-dark-10)"
  },
  "colors.blue.dark.11": {
    "value": "#70b8ff",
    "variable": "var(--colors-blue-dark-11)"
  },
  "colors.blue.dark.12": {
    "value": "#c2e6ff",
    "variable": "var(--colors-blue-dark-12)"
  },
  "colors.blue.dark.a1": {
    "value": "#004df211",
    "variable": "var(--colors-blue-dark-a1)"
  },
  "colors.blue.dark.a2": {
    "value": "#1166fb18",
    "variable": "var(--colors-blue-dark-a2)"
  },
  "colors.blue.dark.a3": {
    "value": "#0077ff3a",
    "variable": "var(--colors-blue-dark-a3)"
  },
  "colors.blue.dark.a4": {
    "value": "#0075ff57",
    "variable": "var(--colors-blue-dark-a4)"
  },
  "colors.blue.dark.a5": {
    "value": "#0081fd6b",
    "variable": "var(--colors-blue-dark-a5)"
  },
  "colors.blue.dark.a6": {
    "value": "#0f89fd7f",
    "variable": "var(--colors-blue-dark-a6)"
  },
  "colors.blue.dark.a7": {
    "value": "#2a91fe98",
    "variable": "var(--colors-blue-dark-a7)"
  },
  "colors.blue.dark.a8": {
    "value": "#3094feb9",
    "variable": "var(--colors-blue-dark-a8)"
  },
  "colors.blue.dark.a9": {
    "value": "#0090ff",
    "variable": "var(--colors-blue-dark-a9)"
  },
  "colors.blue.dark.a10": {
    "value": "#3b9eff",
    "variable": "var(--colors-blue-dark-a10)"
  },
  "colors.blue.dark.a11": {
    "value": "#70b8ff",
    "variable": "var(--colors-blue-dark-a11)"
  },
  "colors.blue.dark.a12": {
    "value": "#c2e6ff",
    "variable": "var(--colors-blue-dark-a12)"
  },
  "colors.gray.light.1": {
    "value": "#fcfcfd",
    "variable": "var(--colors-gray-light-1)"
  },
  "colors.gray.light.2": {
    "value": "#f9f9fb",
    "variable": "var(--colors-gray-light-2)"
  },
  "colors.gray.light.3": {
    "value": "#f0f0f3",
    "variable": "var(--colors-gray-light-3)"
  },
  "colors.gray.light.4": {
    "value": "#e8e8ec",
    "variable": "var(--colors-gray-light-4)"
  },
  "colors.gray.light.5": {
    "value": "#e0e1e6",
    "variable": "var(--colors-gray-light-5)"
  },
  "colors.gray.light.6": {
    "value": "#d9d9e0",
    "variable": "var(--colors-gray-light-6)"
  },
  "colors.gray.light.7": {
    "value": "#cdced6",
    "variable": "var(--colors-gray-light-7)"
  },
  "colors.gray.light.8": {
    "value": "#b9bbc6",
    "variable": "var(--colors-gray-light-8)"
  },
  "colors.gray.light.9": {
    "value": "#8b8d98",
    "variable": "var(--colors-gray-light-9)"
  },
  "colors.gray.light.10": {
    "value": "#80838d",
    "variable": "var(--colors-gray-light-10)"
  },
  "colors.gray.light.11": {
    "value": "#60646c",
    "variable": "var(--colors-gray-light-11)"
  },
  "colors.gray.light.12": {
    "value": "#1c2024",
    "variable": "var(--colors-gray-light-12)"
  },
  "colors.gray.light.a1": {
    "value": "#00005503",
    "variable": "var(--colors-gray-light-a1)"
  },
  "colors.gray.light.a2": {
    "value": "#00005506",
    "variable": "var(--colors-gray-light-a2)"
  },
  "colors.gray.light.a3": {
    "value": "#0000330f",
    "variable": "var(--colors-gray-light-a3)"
  },
  "colors.gray.light.a4": {
    "value": "#00002d17",
    "variable": "var(--colors-gray-light-a4)"
  },
  "colors.gray.light.a5": {
    "value": "#0009321f",
    "variable": "var(--colors-gray-light-a5)"
  },
  "colors.gray.light.a6": {
    "value": "#00002f26",
    "variable": "var(--colors-gray-light-a6)"
  },
  "colors.gray.light.a7": {
    "value": "#00062e32",
    "variable": "var(--colors-gray-light-a7)"
  },
  "colors.gray.light.a8": {
    "value": "#00083046",
    "variable": "var(--colors-gray-light-a8)"
  },
  "colors.gray.light.a9": {
    "value": "#00051d74",
    "variable": "var(--colors-gray-light-a9)"
  },
  "colors.gray.light.a10": {
    "value": "#00071b7f",
    "variable": "var(--colors-gray-light-a10)"
  },
  "colors.gray.light.a11": {
    "value": "#0007149f",
    "variable": "var(--colors-gray-light-a11)"
  },
  "colors.gray.light.a12": {
    "value": "#000509e3",
    "variable": "var(--colors-gray-light-a12)"
  },
  "colors.gray.dark.1": {
    "value": "#111113",
    "variable": "var(--colors-gray-dark-1)"
  },
  "colors.gray.dark.2": {
    "value": "#18191b",
    "variable": "var(--colors-gray-dark-2)"
  },
  "colors.gray.dark.3": {
    "value": "#212225",
    "variable": "var(--colors-gray-dark-3)"
  },
  "colors.gray.dark.4": {
    "value": "#272a2d",
    "variable": "var(--colors-gray-dark-4)"
  },
  "colors.gray.dark.5": {
    "value": "#2e3135",
    "variable": "var(--colors-gray-dark-5)"
  },
  "colors.gray.dark.6": {
    "value": "#363a3f",
    "variable": "var(--colors-gray-dark-6)"
  },
  "colors.gray.dark.7": {
    "value": "#43484e",
    "variable": "var(--colors-gray-dark-7)"
  },
  "colors.gray.dark.8": {
    "value": "#5a6169",
    "variable": "var(--colors-gray-dark-8)"
  },
  "colors.gray.dark.9": {
    "value": "#696e77",
    "variable": "var(--colors-gray-dark-9)"
  },
  "colors.gray.dark.10": {
    "value": "#777b84",
    "variable": "var(--colors-gray-dark-10)"
  },
  "colors.gray.dark.11": {
    "value": "#b0b4ba",
    "variable": "var(--colors-gray-dark-11)"
  },
  "colors.gray.dark.12": {
    "value": "#edeef0",
    "variable": "var(--colors-gray-dark-12)"
  },
  "colors.gray.dark.a1": {
    "value": "#00000000",
    "variable": "var(--colors-gray-dark-a1)"
  },
  "colors.gray.dark.a2": {
    "value": "#d8f4f609",
    "variable": "var(--colors-gray-dark-a2)"
  },
  "colors.gray.dark.a3": {
    "value": "#ddeaf814",
    "variable": "var(--colors-gray-dark-a3)"
  },
  "colors.gray.dark.a4": {
    "value": "#d3edf81d",
    "variable": "var(--colors-gray-dark-a4)"
  },
  "colors.gray.dark.a5": {
    "value": "#d9edfe25",
    "variable": "var(--colors-gray-dark-a5)"
  },
  "colors.gray.dark.a6": {
    "value": "#d6ebfd30",
    "variable": "var(--colors-gray-dark-a6)"
  },
  "colors.gray.dark.a7": {
    "value": "#d9edff40",
    "variable": "var(--colors-gray-dark-a7)"
  },
  "colors.gray.dark.a8": {
    "value": "#d9edff5d",
    "variable": "var(--colors-gray-dark-a8)"
  },
  "colors.gray.dark.a9": {
    "value": "#dfebfd6d",
    "variable": "var(--colors-gray-dark-a9)"
  },
  "colors.gray.dark.a10": {
    "value": "#e5edfd7b",
    "variable": "var(--colors-gray-dark-a10)"
  },
  "colors.gray.dark.a11": {
    "value": "#f1f7feb5",
    "variable": "var(--colors-gray-dark-a11)"
  },
  "colors.gray.dark.a12": {
    "value": "#fcfdffef",
    "variable": "var(--colors-gray-dark-a12)"
  },
  "colors.red.light.1": {
    "value": "#fffcfc",
    "variable": "var(--colors-red-light-1)"
  },
  "colors.red.light.2": {
    "value": "#fff7f7",
    "variable": "var(--colors-red-light-2)"
  },
  "colors.red.light.3": {
    "value": "#feebec",
    "variable": "var(--colors-red-light-3)"
  },
  "colors.red.light.4": {
    "value": "#ffdbdc",
    "variable": "var(--colors-red-light-4)"
  },
  "colors.red.light.5": {
    "value": "#ffcdce",
    "variable": "var(--colors-red-light-5)"
  },
  "colors.red.light.6": {
    "value": "#fdbdbe",
    "variable": "var(--colors-red-light-6)"
  },
  "colors.red.light.7": {
    "value": "#f4a9aa",
    "variable": "var(--colors-red-light-7)"
  },
  "colors.red.light.8": {
    "value": "#eb8e90",
    "variable": "var(--colors-red-light-8)"
  },
  "colors.red.light.9": {
    "value": "#e5484d",
    "variable": "var(--colors-red-light-9)"
  },
  "colors.red.light.10": {
    "value": "#dc3e42",
    "variable": "var(--colors-red-light-10)"
  },
  "colors.red.light.11": {
    "value": "#ce2c31",
    "variable": "var(--colors-red-light-11)"
  },
  "colors.red.light.12": {
    "value": "#641723",
    "variable": "var(--colors-red-light-12)"
  },
  "colors.red.light.a1": {
    "value": "#ff000003",
    "variable": "var(--colors-red-light-a1)"
  },
  "colors.red.light.a2": {
    "value": "#ff000008",
    "variable": "var(--colors-red-light-a2)"
  },
  "colors.red.light.a3": {
    "value": "#f3000d14",
    "variable": "var(--colors-red-light-a3)"
  },
  "colors.red.light.a4": {
    "value": "#ff000824",
    "variable": "var(--colors-red-light-a4)"
  },
  "colors.red.light.a5": {
    "value": "#ff000632",
    "variable": "var(--colors-red-light-a5)"
  },
  "colors.red.light.a6": {
    "value": "#f8000442",
    "variable": "var(--colors-red-light-a6)"
  },
  "colors.red.light.a7": {
    "value": "#df000356",
    "variable": "var(--colors-red-light-a7)"
  },
  "colors.red.light.a8": {
    "value": "#d2000571",
    "variable": "var(--colors-red-light-a8)"
  },
  "colors.red.light.a9": {
    "value": "#db0007b7",
    "variable": "var(--colors-red-light-a9)"
  },
  "colors.red.light.a10": {
    "value": "#d10005c1",
    "variable": "var(--colors-red-light-a10)"
  },
  "colors.red.light.a11": {
    "value": "#c40006d3",
    "variable": "var(--colors-red-light-a11)"
  },
  "colors.red.light.a12": {
    "value": "#55000de8",
    "variable": "var(--colors-red-light-a12)"
  },
  "colors.red.dark.1": {
    "value": "#191111",
    "variable": "var(--colors-red-dark-1)"
  },
  "colors.red.dark.2": {
    "value": "#201314",
    "variable": "var(--colors-red-dark-2)"
  },
  "colors.red.dark.3": {
    "value": "#3b1219",
    "variable": "var(--colors-red-dark-3)"
  },
  "colors.red.dark.4": {
    "value": "#500f1c",
    "variable": "var(--colors-red-dark-4)"
  },
  "colors.red.dark.5": {
    "value": "#611623",
    "variable": "var(--colors-red-dark-5)"
  },
  "colors.red.dark.6": {
    "value": "#72232d",
    "variable": "var(--colors-red-dark-6)"
  },
  "colors.red.dark.7": {
    "value": "#8c333a",
    "variable": "var(--colors-red-dark-7)"
  },
  "colors.red.dark.8": {
    "value": "#b54548",
    "variable": "var(--colors-red-dark-8)"
  },
  "colors.red.dark.9": {
    "value": "#e5484d",
    "variable": "var(--colors-red-dark-9)"
  },
  "colors.red.dark.10": {
    "value": "#ec5d5e",
    "variable": "var(--colors-red-dark-10)"
  },
  "colors.red.dark.11": {
    "value": "#ff9592",
    "variable": "var(--colors-red-dark-11)"
  },
  "colors.red.dark.12": {
    "value": "#ffd1d9",
    "variable": "var(--colors-red-dark-12)"
  },
  "colors.red.dark.a1": {
    "value": "#f4121209",
    "variable": "var(--colors-red-dark-a1)"
  },
  "colors.red.dark.a2": {
    "value": "#f22f3e11",
    "variable": "var(--colors-red-dark-a2)"
  },
  "colors.red.dark.a3": {
    "value": "#ff173f2d",
    "variable": "var(--colors-red-dark-a3)"
  },
  "colors.red.dark.a4": {
    "value": "#fe0a3b44",
    "variable": "var(--colors-red-dark-a4)"
  },
  "colors.red.dark.a5": {
    "value": "#ff204756",
    "variable": "var(--colors-red-dark-a5)"
  },
  "colors.red.dark.a6": {
    "value": "#ff3e5668",
    "variable": "var(--colors-red-dark-a6)"
  },
  "colors.red.dark.a7": {
    "value": "#ff536184",
    "variable": "var(--colors-red-dark-a7)"
  },
  "colors.red.dark.a8": {
    "value": "#ff5d61b0",
    "variable": "var(--colors-red-dark-a8)"
  },
  "colors.red.dark.a9": {
    "value": "#fe4e54e4",
    "variable": "var(--colors-red-dark-a9)"
  },
  "colors.red.dark.a10": {
    "value": "#ff6465eb",
    "variable": "var(--colors-red-dark-a10)"
  },
  "colors.red.dark.a11": {
    "value": "#ff9592",
    "variable": "var(--colors-red-dark-a11)"
  },
  "colors.red.dark.a12": {
    "value": "#ffd1d9",
    "variable": "var(--colors-red-dark-a12)"
  },
  "colors.slate.light.1": {
    "value": "#fcfcfd",
    "variable": "var(--colors-slate-light-1)"
  },
  "colors.slate.light.2": {
    "value": "#f9f9fb",
    "variable": "var(--colors-slate-light-2)"
  },
  "colors.slate.light.3": {
    "value": "#f0f0f3",
    "variable": "var(--colors-slate-light-3)"
  },
  "colors.slate.light.4": {
    "value": "#e8e8ec",
    "variable": "var(--colors-slate-light-4)"
  },
  "colors.slate.light.5": {
    "value": "#e0e1e6",
    "variable": "var(--colors-slate-light-5)"
  },
  "colors.slate.light.6": {
    "value": "#d9d9e0",
    "variable": "var(--colors-slate-light-6)"
  },
  "colors.slate.light.7": {
    "value": "#cdced6",
    "variable": "var(--colors-slate-light-7)"
  },
  "colors.slate.light.8": {
    "value": "#b9bbc6",
    "variable": "var(--colors-slate-light-8)"
  },
  "colors.slate.light.9": {
    "value": "#8b8d98",
    "variable": "var(--colors-slate-light-9)"
  },
  "colors.slate.light.10": {
    "value": "#80838d",
    "variable": "var(--colors-slate-light-10)"
  },
  "colors.slate.light.11": {
    "value": "#60646c",
    "variable": "var(--colors-slate-light-11)"
  },
  "colors.slate.light.12": {
    "value": "#1c2024",
    "variable": "var(--colors-slate-light-12)"
  },
  "colors.slate.light.a1": {
    "value": "#00005503",
    "variable": "var(--colors-slate-light-a1)"
  },
  "colors.slate.light.a2": {
    "value": "#00005506",
    "variable": "var(--colors-slate-light-a2)"
  },
  "colors.slate.light.a3": {
    "value": "#0000330f",
    "variable": "var(--colors-slate-light-a3)"
  },
  "colors.slate.light.a4": {
    "value": "#00002d17",
    "variable": "var(--colors-slate-light-a4)"
  },
  "colors.slate.light.a5": {
    "value": "#0009321f",
    "variable": "var(--colors-slate-light-a5)"
  },
  "colors.slate.light.a6": {
    "value": "#00002f26",
    "variable": "var(--colors-slate-light-a6)"
  },
  "colors.slate.light.a7": {
    "value": "#00062e32",
    "variable": "var(--colors-slate-light-a7)"
  },
  "colors.slate.light.a8": {
    "value": "#00083046",
    "variable": "var(--colors-slate-light-a8)"
  },
  "colors.slate.light.a9": {
    "value": "#00051d74",
    "variable": "var(--colors-slate-light-a9)"
  },
  "colors.slate.light.a10": {
    "value": "#00071b7f",
    "variable": "var(--colors-slate-light-a10)"
  },
  "colors.slate.light.a11": {
    "value": "#0007149f",
    "variable": "var(--colors-slate-light-a11)"
  },
  "colors.slate.light.a12": {
    "value": "#000509e3",
    "variable": "var(--colors-slate-light-a12)"
  },
  "colors.slate.dark.1": {
    "value": "#111113",
    "variable": "var(--colors-slate-dark-1)"
  },
  "colors.slate.dark.2": {
    "value": "#18191b",
    "variable": "var(--colors-slate-dark-2)"
  },
  "colors.slate.dark.3": {
    "value": "#212225",
    "variable": "var(--colors-slate-dark-3)"
  },
  "colors.slate.dark.4": {
    "value": "#272a2d",
    "variable": "var(--colors-slate-dark-4)"
  },
  "colors.slate.dark.5": {
    "value": "#2e3135",
    "variable": "var(--colors-slate-dark-5)"
  },
  "colors.slate.dark.6": {
    "value": "#363a3f",
    "variable": "var(--colors-slate-dark-6)"
  },
  "colors.slate.dark.7": {
    "value": "#43484e",
    "variable": "var(--colors-slate-dark-7)"
  },
  "colors.slate.dark.8": {
    "value": "#5a6169",
    "variable": "var(--colors-slate-dark-8)"
  },
  "colors.slate.dark.9": {
    "value": "#696e77",
    "variable": "var(--colors-slate-dark-9)"
  },
  "colors.slate.dark.10": {
    "value": "#777b84",
    "variable": "var(--colors-slate-dark-10)"
  },
  "colors.slate.dark.11": {
    "value": "#b0b4ba",
    "variable": "var(--colors-slate-dark-11)"
  },
  "colors.slate.dark.12": {
    "value": "#edeef0",
    "variable": "var(--colors-slate-dark-12)"
  },
  "colors.slate.dark.a1": {
    "value": "#00000000",
    "variable": "var(--colors-slate-dark-a1)"
  },
  "colors.slate.dark.a2": {
    "value": "#d8f4f609",
    "variable": "var(--colors-slate-dark-a2)"
  },
  "colors.slate.dark.a3": {
    "value": "#ddeaf814",
    "variable": "var(--colors-slate-dark-a3)"
  },
  "colors.slate.dark.a4": {
    "value": "#d3edf81d",
    "variable": "var(--colors-slate-dark-a4)"
  },
  "colors.slate.dark.a5": {
    "value": "#d9edfe25",
    "variable": "var(--colors-slate-dark-a5)"
  },
  "colors.slate.dark.a6": {
    "value": "#d6ebfd30",
    "variable": "var(--colors-slate-dark-a6)"
  },
  "colors.slate.dark.a7": {
    "value": "#d9edff40",
    "variable": "var(--colors-slate-dark-a7)"
  },
  "colors.slate.dark.a8": {
    "value": "#d9edff5d",
    "variable": "var(--colors-slate-dark-a8)"
  },
  "colors.slate.dark.a9": {
    "value": "#dfebfd6d",
    "variable": "var(--colors-slate-dark-a9)"
  },
  "colors.slate.dark.a10": {
    "value": "#e5edfd7b",
    "variable": "var(--colors-slate-dark-a10)"
  },
  "colors.slate.dark.a11": {
    "value": "#f1f7feb5",
    "variable": "var(--colors-slate-dark-a11)"
  },
  "colors.slate.dark.a12": {
    "value": "#fcfdffef",
    "variable": "var(--colors-slate-dark-a12)"
  },
  "colors.chartBlue.light": {
    "value": "#3b82f6",
    "variable": "var(--colors-chart-blue-light)"
  },
  "colors.chartBlue.dark": {
    "value": "#60a5fa",
    "variable": "var(--colors-chart-blue-dark)"
  },
  "colors.chartGreen.light": {
    "value": "#22c55e",
    "variable": "var(--colors-chart-green-light)"
  },
  "colors.chartGreen.dark": {
    "value": "#4ade80",
    "variable": "var(--colors-chart-green-dark)"
  },
  "colors.chartGray.light": {
    "value": "#e2e8f0",
    "variable": "var(--colors-chart-gray-light)"
  },
  "colors.chartGray.dark": {
    "value": "#1e293b",
    "variable": "var(--colors-chart-gray-dark)"
  },
  "colors.chartAxis.light": {
    "value": "#94a3b8",
    "variable": "var(--colors-chart-axis-light)"
  },
  "colors.chartAxis.dark": {
    "value": "#64748b",
    "variable": "var(--colors-chart-axis-dark)"
  },
  "breakpoints.sm": {
    "value": "640px",
    "variable": "var(--breakpoints-sm)"
  },
  "breakpoints.md": {
    "value": "768px",
    "variable": "var(--breakpoints-md)"
  },
  "breakpoints.lg": {
    "value": "1024px",
    "variable": "var(--breakpoints-lg)"
  },
  "breakpoints.xl": {
    "value": "1280px",
    "variable": "var(--breakpoints-xl)"
  },
  "breakpoints.2xl": {
    "value": "1536px",
    "variable": "var(--breakpoints-2xl)"
  },
  "radii.l1": {
    "value": "var(--radii-xs)",
    "variable": "var(--radii-l1)"
  },
  "radii.l2": {
    "value": "var(--radii-sm)",
    "variable": "var(--radii-l2)"
  },
  "radii.l3": {
    "value": "var(--radii-md)",
    "variable": "var(--radii-l3)"
  },
  "colors.chart.transactions": {
    "value": "var(--colors-chart-transactions)",
    "variable": "var(--colors-chart-transactions)"
  },
  "colors.chart.gas": {
    "value": "var(--colors-chart-gas)",
    "variable": "var(--colors-chart-gas)"
  },
  "colors.chart.grid": {
    "value": "var(--colors-chart-grid)",
    "variable": "var(--colors-chart-grid)"
  },
  "colors.chart.axis": {
    "value": "var(--colors-chart-axis)",
    "variable": "var(--colors-chart-axis)"
  },
  "spacing.-1": {
    "value": "calc(var(--spacing-1) * -1)",
    "variable": "var(--spacing-1)"
  },
  "spacing.-2": {
    "value": "calc(var(--spacing-2) * -1)",
    "variable": "var(--spacing-2)"
  },
  "spacing.-3": {
    "value": "calc(var(--spacing-3) * -1)",
    "variable": "var(--spacing-3)"
  },
  "spacing.-4": {
    "value": "calc(var(--spacing-4) * -1)",
    "variable": "var(--spacing-4)"
  },
  "spacing.-5": {
    "value": "calc(var(--spacing-5) * -1)",
    "variable": "var(--spacing-5)"
  },
  "spacing.-6": {
    "value": "calc(var(--spacing-6) * -1)",
    "variable": "var(--spacing-6)"
  },
  "spacing.-7": {
    "value": "calc(var(--spacing-7) * -1)",
    "variable": "var(--spacing-7)"
  },
  "spacing.-8": {
    "value": "calc(var(--spacing-8) * -1)",
    "variable": "var(--spacing-8)"
  },
  "spacing.-9": {
    "value": "calc(var(--spacing-9) * -1)",
    "variable": "var(--spacing-9)"
  },
  "spacing.-10": {
    "value": "calc(var(--spacing-10) * -1)",
    "variable": "var(--spacing-10)"
  },
  "spacing.-11": {
    "value": "calc(var(--spacing-11) * -1)",
    "variable": "var(--spacing-11)"
  },
  "spacing.-12": {
    "value": "calc(var(--spacing-12) * -1)",
    "variable": "var(--spacing-12)"
  },
  "spacing.-14": {
    "value": "calc(var(--spacing-14) * -1)",
    "variable": "var(--spacing-14)"
  },
  "spacing.-16": {
    "value": "calc(var(--spacing-16) * -1)",
    "variable": "var(--spacing-16)"
  },
  "spacing.-20": {
    "value": "calc(var(--spacing-20) * -1)",
    "variable": "var(--spacing-20)"
  },
  "spacing.-24": {
    "value": "calc(var(--spacing-24) * -1)",
    "variable": "var(--spacing-24)"
  },
  "spacing.-28": {
    "value": "calc(var(--spacing-28) * -1)",
    "variable": "var(--spacing-28)"
  },
  "spacing.-32": {
    "value": "calc(var(--spacing-32) * -1)",
    "variable": "var(--spacing-32)"
  },
  "spacing.-36": {
    "value": "calc(var(--spacing-36) * -1)",
    "variable": "var(--spacing-36)"
  },
  "spacing.-40": {
    "value": "calc(var(--spacing-40) * -1)",
    "variable": "var(--spacing-40)"
  },
  "spacing.-44": {
    "value": "calc(var(--spacing-44) * -1)",
    "variable": "var(--spacing-44)"
  },
  "spacing.-48": {
    "value": "calc(var(--spacing-48) * -1)",
    "variable": "var(--spacing-48)"
  },
  "spacing.-52": {
    "value": "calc(var(--spacing-52) * -1)",
    "variable": "var(--spacing-52)"
  },
  "spacing.-56": {
    "value": "calc(var(--spacing-56) * -1)",
    "variable": "var(--spacing-56)"
  },
  "spacing.-60": {
    "value": "calc(var(--spacing-60) * -1)",
    "variable": "var(--spacing-60)"
  },
  "spacing.-64": {
    "value": "calc(var(--spacing-64) * -1)",
    "variable": "var(--spacing-64)"
  },
  "spacing.-72": {
    "value": "calc(var(--spacing-72) * -1)",
    "variable": "var(--spacing-72)"
  },
  "spacing.-80": {
    "value": "calc(var(--spacing-80) * -1)",
    "variable": "var(--spacing-80)"
  },
  "spacing.-96": {
    "value": "calc(var(--spacing-96) * -1)",
    "variable": "var(--spacing-96)"
  },
  "spacing.-0.5": {
    "value": "calc(var(--spacing-0\\.5) * -1)",
    "variable": "var(--spacing-0\\.5)"
  },
  "spacing.-1.5": {
    "value": "calc(var(--spacing-1\\.5) * -1)",
    "variable": "var(--spacing-1\\.5)"
  },
  "spacing.-2.5": {
    "value": "calc(var(--spacing-2\\.5) * -1)",
    "variable": "var(--spacing-2\\.5)"
  },
  "spacing.-3.5": {
    "value": "calc(var(--spacing-3\\.5) * -1)",
    "variable": "var(--spacing-3\\.5)"
  },
  "spacing.-4.5": {
    "value": "calc(var(--spacing-4\\.5) * -1)",
    "variable": "var(--spacing-4\\.5)"
  },
  "shadows.xs": {
    "value": "var(--shadows-xs)",
    "variable": "var(--shadows-xs)"
  },
  "shadows.sm": {
    "value": "var(--shadows-sm)",
    "variable": "var(--shadows-sm)"
  },
  "shadows.md": {
    "value": "var(--shadows-md)",
    "variable": "var(--shadows-md)"
  },
  "shadows.lg": {
    "value": "var(--shadows-lg)",
    "variable": "var(--shadows-lg)"
  },
  "shadows.xl": {
    "value": "var(--shadows-xl)",
    "variable": "var(--shadows-xl)"
  },
  "shadows.2xl": {
    "value": "var(--shadows-2xl)",
    "variable": "var(--shadows-2xl)"
  },
  "colors.blue.1": {
    "value": "var(--colors-blue-1)",
    "variable": "var(--colors-blue-1)"
  },
  "colors.blue.2": {
    "value": "var(--colors-blue-2)",
    "variable": "var(--colors-blue-2)"
  },
  "colors.blue.3": {
    "value": "var(--colors-blue-3)",
    "variable": "var(--colors-blue-3)"
  },
  "colors.blue.4": {
    "value": "var(--colors-blue-4)",
    "variable": "var(--colors-blue-4)"
  },
  "colors.blue.5": {
    "value": "var(--colors-blue-5)",
    "variable": "var(--colors-blue-5)"
  },
  "colors.blue.6": {
    "value": "var(--colors-blue-6)",
    "variable": "var(--colors-blue-6)"
  },
  "colors.blue.7": {
    "value": "var(--colors-blue-7)",
    "variable": "var(--colors-blue-7)"
  },
  "colors.blue.8": {
    "value": "var(--colors-blue-8)",
    "variable": "var(--colors-blue-8)"
  },
  "colors.blue.9": {
    "value": "var(--colors-blue-9)",
    "variable": "var(--colors-blue-9)"
  },
  "colors.blue.10": {
    "value": "var(--colors-blue-10)",
    "variable": "var(--colors-blue-10)"
  },
  "colors.blue.11": {
    "value": "var(--colors-blue-11)",
    "variable": "var(--colors-blue-11)"
  },
  "colors.blue.12": {
    "value": "var(--colors-blue-12)",
    "variable": "var(--colors-blue-12)"
  },
  "colors.blue.a1": {
    "value": "var(--colors-blue-a1)",
    "variable": "var(--colors-blue-a1)"
  },
  "colors.blue.a2": {
    "value": "var(--colors-blue-a2)",
    "variable": "var(--colors-blue-a2)"
  },
  "colors.blue.a3": {
    "value": "var(--colors-blue-a3)",
    "variable": "var(--colors-blue-a3)"
  },
  "colors.blue.a4": {
    "value": "var(--colors-blue-a4)",
    "variable": "var(--colors-blue-a4)"
  },
  "colors.blue.a5": {
    "value": "var(--colors-blue-a5)",
    "variable": "var(--colors-blue-a5)"
  },
  "colors.blue.a6": {
    "value": "var(--colors-blue-a6)",
    "variable": "var(--colors-blue-a6)"
  },
  "colors.blue.a7": {
    "value": "var(--colors-blue-a7)",
    "variable": "var(--colors-blue-a7)"
  },
  "colors.blue.a8": {
    "value": "var(--colors-blue-a8)",
    "variable": "var(--colors-blue-a8)"
  },
  "colors.blue.a9": {
    "value": "var(--colors-blue-a9)",
    "variable": "var(--colors-blue-a9)"
  },
  "colors.blue.a10": {
    "value": "var(--colors-blue-a10)",
    "variable": "var(--colors-blue-a10)"
  },
  "colors.blue.a11": {
    "value": "var(--colors-blue-a11)",
    "variable": "var(--colors-blue-a11)"
  },
  "colors.blue.a12": {
    "value": "var(--colors-blue-a12)",
    "variable": "var(--colors-blue-a12)"
  },
  "colors.blue.default": {
    "value": "var(--colors-blue-default)",
    "variable": "var(--colors-blue-default)"
  },
  "colors.blue.emphasized": {
    "value": "var(--colors-blue-emphasized)",
    "variable": "var(--colors-blue-emphasized)"
  },
  "colors.blue.fg": {
    "value": "var(--colors-blue-fg)",
    "variable": "var(--colors-blue-fg)"
  },
  "colors.blue.text": {
    "value": "var(--colors-blue-text)",
    "variable": "var(--colors-blue-text)"
  },
  "colors.red.1": {
    "value": "var(--colors-red-1)",
    "variable": "var(--colors-red-1)"
  },
  "colors.red.2": {
    "value": "var(--colors-red-2)",
    "variable": "var(--colors-red-2)"
  },
  "colors.red.3": {
    "value": "var(--colors-red-3)",
    "variable": "var(--colors-red-3)"
  },
  "colors.red.4": {
    "value": "var(--colors-red-4)",
    "variable": "var(--colors-red-4)"
  },
  "colors.red.5": {
    "value": "var(--colors-red-5)",
    "variable": "var(--colors-red-5)"
  },
  "colors.red.6": {
    "value": "var(--colors-red-6)",
    "variable": "var(--colors-red-6)"
  },
  "colors.red.7": {
    "value": "var(--colors-red-7)",
    "variable": "var(--colors-red-7)"
  },
  "colors.red.8": {
    "value": "var(--colors-red-8)",
    "variable": "var(--colors-red-8)"
  },
  "colors.red.9": {
    "value": "var(--colors-red-9)",
    "variable": "var(--colors-red-9)"
  },
  "colors.red.10": {
    "value": "var(--colors-red-10)",
    "variable": "var(--colors-red-10)"
  },
  "colors.red.11": {
    "value": "var(--colors-red-11)",
    "variable": "var(--colors-red-11)"
  },
  "colors.red.12": {
    "value": "var(--colors-red-12)",
    "variable": "var(--colors-red-12)"
  },
  "colors.red.a1": {
    "value": "var(--colors-red-a1)",
    "variable": "var(--colors-red-a1)"
  },
  "colors.red.a2": {
    "value": "var(--colors-red-a2)",
    "variable": "var(--colors-red-a2)"
  },
  "colors.red.a3": {
    "value": "var(--colors-red-a3)",
    "variable": "var(--colors-red-a3)"
  },
  "colors.red.a4": {
    "value": "var(--colors-red-a4)",
    "variable": "var(--colors-red-a4)"
  },
  "colors.red.a5": {
    "value": "var(--colors-red-a5)",
    "variable": "var(--colors-red-a5)"
  },
  "colors.red.a6": {
    "value": "var(--colors-red-a6)",
    "variable": "var(--colors-red-a6)"
  },
  "colors.red.a7": {
    "value": "var(--colors-red-a7)",
    "variable": "var(--colors-red-a7)"
  },
  "colors.red.a8": {
    "value": "var(--colors-red-a8)",
    "variable": "var(--colors-red-a8)"
  },
  "colors.red.a9": {
    "value": "var(--colors-red-a9)",
    "variable": "var(--colors-red-a9)"
  },
  "colors.red.a10": {
    "value": "var(--colors-red-a10)",
    "variable": "var(--colors-red-a10)"
  },
  "colors.red.a11": {
    "value": "var(--colors-red-a11)",
    "variable": "var(--colors-red-a11)"
  },
  "colors.red.a12": {
    "value": "var(--colors-red-a12)",
    "variable": "var(--colors-red-a12)"
  },
  "colors.red.default": {
    "value": "var(--colors-red-default)",
    "variable": "var(--colors-red-default)"
  },
  "colors.red.emphasized": {
    "value": "var(--colors-red-emphasized)",
    "variable": "var(--colors-red-emphasized)"
  },
  "colors.red.fg": {
    "value": "var(--colors-red-fg)",
    "variable": "var(--colors-red-fg)"
  },
  "colors.red.text": {
    "value": "var(--colors-red-text)",
    "variable": "var(--colors-red-text)"
  },
  "colors.slate.1": {
    "value": "var(--colors-slate-1)",
    "variable": "var(--colors-slate-1)"
  },
  "colors.slate.2": {
    "value": "var(--colors-slate-2)",
    "variable": "var(--colors-slate-2)"
  },
  "colors.slate.3": {
    "value": "var(--colors-slate-3)",
    "variable": "var(--colors-slate-3)"
  },
  "colors.slate.4": {
    "value": "var(--colors-slate-4)",
    "variable": "var(--colors-slate-4)"
  },
  "colors.slate.5": {
    "value": "var(--colors-slate-5)",
    "variable": "var(--colors-slate-5)"
  },
  "colors.slate.6": {
    "value": "var(--colors-slate-6)",
    "variable": "var(--colors-slate-6)"
  },
  "colors.slate.7": {
    "value": "var(--colors-slate-7)",
    "variable": "var(--colors-slate-7)"
  },
  "colors.slate.8": {
    "value": "var(--colors-slate-8)",
    "variable": "var(--colors-slate-8)"
  },
  "colors.slate.9": {
    "value": "var(--colors-slate-9)",
    "variable": "var(--colors-slate-9)"
  },
  "colors.slate.10": {
    "value": "var(--colors-slate-10)",
    "variable": "var(--colors-slate-10)"
  },
  "colors.slate.11": {
    "value": "var(--colors-slate-11)",
    "variable": "var(--colors-slate-11)"
  },
  "colors.slate.12": {
    "value": "var(--colors-slate-12)",
    "variable": "var(--colors-slate-12)"
  },
  "colors.slate.a1": {
    "value": "var(--colors-slate-a1)",
    "variable": "var(--colors-slate-a1)"
  },
  "colors.slate.a2": {
    "value": "var(--colors-slate-a2)",
    "variable": "var(--colors-slate-a2)"
  },
  "colors.slate.a3": {
    "value": "var(--colors-slate-a3)",
    "variable": "var(--colors-slate-a3)"
  },
  "colors.slate.a4": {
    "value": "var(--colors-slate-a4)",
    "variable": "var(--colors-slate-a4)"
  },
  "colors.slate.a5": {
    "value": "var(--colors-slate-a5)",
    "variable": "var(--colors-slate-a5)"
  },
  "colors.slate.a6": {
    "value": "var(--colors-slate-a6)",
    "variable": "var(--colors-slate-a6)"
  },
  "colors.slate.a7": {
    "value": "var(--colors-slate-a7)",
    "variable": "var(--colors-slate-a7)"
  },
  "colors.slate.a8": {
    "value": "var(--colors-slate-a8)",
    "variable": "var(--colors-slate-a8)"
  },
  "colors.slate.a9": {
    "value": "var(--colors-slate-a9)",
    "variable": "var(--colors-slate-a9)"
  },
  "colors.slate.a10": {
    "value": "var(--colors-slate-a10)",
    "variable": "var(--colors-slate-a10)"
  },
  "colors.slate.a11": {
    "value": "var(--colors-slate-a11)",
    "variable": "var(--colors-slate-a11)"
  },
  "colors.slate.a12": {
    "value": "var(--colors-slate-a12)",
    "variable": "var(--colors-slate-a12)"
  },
  "colors.slate.default": {
    "value": "var(--colors-slate-default)",
    "variable": "var(--colors-slate-default)"
  },
  "colors.slate.emphasized": {
    "value": "var(--colors-slate-emphasized)",
    "variable": "var(--colors-slate-emphasized)"
  },
  "colors.slate.fg": {
    "value": "var(--colors-slate-fg)",
    "variable": "var(--colors-slate-fg)"
  },
  "colors.slate.text": {
    "value": "var(--colors-slate-text)",
    "variable": "var(--colors-slate-text)"
  },
  "colors.gray.1": {
    "value": "var(--colors-gray-1)",
    "variable": "var(--colors-gray-1)"
  },
  "colors.gray.2": {
    "value": "var(--colors-gray-2)",
    "variable": "var(--colors-gray-2)"
  },
  "colors.gray.3": {
    "value": "var(--colors-gray-3)",
    "variable": "var(--colors-gray-3)"
  },
  "colors.gray.4": {
    "value": "var(--colors-gray-4)",
    "variable": "var(--colors-gray-4)"
  },
  "colors.gray.5": {
    "value": "var(--colors-gray-5)",
    "variable": "var(--colors-gray-5)"
  },
  "colors.gray.6": {
    "value": "var(--colors-gray-6)",
    "variable": "var(--colors-gray-6)"
  },
  "colors.gray.7": {
    "value": "var(--colors-gray-7)",
    "variable": "var(--colors-gray-7)"
  },
  "colors.gray.8": {
    "value": "var(--colors-gray-8)",
    "variable": "var(--colors-gray-8)"
  },
  "colors.gray.9": {
    "value": "var(--colors-gray-9)",
    "variable": "var(--colors-gray-9)"
  },
  "colors.gray.10": {
    "value": "var(--colors-gray-10)",
    "variable": "var(--colors-gray-10)"
  },
  "colors.gray.11": {
    "value": "var(--colors-gray-11)",
    "variable": "var(--colors-gray-11)"
  },
  "colors.gray.12": {
    "value": "var(--colors-gray-12)",
    "variable": "var(--colors-gray-12)"
  },
  "colors.gray.a1": {
    "value": "var(--colors-gray-a1)",
    "variable": "var(--colors-gray-a1)"
  },
  "colors.gray.a2": {
    "value": "var(--colors-gray-a2)",
    "variable": "var(--colors-gray-a2)"
  },
  "colors.gray.a3": {
    "value": "var(--colors-gray-a3)",
    "variable": "var(--colors-gray-a3)"
  },
  "colors.gray.a4": {
    "value": "var(--colors-gray-a4)",
    "variable": "var(--colors-gray-a4)"
  },
  "colors.gray.a5": {
    "value": "var(--colors-gray-a5)",
    "variable": "var(--colors-gray-a5)"
  },
  "colors.gray.a6": {
    "value": "var(--colors-gray-a6)",
    "variable": "var(--colors-gray-a6)"
  },
  "colors.gray.a7": {
    "value": "var(--colors-gray-a7)",
    "variable": "var(--colors-gray-a7)"
  },
  "colors.gray.a8": {
    "value": "var(--colors-gray-a8)",
    "variable": "var(--colors-gray-a8)"
  },
  "colors.gray.a9": {
    "value": "var(--colors-gray-a9)",
    "variable": "var(--colors-gray-a9)"
  },
  "colors.gray.a10": {
    "value": "var(--colors-gray-a10)",
    "variable": "var(--colors-gray-a10)"
  },
  "colors.gray.a11": {
    "value": "var(--colors-gray-a11)",
    "variable": "var(--colors-gray-a11)"
  },
  "colors.gray.a12": {
    "value": "var(--colors-gray-a12)",
    "variable": "var(--colors-gray-a12)"
  },
  "colors.gray.default": {
    "value": "var(--colors-gray-default)",
    "variable": "var(--colors-gray-default)"
  },
  "colors.gray.emphasized": {
    "value": "var(--colors-gray-emphasized)",
    "variable": "var(--colors-gray-emphasized)"
  },
  "colors.gray.fg": {
    "value": "var(--colors-gray-fg)",
    "variable": "var(--colors-gray-fg)"
  },
  "colors.gray.text": {
    "value": "var(--colors-gray-text)",
    "variable": "var(--colors-gray-text)"
  },
  "colors.accent.1": {
    "value": "var(--colors-accent-1)",
    "variable": "var(--colors-accent-1)"
  },
  "colors.accent.2": {
    "value": "var(--colors-accent-2)",
    "variable": "var(--colors-accent-2)"
  },
  "colors.accent.3": {
    "value": "var(--colors-accent-3)",
    "variable": "var(--colors-accent-3)"
  },
  "colors.accent.4": {
    "value": "var(--colors-accent-4)",
    "variable": "var(--colors-accent-4)"
  },
  "colors.accent.5": {
    "value": "var(--colors-accent-5)",
    "variable": "var(--colors-accent-5)"
  },
  "colors.accent.6": {
    "value": "var(--colors-accent-6)",
    "variable": "var(--colors-accent-6)"
  },
  "colors.accent.7": {
    "value": "var(--colors-accent-7)",
    "variable": "var(--colors-accent-7)"
  },
  "colors.accent.8": {
    "value": "var(--colors-accent-8)",
    "variable": "var(--colors-accent-8)"
  },
  "colors.accent.9": {
    "value": "var(--colors-accent-9)",
    "variable": "var(--colors-accent-9)"
  },
  "colors.accent.10": {
    "value": "var(--colors-accent-10)",
    "variable": "var(--colors-accent-10)"
  },
  "colors.accent.11": {
    "value": "var(--colors-accent-11)",
    "variable": "var(--colors-accent-11)"
  },
  "colors.accent.12": {
    "value": "var(--colors-accent-12)",
    "variable": "var(--colors-accent-12)"
  },
  "colors.accent.a1": {
    "value": "var(--colors-accent-a1)",
    "variable": "var(--colors-accent-a1)"
  },
  "colors.accent.a2": {
    "value": "var(--colors-accent-a2)",
    "variable": "var(--colors-accent-a2)"
  },
  "colors.accent.a3": {
    "value": "var(--colors-accent-a3)",
    "variable": "var(--colors-accent-a3)"
  },
  "colors.accent.a4": {
    "value": "var(--colors-accent-a4)",
    "variable": "var(--colors-accent-a4)"
  },
  "colors.accent.a5": {
    "value": "var(--colors-accent-a5)",
    "variable": "var(--colors-accent-a5)"
  },
  "colors.accent.a6": {
    "value": "var(--colors-accent-a6)",
    "variable": "var(--colors-accent-a6)"
  },
  "colors.accent.a7": {
    "value": "var(--colors-accent-a7)",
    "variable": "var(--colors-accent-a7)"
  },
  "colors.accent.a8": {
    "value": "var(--colors-accent-a8)",
    "variable": "var(--colors-accent-a8)"
  },
  "colors.accent.a9": {
    "value": "var(--colors-accent-a9)",
    "variable": "var(--colors-accent-a9)"
  },
  "colors.accent.a10": {
    "value": "var(--colors-accent-a10)",
    "variable": "var(--colors-accent-a10)"
  },
  "colors.accent.a11": {
    "value": "var(--colors-accent-a11)",
    "variable": "var(--colors-accent-a11)"
  },
  "colors.accent.a12": {
    "value": "var(--colors-accent-a12)",
    "variable": "var(--colors-accent-a12)"
  },
  "colors.accent.default": {
    "value": "var(--colors-accent-default)",
    "variable": "var(--colors-accent-default)"
  },
  "colors.accent.emphasized": {
    "value": "var(--colors-accent-emphasized)",
    "variable": "var(--colors-accent-emphasized)"
  },
  "colors.accent.fg": {
    "value": "var(--colors-accent-fg)",
    "variable": "var(--colors-accent-fg)"
  },
  "colors.accent.text": {
    "value": "var(--colors-accent-text)",
    "variable": "var(--colors-accent-text)"
  },
  "colors.bg.canvas": {
    "value": "var(--colors-bg-canvas)",
    "variable": "var(--colors-bg-canvas)"
  },
  "colors.bg.default": {
    "value": "var(--colors-bg-default)",
    "variable": "var(--colors-bg-default)"
  },
  "colors.bg.subtle": {
    "value": "var(--colors-bg-subtle)",
    "variable": "var(--colors-bg-subtle)"
  },
  "colors.bg.muted": {
    "value": "var(--colors-bg-muted)",
    "variable": "var(--colors-bg-muted)"
  },
  "colors.bg.emphasized": {
    "value": "var(--colors-bg-emphasized)",
    "variable": "var(--colors-bg-emphasized)"
  },
  "colors.bg.disabled": {
    "value": "var(--colors-bg-disabled)",
    "variable": "var(--colors-bg-disabled)"
  },
  "colors.fg.default": {
    "value": "var(--colors-fg-default)",
    "variable": "var(--colors-fg-default)"
  },
  "colors.fg.muted": {
    "value": "var(--colors-fg-muted)",
    "variable": "var(--colors-fg-muted)"
  },
  "colors.fg.subtle": {
    "value": "var(--colors-fg-subtle)",
    "variable": "var(--colors-fg-subtle)"
  },
  "colors.fg.disabled": {
    "value": "var(--colors-fg-disabled)",
    "variable": "var(--colors-fg-disabled)"
  },
  "colors.fg.error": {
    "value": "var(--colors-fg-error)",
    "variable": "var(--colors-fg-error)"
  },
  "colors.border.default": {
    "value": "var(--colors-border-default)",
    "variable": "var(--colors-border-default)"
  },
  "colors.border.muted": {
    "value": "var(--colors-border-muted)",
    "variable": "var(--colors-border-muted)"
  },
  "colors.border.subtle": {
    "value": "var(--colors-border-subtle)",
    "variable": "var(--colors-border-subtle)"
  },
  "colors.border.disabled": {
    "value": "var(--colors-border-disabled)",
    "variable": "var(--colors-border-disabled)"
  },
  "colors.border.outline": {
    "value": "var(--colors-border-outline)",
    "variable": "var(--colors-border-outline)"
  },
  "colors.border.error": {
    "value": "var(--colors-border-error)",
    "variable": "var(--colors-border-error)"
  },
  "colors.colorPalette": {
    "value": "var(--colors-color-palette)",
    "variable": "var(--colors-color-palette)"
  },
  "colors.colorPalette.a1": {
    "value": "var(--colors-color-palette-a1)",
    "variable": "var(--colors-color-palette-a1)"
  },
  "colors.colorPalette.a2": {
    "value": "var(--colors-color-palette-a2)",
    "variable": "var(--colors-color-palette-a2)"
  },
  "colors.colorPalette.a3": {
    "value": "var(--colors-color-palette-a3)",
    "variable": "var(--colors-color-palette-a3)"
  },
  "colors.colorPalette.a4": {
    "value": "var(--colors-color-palette-a4)",
    "variable": "var(--colors-color-palette-a4)"
  },
  "colors.colorPalette.a5": {
    "value": "var(--colors-color-palette-a5)",
    "variable": "var(--colors-color-palette-a5)"
  },
  "colors.colorPalette.a6": {
    "value": "var(--colors-color-palette-a6)",
    "variable": "var(--colors-color-palette-a6)"
  },
  "colors.colorPalette.a7": {
    "value": "var(--colors-color-palette-a7)",
    "variable": "var(--colors-color-palette-a7)"
  },
  "colors.colorPalette.a8": {
    "value": "var(--colors-color-palette-a8)",
    "variable": "var(--colors-color-palette-a8)"
  },
  "colors.colorPalette.a9": {
    "value": "var(--colors-color-palette-a9)",
    "variable": "var(--colors-color-palette-a9)"
  },
  "colors.colorPalette.a10": {
    "value": "var(--colors-color-palette-a10)",
    "variable": "var(--colors-color-palette-a10)"
  },
  "colors.colorPalette.a11": {
    "value": "var(--colors-color-palette-a11)",
    "variable": "var(--colors-color-palette-a11)"
  },
  "colors.colorPalette.a12": {
    "value": "var(--colors-color-palette-a12)",
    "variable": "var(--colors-color-palette-a12)"
  },
  "colors.colorPalette.light.1": {
    "value": "var(--colors-color-palette-light-1)",
    "variable": "var(--colors-color-palette-light-1)"
  },
  "colors.colorPalette.1": {
    "value": "var(--colors-color-palette-1)",
    "variable": "var(--colors-color-palette-1)"
  },
  "colors.colorPalette.light.2": {
    "value": "var(--colors-color-palette-light-2)",
    "variable": "var(--colors-color-palette-light-2)"
  },
  "colors.colorPalette.2": {
    "value": "var(--colors-color-palette-2)",
    "variable": "var(--colors-color-palette-2)"
  },
  "colors.colorPalette.light.3": {
    "value": "var(--colors-color-palette-light-3)",
    "variable": "var(--colors-color-palette-light-3)"
  },
  "colors.colorPalette.3": {
    "value": "var(--colors-color-palette-3)",
    "variable": "var(--colors-color-palette-3)"
  },
  "colors.colorPalette.light.4": {
    "value": "var(--colors-color-palette-light-4)",
    "variable": "var(--colors-color-palette-light-4)"
  },
  "colors.colorPalette.4": {
    "value": "var(--colors-color-palette-4)",
    "variable": "var(--colors-color-palette-4)"
  },
  "colors.colorPalette.light.5": {
    "value": "var(--colors-color-palette-light-5)",
    "variable": "var(--colors-color-palette-light-5)"
  },
  "colors.colorPalette.5": {
    "value": "var(--colors-color-palette-5)",
    "variable": "var(--colors-color-palette-5)"
  },
  "colors.colorPalette.light.6": {
    "value": "var(--colors-color-palette-light-6)",
    "variable": "var(--colors-color-palette-light-6)"
  },
  "colors.colorPalette.6": {
    "value": "var(--colors-color-palette-6)",
    "variable": "var(--colors-color-palette-6)"
  },
  "colors.colorPalette.light.7": {
    "value": "var(--colors-color-palette-light-7)",
    "variable": "var(--colors-color-palette-light-7)"
  },
  "colors.colorPalette.7": {
    "value": "var(--colors-color-palette-7)",
    "variable": "var(--colors-color-palette-7)"
  },
  "colors.colorPalette.light.8": {
    "value": "var(--colors-color-palette-light-8)",
    "variable": "var(--colors-color-palette-light-8)"
  },
  "colors.colorPalette.8": {
    "value": "var(--colors-color-palette-8)",
    "variable": "var(--colors-color-palette-8)"
  },
  "colors.colorPalette.light.9": {
    "value": "var(--colors-color-palette-light-9)",
    "variable": "var(--colors-color-palette-light-9)"
  },
  "colors.colorPalette.9": {
    "value": "var(--colors-color-palette-9)",
    "variable": "var(--colors-color-palette-9)"
  },
  "colors.colorPalette.light.10": {
    "value": "var(--colors-color-palette-light-10)",
    "variable": "var(--colors-color-palette-light-10)"
  },
  "colors.colorPalette.10": {
    "value": "var(--colors-color-palette-10)",
    "variable": "var(--colors-color-palette-10)"
  },
  "colors.colorPalette.light.11": {
    "value": "var(--colors-color-palette-light-11)",
    "variable": "var(--colors-color-palette-light-11)"
  },
  "colors.colorPalette.11": {
    "value": "var(--colors-color-palette-11)",
    "variable": "var(--colors-color-palette-11)"
  },
  "colors.colorPalette.light.12": {
    "value": "var(--colors-color-palette-light-12)",
    "variable": "var(--colors-color-palette-light-12)"
  },
  "colors.colorPalette.12": {
    "value": "var(--colors-color-palette-12)",
    "variable": "var(--colors-color-palette-12)"
  },
  "colors.colorPalette.light.a1": {
    "value": "var(--colors-color-palette-light-a1)",
    "variable": "var(--colors-color-palette-light-a1)"
  },
  "colors.colorPalette.light.a2": {
    "value": "var(--colors-color-palette-light-a2)",
    "variable": "var(--colors-color-palette-light-a2)"
  },
  "colors.colorPalette.light.a3": {
    "value": "var(--colors-color-palette-light-a3)",
    "variable": "var(--colors-color-palette-light-a3)"
  },
  "colors.colorPalette.light.a4": {
    "value": "var(--colors-color-palette-light-a4)",
    "variable": "var(--colors-color-palette-light-a4)"
  },
  "colors.colorPalette.light.a5": {
    "value": "var(--colors-color-palette-light-a5)",
    "variable": "var(--colors-color-palette-light-a5)"
  },
  "colors.colorPalette.light.a6": {
    "value": "var(--colors-color-palette-light-a6)",
    "variable": "var(--colors-color-palette-light-a6)"
  },
  "colors.colorPalette.light.a7": {
    "value": "var(--colors-color-palette-light-a7)",
    "variable": "var(--colors-color-palette-light-a7)"
  },
  "colors.colorPalette.light.a8": {
    "value": "var(--colors-color-palette-light-a8)",
    "variable": "var(--colors-color-palette-light-a8)"
  },
  "colors.colorPalette.light.a9": {
    "value": "var(--colors-color-palette-light-a9)",
    "variable": "var(--colors-color-palette-light-a9)"
  },
  "colors.colorPalette.light.a10": {
    "value": "var(--colors-color-palette-light-a10)",
    "variable": "var(--colors-color-palette-light-a10)"
  },
  "colors.colorPalette.light.a11": {
    "value": "var(--colors-color-palette-light-a11)",
    "variable": "var(--colors-color-palette-light-a11)"
  },
  "colors.colorPalette.light.a12": {
    "value": "var(--colors-color-palette-light-a12)",
    "variable": "var(--colors-color-palette-light-a12)"
  },
  "colors.colorPalette.dark.1": {
    "value": "var(--colors-color-palette-dark-1)",
    "variable": "var(--colors-color-palette-dark-1)"
  },
  "colors.colorPalette.dark.2": {
    "value": "var(--colors-color-palette-dark-2)",
    "variable": "var(--colors-color-palette-dark-2)"
  },
  "colors.colorPalette.dark.3": {
    "value": "var(--colors-color-palette-dark-3)",
    "variable": "var(--colors-color-palette-dark-3)"
  },
  "colors.colorPalette.dark.4": {
    "value": "var(--colors-color-palette-dark-4)",
    "variable": "var(--colors-color-palette-dark-4)"
  },
  "colors.colorPalette.dark.5": {
    "value": "var(--colors-color-palette-dark-5)",
    "variable": "var(--colors-color-palette-dark-5)"
  },
  "colors.colorPalette.dark.6": {
    "value": "var(--colors-color-palette-dark-6)",
    "variable": "var(--colors-color-palette-dark-6)"
  },
  "colors.colorPalette.dark.7": {
    "value": "var(--colors-color-palette-dark-7)",
    "variable": "var(--colors-color-palette-dark-7)"
  },
  "colors.colorPalette.dark.8": {
    "value": "var(--colors-color-palette-dark-8)",
    "variable": "var(--colors-color-palette-dark-8)"
  },
  "colors.colorPalette.dark.9": {
    "value": "var(--colors-color-palette-dark-9)",
    "variable": "var(--colors-color-palette-dark-9)"
  },
  "colors.colorPalette.dark.10": {
    "value": "var(--colors-color-palette-dark-10)",
    "variable": "var(--colors-color-palette-dark-10)"
  },
  "colors.colorPalette.dark.11": {
    "value": "var(--colors-color-palette-dark-11)",
    "variable": "var(--colors-color-palette-dark-11)"
  },
  "colors.colorPalette.dark.12": {
    "value": "var(--colors-color-palette-dark-12)",
    "variable": "var(--colors-color-palette-dark-12)"
  },
  "colors.colorPalette.dark.a1": {
    "value": "var(--colors-color-palette-dark-a1)",
    "variable": "var(--colors-color-palette-dark-a1)"
  },
  "colors.colorPalette.dark.a2": {
    "value": "var(--colors-color-palette-dark-a2)",
    "variable": "var(--colors-color-palette-dark-a2)"
  },
  "colors.colorPalette.dark.a3": {
    "value": "var(--colors-color-palette-dark-a3)",
    "variable": "var(--colors-color-palette-dark-a3)"
  },
  "colors.colorPalette.dark.a4": {
    "value": "var(--colors-color-palette-dark-a4)",
    "variable": "var(--colors-color-palette-dark-a4)"
  },
  "colors.colorPalette.dark.a5": {
    "value": "var(--colors-color-palette-dark-a5)",
    "variable": "var(--colors-color-palette-dark-a5)"
  },
  "colors.colorPalette.dark.a6": {
    "value": "var(--colors-color-palette-dark-a6)",
    "variable": "var(--colors-color-palette-dark-a6)"
  },
  "colors.colorPalette.dark.a7": {
    "value": "var(--colors-color-palette-dark-a7)",
    "variable": "var(--colors-color-palette-dark-a7)"
  },
  "colors.colorPalette.dark.a8": {
    "value": "var(--colors-color-palette-dark-a8)",
    "variable": "var(--colors-color-palette-dark-a8)"
  },
  "colors.colorPalette.dark.a9": {
    "value": "var(--colors-color-palette-dark-a9)",
    "variable": "var(--colors-color-palette-dark-a9)"
  },
  "colors.colorPalette.dark.a10": {
    "value": "var(--colors-color-palette-dark-a10)",
    "variable": "var(--colors-color-palette-dark-a10)"
  },
  "colors.colorPalette.dark.a11": {
    "value": "var(--colors-color-palette-dark-a11)",
    "variable": "var(--colors-color-palette-dark-a11)"
  },
  "colors.colorPalette.dark.a12": {
    "value": "var(--colors-color-palette-dark-a12)",
    "variable": "var(--colors-color-palette-dark-a12)"
  },
  "colors.colorPalette.light": {
    "value": "var(--colors-color-palette-light)",
    "variable": "var(--colors-color-palette-light)"
  },
  "colors.colorPalette.dark": {
    "value": "var(--colors-color-palette-dark)",
    "variable": "var(--colors-color-palette-dark)"
  },
  "colors.colorPalette.default": {
    "value": "var(--colors-color-palette-default)",
    "variable": "var(--colors-color-palette-default)"
  },
  "colors.colorPalette.emphasized": {
    "value": "var(--colors-color-palette-emphasized)",
    "variable": "var(--colors-color-palette-emphasized)"
  },
  "colors.colorPalette.fg": {
    "value": "var(--colors-color-palette-fg)",
    "variable": "var(--colors-color-palette-fg)"
  },
  "colors.colorPalette.text": {
    "value": "var(--colors-color-palette-text)",
    "variable": "var(--colors-color-palette-text)"
  },
  "colors.colorPalette.canvas": {
    "value": "var(--colors-color-palette-canvas)",
    "variable": "var(--colors-color-palette-canvas)"
  },
  "colors.colorPalette.subtle": {
    "value": "var(--colors-color-palette-subtle)",
    "variable": "var(--colors-color-palette-subtle)"
  },
  "colors.colorPalette.muted": {
    "value": "var(--colors-color-palette-muted)",
    "variable": "var(--colors-color-palette-muted)"
  },
  "colors.colorPalette.disabled": {
    "value": "var(--colors-color-palette-disabled)",
    "variable": "var(--colors-color-palette-disabled)"
  },
  "colors.colorPalette.error": {
    "value": "var(--colors-color-palette-error)",
    "variable": "var(--colors-color-palette-error)"
  },
  "colors.colorPalette.outline": {
    "value": "var(--colors-color-palette-outline)",
    "variable": "var(--colors-color-palette-outline)"
  },
  "colors.colorPalette.transactions": {
    "value": "var(--colors-color-palette-transactions)",
    "variable": "var(--colors-color-palette-transactions)"
  },
  "colors.colorPalette.gas": {
    "value": "var(--colors-color-palette-gas)",
    "variable": "var(--colors-color-palette-gas)"
  },
  "colors.colorPalette.grid": {
    "value": "var(--colors-color-palette-grid)",
    "variable": "var(--colors-color-palette-grid)"
  },
  "colors.colorPalette.axis": {
    "value": "var(--colors-color-palette-axis)",
    "variable": "var(--colors-color-palette-axis)"
  }
}

export function token(path, fallback) {
  return tokens[path]?.value || fallback
}

function tokenVar(path, fallback) {
  return tokens[path]?.variable || fallback
}

token.var = tokenVar