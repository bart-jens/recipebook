import { Stack } from 'expo-router';

export default function RecipeLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#FFFBF5' },
        headerTintColor: '#C8553D',
        headerShadowVisible: false,
        headerBackTitle: 'Back',
      }}
    />
  );
}
