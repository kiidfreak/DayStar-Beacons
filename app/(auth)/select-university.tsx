import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SafeAreaView, Platform } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { Feather } from '@expo/vector-icons';
import Card from '@/components/ui/Card';
import { useUniversityStore } from '@/store/universityStore';
import globalStyles from '@/styles/global';

// Mock university data - Only Daystar shown by default
const universities = [
  {
    id: 'daystar',
    name: 'Daystar University',
    location: 'Nairobi',
    logo: 'https://www.daystar.ac.ke/images/logo.png'
  },
  {
    id: 'uon',
    name: 'University of Nairobi',
    location: 'Nairobi',
    logo: 'https://www.uonbi.ac.ke/sites/default/files/UoN_Logo.png'
  },
  {
    id: 'ku',
    name: 'Kenyatta University',
    location: 'Nairobi',
    logo: 'https://www.ku.ac.ke/images/kunew6-3.png'
  },
  {
    id: 'strathmore',
    name: 'Strathmore University',
    location: 'Nairobi',
    logo: 'https://strathmore.edu/wp-content/uploads/2024/12/SU-Logo.png'
  },
  {
    id: 'usiu',
    name: 'United States International University',
    location: 'Nairobi',
    logo: 'https://www.usiu.ac.ke/assets/image/usiu-logo.png'
  },
  {
    id: 'moi',
    name: 'Moi University',
    location: 'Eldoret',
    logo: 'https://www.mu.ac.ke/images/demo/default/logo/logo.svg'
  },
  {
    id: 'egerton',
    name: 'Egerton University',
    location: 'Nakuru',
    logo: 'https://uoeld.ac.ke/themes/uoeld/logo.png'
  },
  {
    id: 'mmust',
    name: 'Masinde Muliro University of Science and Technology',
    location: 'Kakamega',
    logo: 'https://waitro.org/wp-content/uploads/2021/04/Logo-MMUST.jpg'
  },
  {
    id: 'jkuat',
    name: 'Jomo Kenyatta University of Agriculture and Technology',
    location: 'Juja',
    logo: 'https://www.jkuat.ac.ke/wp-content/uploads/2025/02/jkuatlogo1.png'
  },
  {
    id: 'dkut',
    name: 'Dedan Kimathi University of Technology',
    location: 'Nyeri',
    logo: 'https://www.dkut.ac.ke/images/logo-header.png'
  }
];

export default function SelectUniversityScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { setUniversity } = useUniversityStore();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter universities - show only Daystar by default, all matching when searching
  const filteredUniversities = searchQuery.trim() === '' 
    ? universities.filter(uni => uni.id === 'daystar') // Only Daystar when no search
    : universities.filter(uni => 
        uni.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        uni.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
  
  // Handle university selection
  const handleSelectUniversity = (university: typeof universities[0]) => {
    setUniversity(university);
    router.push('/login');
  };
  
  const clearSearch = () => {
    setSearchQuery('');
  };
  
  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Select Your University
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {searchQuery.trim() === '' 
              ? "Tap to continue with Daystar University or search for others"
              : "Choose your institution to continue"
            }
          </Text>
        </View>
        
        <View style={[styles.searchContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={24} color="currentColor" />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search for other universities..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={clearSearch}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Feather name="x" size={24} color="currentColor" />
            </TouchableOpacity>
          )}
        </View>
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentInsetAdjustmentBehavior="automatic"
        >
          {filteredUniversities.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No universities found matching "{searchQuery}"
              </Text>
              <TouchableOpacity onPress={clearSearch} style={styles.clearSearchButton}>
                <Text style={[styles.clearSearchText, { color: colors.primary }]}>
                  Clear search
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredUniversities.map((university) => (
              <TouchableOpacity
                key={university.id}
                onPress={() => handleSelectUniversity(university)}
                activeOpacity={0.7}
              >
                <Card elevated style={styles.universityCard}>
                  <Image
                    source={{ uri: university.logo }}
                    style={styles.logo}
                    contentFit="contain"
                  />
                  <View style={styles.universityInfo}>
                    <Text style={[styles.universityName, { color: colors.text }]}>
                      {university.name}
                    </Text>
                    <View style={styles.locationContainer}>
                      <Feather name="map-pin" size={24} color="currentColor" />
                      <Text style={[styles.location, { color: colors.textSecondary }]}>
                        {university.location}
                      </Text>
                    </View>
                  </View>
                </Card>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: Platform.select({
      ios: 20,
      android: 32, // More padding for Android to prevent content overlap
    }),
    paddingBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    marginLeft: 12,
    fontSize: 16,
    lineHeight: 20,
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: Platform.select({
      ios: 40,
      android: 60, // More bottom padding for Android
    }),
  },
  universityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 16,
    minHeight: 88,
  },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 32,
    marginRight: 16,
  },
  universityInfo: {
    flex: 1,
  },
  universityName: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  location: {
    fontSize: 15,
    marginLeft: 6,
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 22,
  },
  clearSearchButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearSearchText: {
    fontSize: 16,
    fontWeight: '600',
  },
});