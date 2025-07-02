import { StyleSheet, Platform, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Helper function to get responsive padding based on screen size
const getResponsivePadding = () => {
  if (screenWidth < 375) {
    // Small phones (iPhone SE, etc.)
    return {
      horizontal: 16,
      vertical: 16,
    };
  } else if (screenWidth < 414) {
    // Standard phones (iPhone 12, 13, etc.)
    return {
      horizontal: 20,
      vertical: 20,
    };
  } else {
    // Large phones (iPhone Pro Max, etc.)
    return {
      horizontal: 24,
      vertical: 24,
    };
  }
};

const responsivePadding = getResponsivePadding();

export default StyleSheet.create({
  container: {
    flex: 1,
    // Responsive padding based on screen size
    paddingHorizontal: responsivePadding.horizontal,
    paddingVertical: responsivePadding.vertical,
    // Ensure proper safe area handling
    ...Platform.select({
      ios: {
        paddingTop: 0, // Let SafeAreaView handle this
      },
      android: {
        paddingTop: 0, // StatusBar is not translucent anymore
      },
    }),
  },
  text: {
    fontSize: 16,
    lineHeight: 22,
    // Better text rendering on mobile
    ...Platform.select({
      ios: {
        letterSpacing: -0.2,
      },
    }),
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
    lineHeight: 30,
    // Responsive heading sizes
    ...Platform.select({
      ios: {
        fontSize: screenWidth < 375 ? 26 : 28,
        letterSpacing: -0.4,
        lineHeight: screenWidth < 375 ? 32 : 34,
      },
    }),
  },
  subheading: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    lineHeight: 24,
    // Responsive subheading
    ...Platform.select({
      ios: {
        fontSize: screenWidth < 375 ? 19 : 20,
        letterSpacing: -0.3,
        lineHeight: screenWidth < 375 ? 25 : 26,
      },
    }),
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    // Responsive card design
    ...Platform.select({
      ios: {
        padding: screenWidth < 375 ? 16 : 20,
        borderRadius: 18,
      },
    }),
  },
  shadow: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    // Better shadow for iOS
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    // Better mobile row spacing with responsive height
    minHeight: Platform.OS === 'ios' ? 44 : 48,
  },
  section: {
    marginBottom: 24,
    // Responsive section spacing
    ...Platform.select({
      ios: {
        marginBottom: screenWidth < 375 ? 28 : 32,
      },
    }),
  },
  // Mobile-specific styles with responsive design
  touchableArea: {
    minHeight: Platform.OS === 'ios' ? 44 : 48,
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    ...Platform.select({
      ios: {
        backgroundColor: '#FFFFFF',
      },
    }),
  },
  // New responsive styles for better mobile experience
  screenContainer: {
    flex: 1,
    paddingHorizontal: responsivePadding.horizontal,
    // Add top padding to prevent content from being covered
    paddingTop: Platform.select({
      ios: 0, // SafeAreaView handles this
      android: 20, // Add some padding for Android
    }),
  },
  headerSafeArea: {
    // Ensure header content is not covered
    paddingTop: Platform.select({
      ios: 0,
      android: 0,
    }),
  },
  contentContainer: {
    flex: 1,
    // Ensure content doesn't get covered by headers or navigation
    paddingBottom: Platform.select({
      ios: 34, // Account for home indicator on newer iPhones
      android: 20,
    }),
  },
  // Responsive font sizes
  smallText: {
    fontSize: screenWidth < 375 ? 12 : 14,
    lineHeight: screenWidth < 375 ? 16 : 18,
  },
  mediumText: {
    fontSize: screenWidth < 375 ? 14 : 16,
    lineHeight: screenWidth < 375 ? 18 : 22,
  },
  largeText: {
    fontSize: screenWidth < 375 ? 18 : 20,
    lineHeight: screenWidth < 375 ? 24 : 26,
  },
});