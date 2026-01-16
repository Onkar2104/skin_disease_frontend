// src/components/chatbot/TypingIndicator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

const Dot = ({ delay }: { delay: number }) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const timeout = setTimeout(() => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      ).start();
    }, delay);

    return () => clearTimeout(timeout);
  }, []);


  return (
    <Animated.View style={[styles.dot, { opacity, transform: [{ scale: opacity }] }]} />
  );
};

export default function TypingIndicator() {
  return (
    <View style={styles.container}>
      <Dot delay={0} />
      <Dot delay={200} />
      <Dot delay={400} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: 12,
    backgroundColor: '#F3F4F6',
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    marginLeft: 10,
    marginBottom: 10,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#6B7280',
  },
});
