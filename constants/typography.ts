import { Platform } from 'react-native';

// Typography constants for consistent text styling across the app - Mobile optimized
export default {
  fontFamily: {
    regular: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
    bold: Platform.select({
      ios: 'System',
      android: 'Roboto',
      default: 'System',
    }),
  },
  sizes: {
    // iOS-optimized sizes
    h1: Platform.select({ ios: 34, default: 28 }),
    h2: Platform.select({ ios: 28, default: 24 }),
    h3: Platform.select({ ios: 22, default: 20 }),
    h4: Platform.select({ ios: 20, default: 18 }),
    body: Platform.select({ ios: 17, default: 16 }),
    caption: Platform.select({ ios: 15, default: 14 }),
    small: Platform.select({ ios: 13, default: 12 }),
    footnote: Platform.select({ ios: 13, default: 12 }),
    callout: Platform.select({ ios: 16, default: 15 }),
  },
  weights: {
    regular: '400',
    medium: Platform.select({ ios: '500', default: '500' }),
    semiBold: Platform.select({ ios: '600', default: '600' }),
    bold: Platform.select({ ios: '700', default: '700' }),
    heavy: Platform.select({ ios: '800', default: '800' }),
  },
  lineHeights: {
    // Better line heights for mobile readability
    h1: Platform.select({ ios: 41, default: 34 }),
    h2: Platform.select({ ios: 34, default: 30 }),
    h3: Platform.select({ ios: 28, default: 26 }),
    h4: Platform.select({ ios: 25, default: 24 }),
    body: Platform.select({ ios: 22, default: 22 }),
    caption: Platform.select({ ios: 20, default: 20 }),
    small: Platform.select({ ios: 18, default: 16 }),
  },
  letterSpacing: {
    // iOS-style letter spacing
    tight: Platform.select({ ios: -0.4, default: 0 }),
    normal: Platform.select({ ios: -0.2, default: 0 }),
    wide: Platform.select({ ios: 0.2, default: 0.5 }),
  },
};