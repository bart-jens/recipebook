import { useEffect } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Redirect, Tabs } from 'expo-router';
import { useAuth } from '@/contexts/auth';
import { ActivityIndicator, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { colors, typography, fontFamily, animation } from '@/lib/theme';

function AnimatedTabBarIcon({
  name,
  color,
  focused,
}: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
  focused: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSpring(1.15, animation.springConfig);
    } else {
      scale.value = withSpring(1, animation.springConfig);
    }
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[{ marginBottom: -2 }, animatedStyle]}>
      <FontAwesome name={name} size={22} color={color} />
    </Animated.View>
  );
}

export default function TabLayout() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.textOnPrimary,
        tabBarInactiveTintColor: 'rgba(255,255,255,0.55)',
        tabBarStyle: {
          backgroundColor: colors.primary,
          borderTopColor: colors.primaryDark,
        },
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: colors.textOnPrimary,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="home" color={color} focused={focused} />,
          headerTitle: 'EefEats',
          headerTitleStyle: {
            fontFamily: fontFamily.serifBold,
            fontSize: typography.h2.fontSize,
            color: colors.textOnPrimary,
          },
        }}
      />
      <Tabs.Screen
        name="discover"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="compass" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="recipes"
        options={{
          title: 'My Recipes',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="book" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <AnimatedTabBarIcon name="user" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}
