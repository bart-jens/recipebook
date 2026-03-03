import { Stack } from 'expo-router';
import { colors } from '@/lib/theme';

export default function RecipeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.primary,
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    >
      <Stack.Screen name="cooking" options={{ presentation: 'fullScreenModal', headerShown: false }} />
    </Stack>
  );
}
