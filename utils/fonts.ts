import typography from '@/constants/typography';

// Font utility functions for easy access to Inter font styles
export const fonts = {
  // Regular text styles
  regular: {
    fontFamily: typography.fontFamily.regular,
    fontWeight: typography.weights.regular,
  },
  medium: {
    fontFamily: typography.fontFamily.medium,
    fontWeight: typography.weights.medium,
  },
  semiBold: {
    fontFamily: typography.fontFamily.semiBold,
    fontWeight: typography.weights.semiBold,
  },
  bold: {
    fontFamily: typography.fontFamily.bold,
    fontWeight: typography.weights.bold,
  },
  heavy: {
    fontFamily: typography.fontFamily.heavy,
    fontWeight: typography.weights.heavy,
  },
};

// Size-specific font styles
export const fontSizes = {
  h1: {
    ...fonts.bold,
    fontSize: typography.sizes.h1,
    lineHeight: typography.lineHeights.h1,
  },
  h2: {
    ...fonts.bold,
    fontSize: typography.sizes.h2,
    lineHeight: typography.lineHeights.h2,
  },
  h3: {
    ...fonts.semiBold,
    fontSize: typography.sizes.h3,
    lineHeight: typography.lineHeights.h3,
  },
  h4: {
    ...fonts.semiBold,
    fontSize: typography.sizes.h4,
    lineHeight: typography.lineHeights.h4,
  },
  body: {
    ...fonts.regular,
    fontSize: typography.sizes.body,
    lineHeight: typography.lineHeights.body,
  },
  caption: {
    ...fonts.medium,
    fontSize: typography.sizes.caption,
    lineHeight: typography.lineHeights.caption,
  },
  small: {
    ...fonts.regular,
    fontSize: typography.sizes.small,
    lineHeight: typography.lineHeights.small,
  },
  callout: {
    ...fonts.medium,
    fontSize: typography.sizes.callout,
    lineHeight: typography.lineHeights.body,
  },
};

// Letter spacing utilities
export const letterSpacing = {
  tight: {
    letterSpacing: typography.letterSpacing.tight,
  },
  normal: {
    letterSpacing: typography.letterSpacing.normal,
  },
  wide: {
    letterSpacing: typography.letterSpacing.wide,
  },
};

// Combined styles for common use cases
export const textStyles = {
  // Headings
  heading1: { ...fontSizes.h1, ...letterSpacing.tight },
  heading2: { ...fontSizes.h2, ...letterSpacing.tight },
  heading3: { ...fontSizes.h3, ...letterSpacing.normal },
  heading4: { ...fontSizes.h4, ...letterSpacing.normal },
  
  // Body text
  body: { ...fontSizes.body, ...letterSpacing.normal },
  bodyMedium: { ...fontSizes.body, ...fonts.medium, ...letterSpacing.normal },
  bodyBold: { ...fontSizes.body, ...fonts.bold, ...letterSpacing.normal },
  
  // Captions and small text
  caption: { ...fontSizes.caption, ...letterSpacing.normal },
  captionMedium: { ...fontSizes.caption, ...fonts.medium, ...letterSpacing.normal },
  small: { ...fontSizes.small, ...letterSpacing.normal },
  
  // Special styles
  callout: { ...fontSizes.callout, ...letterSpacing.normal },
  button: { ...fonts.semiBold, fontSize: 16, lineHeight: 24 },
  label: { ...fonts.medium, fontSize: 14, lineHeight: 20 },
}; 