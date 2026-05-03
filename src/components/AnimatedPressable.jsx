import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { hapticLight } from '@/lib/haptics';

const AnimatedPressableComponent = Animated.createAnimatedComponent(Pressable);

/**
 * A wrapper around Pressable that provides a smooth, spring-based scale animation
 * when pressed, giving the user excellent tactile feedback.
 */
export default function AnimatedPressable({
  children,
  onPress,
  style,
  scaleTo = 0.95,
  useHaptics = true,
  disabled = false,
  ...props
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    scale.value = withSpring(scaleTo, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
  };

  const handlePressOut = () => {
    if (disabled) return;
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
      mass: 0.5,
    });
  };

  const handlePress = (e) => {
    if (disabled) return;
    if (useHaptics) {
      hapticLight();
    }
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <AnimatedPressableComponent
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[animatedStyle, style]}
      {...props}
    >
      {children}
    </AnimatedPressableComponent>
  );
}
