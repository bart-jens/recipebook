import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth';
import { colors, spacing, fontFamily, typography } from '@/lib/theme';
import Button from '@/components/ui/Button';

interface Props {
  visible: boolean;
  onClose: () => void;
  sourceScreen?: string;
}

export default function FeedbackModal({ visible, onClose, sourceScreen }: Props) {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const appVersion = Constants.expoConfig?.version ?? null;

  async function handleSubmit() {
    if (!message.trim() || !user) return;

    setLoading(true);
    const { error } = await supabase.from('feedback').insert({
      user_id: user.id,
      message: message.trim(),
      platform: 'mobile',
      app_version: appVersion,
      source_screen: sourceScreen ?? null,
    });
    setLoading(false);

    if (!error) {
      setSent(true);
      setTimeout(() => {
        handleClose();
      }, 1500);
    }
  }

  function handleClose() {
    setMessage('');
    setSent(false);
    setLoading(false);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Text style={styles.title}>Send Feedback</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={12}>
              <Text style={styles.closeButton}>Close</Text>
            </TouchableOpacity>
          </View>

          {sent ? (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>Thanks for your feedback!</Text>
            </View>
          ) : (
            <>
              <TextInput
                style={styles.input}
                placeholder="Found a bug, have an idea, or just want to say hi? We read every message."
                placeholderTextColor={colors.inkMuted}
                multiline
                textAlignVertical="top"
                value={message}
                onChangeText={setMessage}
                autoFocus
              />
              <Button
                title="Send"
                onPress={handleSubmit}
                loading={loading}
                disabled={!message.trim()}
                size="lg"
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: colors.bg,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: spacing.pagePadding,
    paddingBottom: spacing.xxxl + spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.heading,
    fontSize: 22,
    color: colors.ink,
  },
  closeButton: {
    ...typography.meta,
    color: colors.inkSecondary,
  },
  input: {
    ...typography.label,
    color: colors.ink,
    borderBottomWidth: 2,
    borderBottomColor: colors.ink,
    paddingVertical: spacing.md,
    minHeight: 140,
    marginBottom: spacing.lg,
  },
  successContainer: {
    paddingVertical: spacing.xxxl,
    alignItems: 'center',
  },
  successText: {
    ...typography.label,
    color: colors.olive,
  },
});
