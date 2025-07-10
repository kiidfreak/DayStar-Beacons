import { Link, Stack, useRouter } from "expo-router";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";
import { useEffect } from "react";

export default function NotFoundScreen() {
  const { themeColors } = useTheme();
  const router = useRouter();
  
  // Automatically redirect to home screen
  useEffect(() => {
    router.replace('/');
  }, []);
  
  return (
    <>
      <Stack.Screen options={{ title: "Redirecting..." }} />
      <View style={[styles.container, { backgroundColor: themeColors.background }]}>
        <Text style={[styles.title, { color: themeColors.text }]}>Redirecting to home...</Text>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  }
});