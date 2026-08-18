// constants/theme.ts
// VertEase Design System — Premium Health App Theme

export const Colors = {
  // Primary Palette
  primary: "#059669",        // Emerald-600 — main brand
  primaryLight: "#34D399",   // Emerald-400
  primaryDark: "#047857",    // Emerald-700
  primaryGlow: "#10B98133",  // For shadows/glows

  // Accent
  accent: "#6366F1",         // Indigo-500
  accentLight: "#818CF8",    // Indigo-400
  accentGlow: "#6366F133",

  // Semantic
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  info: "#3B82F6",

  // Neutrals
  white: "#FFFFFF",
  background: "#F0FDF4",     // Emerald-50 tint
  surface: "#FFFFFF",
  surfaceElevated: "#F8FAF9",
  border: "#E2E8F0",
  borderLight: "#F1F5F9",

  // Text
  textPrimary: "#0F172A",    // Slate-900
  textSecondary: "#475569",  // Slate-600
  textMuted: "#94A3B8",      // Slate-400
  textOnPrimary: "#FFFFFF",
  textOnDark: "#F8FAFC",

  // Gradients (use with LinearGradient)
  gradientPrimary: ["#059669", "#10B981"] as const,
  gradientAccent: ["#6366F1", "#818CF8"] as const,
  gradientWarm: ["#F59E0B", "#FBBF24"] as const,
  gradientDanger: ["#EF4444", "#F87171"] as const,
  gradientDark: ["#0F172A", "#1E293B"] as const,
  gradientCard: ["#FFFFFF", "#F0FDF4"] as const,
};

export const Shadows = {
  sm: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  lg: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  glow: (color: string) => ({
    shadowColor: color,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  }),
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 100,
  circle: 9999,
};

export const Typography = {
  largeTitle: { fontSize: 34, fontWeight: "800" as const, letterSpacing: -0.5 },
  title1: { fontSize: 28, fontWeight: "700" as const, letterSpacing: -0.3 },
  title2: { fontSize: 22, fontWeight: "700" as const, letterSpacing: -0.2 },
  title3: { fontSize: 18, fontWeight: "600" as const },
  headline: { fontSize: 16, fontWeight: "600" as const },
  body: { fontSize: 15, fontWeight: "400" as const, lineHeight: 22 },
  callout: { fontSize: 14, fontWeight: "500" as const },
  caption: { fontSize: 12, fontWeight: "500" as const },
  overline: { fontSize: 11, fontWeight: "700" as const, letterSpacing: 1.2, textTransform: "uppercase" as const },
};
