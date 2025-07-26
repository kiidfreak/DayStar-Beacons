// Color palette for Daystar University App - New blue-focused design system
// Based on HSL-based CSS custom properties for better color management

const hslToHex = (h: number, s: number, l: number) => {
  const hue = h / 360;
  const sat = s / 100;
  const light = l / 100;
  
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs((hue * 6) % 2 - 1));
  const m = light - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (hue < 1/6) {
    r = c; g = x; b = 0;
  } else if (hue < 2/6) {
    r = x; g = c; b = 0;
  } else if (hue < 3/6) {
    r = 0; g = c; b = x;
  } else if (hue < 4/6) {
    r = 0; g = x; b = c;
  } else if (hue < 5/6) {
    r = x; g = 0; b = c;
  } else {
    r = c; g = 0; b = x;
  }
  
  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

// Design tokens based on the provided HSL values
const designTokens = {
  primary: hslToHex(217, 91, 60),    // --primary: 217 91% 60%;
  secondary: hslToHex(214, 90, 52),   // --secondary: 214 90% 52%;
  muted: hslToHex(213, 90, 95),       // --muted: 213 90% 95%;
  accent: hslToHex(213, 94, 94),      // --accent: 213 94% 94%;
};

export default {
  light: {
    // Primary blue palette
    primary: designTokens.primary,      // #3B82F6 - Main blue
    secondary: designTokens.secondary,  // #2563EB - Secondary blue
    muted: designTokens.muted,          // #F1F5F9 - Light blue-gray
    accent: designTokens.accent,        // #F8FAFC - Very light blue
    
    // Background and surface colors
    background: "#FFFFFF",
    card: "#FFFFFF",
    surface: "#F8FAFC",
    
    // Text colors
    text: "#1A1D1F",
    textSecondary: "#6C7072",
    textMuted: "#9CA3AF",
    
    // Border and separator colors
    border: "#E2E8F0",
    separator: "#F1F5F9",
    
    // Status colors
    success: "#10B981",     // Green
    warning: "#F59E0B",     // Amber
    error: "#EF4444",       // Red
    info: "#3B82F6",        // Blue
    
    // Interactive states
    inactive: "#9CA3AF",
    highlight: "#EFF6FF",
    
    // Gradients
    cardGradientStart: "#F8FAFC",
    cardGradientEnd: "#F1F5F9",
    
    // iOS-specific colors
    systemBackground: "#FFFFFF",
    secondarySystemBackground: "#F8FAFC",
  },
  dark: {
    // Primary blue palette (same as light for consistency)
    primary: designTokens.primary,      // #3B82F6 - Main blue
    secondary: designTokens.secondary,  // #2563EB - Secondary blue
    muted: "#1E293B",                  // Dark muted
    accent: "#334155",                  // Dark accent
    
    // Background and surface colors
    background: "#0F172A",
    card: "#1E293B",
    surface: "#334155",
    
    // Text colors
    text: "#F8FAFC",
    textSecondary: "#CBD5E1",
    textMuted: "#64748B",
    
    // Border and separator colors
    border: "#334155",
    separator: "#475569",
    
    // Status colors
    success: "#10B981",     // Green
    warning: "#F59E0B",     // Amber
    error: "#EF4444",       // Red
    info: "#3B82F6",        // Blue
    
    // Interactive states
    inactive: "#64748B",
    highlight: "#1E40AF",
    
    // Gradients
    cardGradientStart: "#1E293B",
    cardGradientEnd: "#334155",
    
    // iOS-specific colors
    systemBackground: "#0F172A",
    secondarySystemBackground: "#1E293B",
  }
};