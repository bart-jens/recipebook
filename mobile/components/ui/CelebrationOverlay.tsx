import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import LottieView from 'lottie-react-native';

const celebrationSource = require('@/assets/lottie/celebration.json');

interface Props {
  trigger: boolean;
  onComplete?: () => void;
}

export default function CelebrationOverlay({ trigger, onComplete }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger) {
      setVisible(true);
    }
  }, [trigger]);

  if (!visible) return null;

  return (
    <LottieView
      source={celebrationSource}
      autoPlay
      loop={false}
      style={styles.overlay}
      onAnimationFinish={() => {
        setVisible(false);
        onComplete?.();
      }}
    />
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    pointerEvents: 'none',
  },
});
