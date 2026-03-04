import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, typography } from '@/lib/theme';
import { Logo } from '@/components/ui/Logo';

export default function SignupScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.inner}>
        <Logo height={40} />

        <Text style={styles.heading}>Join EefEats</Text>
        <Text style={styles.body}>
          EefEats is invite-only right now. To create an account, ask an existing member for their invite link — then sign up on the web.
        </Text>

        <TouchableOpacity
          style={styles.webButton}
          onPress={() => Linking.openURL('https://eefeats.com')}
          activeOpacity={0.8}
        >
          <Text style={styles.webButtonText}>eefeats.com</Text>
        </TouchableOpacity>

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>already have an account?</Text>
          <View style={styles.dividerLine} />
        </View>

        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
          <Text style={styles.signInText}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
  heading: {
    marginTop: spacing.xl,
    ...typography.heading,
    color: colors.ink,
    textAlign: 'center',
  },
  body: {
    marginTop: spacing.md,
    ...typography.body,
    color: colors.inkSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 24,
  },
  webButton: {
    marginTop: spacing.xxl,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: spacing.xxxl,
  },
  webButtonText: {
    ...typography.label,
    color: colors.inkSecondary,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xxxl,
    gap: spacing.sm,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    ...typography.metaSmall,
    color: colors.inkMuted,
  },
  signInText: {
    marginTop: spacing.xl,
    ...typography.label,
    color: colors.accent,
  },
});
