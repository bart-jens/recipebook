import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useFonts } from 'expo-font';
import {
  InterTight_300Light,
  InterTight_400Regular,
} from '@expo-google-fonts/inter-tight';
import { Stack, router } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Linking } from 'react-native';

import { AuthProvider, useAuth } from '@/contexts/auth';
import { supabase } from '@/lib/supabase';
import { colors, fontFamily } from '@/lib/theme';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function DeepLinkHandler() {
  const { isPasswordReset, clearPasswordReset } = useAuth();

  useEffect(() => {
    function handleUrl(url: string) {
      if (!url.includes('reset-password')) return;
      const fragment = url.split('#')[1];
      if (!fragment) return;
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');
      if (accessToken && refreshToken) {
        supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    }

    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });

    const sub = Linking.addEventListener('url', (event) => handleUrl(event.url));
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (isPasswordReset) {
      router.push('/(auth)/reset-password');
    }
  }, [isPasswordReset]);

  return null;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
    InterTight_300Light,
    InterTight_400Regular,
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
    headerStyle: { backgroundColor: colors.bg },
    headerTintColor: colors.inkMuted,
    headerShadowVisible: false,
    headerBackTitle: 'Back',
    headerTitleStyle: {
      color: colors.ink,
      fontFamily: fontFamily.sans,
    },
  };

  return (
    <AuthProvider>
      <DeepLinkHandler />
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
          name="onboarding"
          options={{ headerShown: false }}
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
