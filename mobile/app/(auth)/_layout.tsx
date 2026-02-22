import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { ActivityIndicator, View } from 'react-native';
import { colors } from '@/lib/theme';

export default function AuthLayout() {
  const { session, loading, isPasswordReset } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (session && !isPasswordReset) {
    return <Redirect href="/(tabs)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
