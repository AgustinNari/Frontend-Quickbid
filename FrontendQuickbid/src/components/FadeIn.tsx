import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';

interface FadeInProps {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  style?: object;
}

export function FadeIn({ children, duration = 300, delay = 0, style }: FadeInProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
    }).start();
  }, [opacity, duration, delay]);

  return (
    <Animated.View style={[{ opacity }, style]}>
      {children}
    </Animated.View>
  );
}
