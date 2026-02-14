import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HomeScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your Feed</Text>
        <Text style={styles.emptyText}>
          Follow other cooks to see what they're making. Your activity feed will show up here.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFBF5' },
  content: { padding: 20, paddingTop: 12 },
  empty: { alignItems: 'center', paddingTop: 80 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#1A1A1A', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#6B6B6B', textAlign: 'center', lineHeight: 20, maxWidth: 260 },
});
