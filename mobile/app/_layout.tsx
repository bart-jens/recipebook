import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import {
  Fraunces_400Regular,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  DMSans_400Regular,
  DMSans_500Medium,
  DMSans_700Bold,
} from '@expo-google-fonts/dm-sans';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { AuthProvider } from '@/contexts/auth';
import { colors } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    Fraunces_400Regular,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    DMSans_400Regular,
    DMSans_500Medium,
    DMSans_700Bold,
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
    headerStyle: { backgroundColor: colors.primary },
    headerTintColor: colors.textOnPrimary,
    headerShadowVisible: false,
    headerBackTitle: 'Back',
    headerTitleStyle: { color: colors.textOnPrimary },
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
          name="recipe/import-instagram"
          options={{ headerShown: true, headerTitle: 'Import from Instagram', ...headerDefaults }}
        />
        <Stack.Screen
          name="recipe/import-photo"
          options={{ headerShown: true, headerTitle: 'Import from Photo', ...headerDefaults }}
        />
        <Stack.Screen
          name="invites"
          options={{ headerShown: true, headerTitle: 'Invite Friends', ...headerDefaults }}
        />
        <Stack.Screen
          name="profile/[id]"
          options={{ headerShown: true, headerTitle: '', ...headerDefaults }}
        />
      </Stack>
    </AuthProvider>
  );
}
