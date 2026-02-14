import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/contexts/auth';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  const headerDefaults = {
    headerStyle: { backgroundColor: '#FFFBF5' as const },
    headerTintColor: '#C8553D',
    headerShadowVisible: false,
    headerBackTitle: 'Back',
  };

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen
          name="recipe/[id]"
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="recipe/new"
          options={{ headerShown: true, headerTitle: 'New Recipe', ...headerDefaults }}
        />
        <Stack.Screen
          name="recipe/import-url"
          options={{ headerShown: true, headerTitle: 'Import from URL', ...headerDefaults }}
        />
        <Stack.Screen
          name="profile/[id]"
          options={{ headerShown: true, headerTitle: '', ...headerDefaults }}
        />
      </Stack>
    </AuthProvider>
  );
}
