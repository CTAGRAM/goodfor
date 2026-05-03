/**
 * GoodFor Animated Components
 * 
 * Pure React Native Animated API components — no Lottie dependency needed.
 * Works in Expo Go, dev builds, and production.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, StyleSheet } from 'react-native';
import { colors } from '@/constants/theme';

/**
 * ScanningRings — Pulsing concentric rings radiating outward
 * Used behind mascot on scan loading + splash screens
 */
export function ScanningRings({ size = 180, color = colors.chart1 }) {
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;
  const ring3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 1500, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
    createPulse(ring1, 0).start();
    createPulse(ring2, 500).start();
    createPulse(ring3, 1000).start();
  }, []);

  const renderRing = (anim) => ({
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] }),
    transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }],
  });

  const ringStyle = {
    position: 'absolute', width: size, height: size, borderRadius: size / 2,
    borderWidth: 2, borderColor: color,
  };

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[ringStyle, renderRing(ring1)]} />
      <Animated.View style={[ringStyle, renderRing(ring2)]} />
      <Animated.View style={[ringStyle, renderRing(ring3)]} />
    </View>
  );
}

/**
 * ScanLine — Green horizontal line bouncing up and down
 */
export function ScanLine({ width = 120, height = 140 }) {
  const lineY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(lineY, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(lineY, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: 600, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.9, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View style={{
      position: 'absolute', width, height: 3, borderRadius: 2,
      backgroundColor: colors.chart1,
      opacity,
      transform: [{ translateY: lineY.interpolate({ inputRange: [0, 1], outputRange: [-height / 2 + 10, height / 2 - 10] }) }],
    }} />
  );
}

/**
 * ConfettiBurst — Multicolor particles exploding outward
 * Plays once, then stays invisible
 */
export function ConfettiBurst({ size = 260 }) {
  const particles = Array.from({ length: 12 }, (_, i) => ({
    anim: useRef(new Animated.Value(0)).current,
    color: ['#22C55E', '#F5A623', '#EF4444', '#3B82F6', '#A855F7', '#EC4899'][i % 6],
    angle: (i * 30) * (Math.PI / 180),
    size: 6 + Math.random() * 4,
  }));

  useEffect(() => {
    Animated.stagger(40, particles.map(p =>
      Animated.timing(p.anim, { toValue: 1, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true })
    )).start();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {particles.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            width: p.size, height: p.size,
            borderRadius: i % 2 === 0 ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: p.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
            transform: [
              { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.cos(p.angle) * (size * 0.4)] }) },
              { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, Math.sin(p.angle) * (size * 0.4)] }) },
              { rotate: p.anim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${360 + i * 60}deg`] }) },
              { scale: p.anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 1.2, 0.6] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/**
 * TypingDots — 3 bouncing dots for AI thinking indicator  
 */
export function TypingDots({ dotSize = 8, color = colors.chart1 }) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const bounce = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
          Animated.delay(600 - delay),
        ])
      );
    bounce(dot1, 0).start();
    bounce(dot2, 150).start();
    bounce(dot3, 300).start();
  }, []);

  const dotStyle = (anim) => ({
    width: dotSize, height: dotSize, borderRadius: dotSize / 2,
    backgroundColor: color,
    opacity: anim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [0, -6] }) }],
  });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, height: 24, justifyContent: 'center' }}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </View>
  );
}

/**
 * StreakFlame — Animated fire icon pulsing with glow
 */
export function StreakFlame({ size = 22 }) {
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 600, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.6, duration: 400, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Glow background */}
      <Animated.View style={{
        position: 'absolute', width: size * 1.4, height: size * 1.4,
        borderRadius: size, backgroundColor: '#F59E0B',
        opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0.1, 0.25] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.1] }) }],
      }} />
      {/* Fire emoji with pulse */}
      <Animated.Text style={{
        fontSize: size * 0.75,
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.1] }) }],
      }}>
        🔥
      </Animated.Text>
    </View>
  );
}

/**
 * EmptyBoxAnimation — Gently rocking box with floating sparkles
 */
export function EmptyBoxAnimation({ size = 100 }) {
  const rock = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rock, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(rock, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(sparkle1, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(sparkle1, { toValue: 0, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(700),
        Animated.timing(sparkle2, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(sparkle2, { toValue: 0, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {/* Sparkle 1 */}
      <Animated.Text style={{
        position: 'absolute', top: 5, left: 10, fontSize: 14,
        opacity: sparkle1,
        transform: [{ scale: sparkle1.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.2] }) }],
      }}>✨</Animated.Text>
      {/* Sparkle 2 */}
      <Animated.Text style={{
        position: 'absolute', top: 0, right: 15, fontSize: 12,
        opacity: sparkle2,
        transform: [{ scale: sparkle2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }],
      }}>⭐</Animated.Text>
      {/* Box */}
      <Animated.Text style={{
        fontSize: size * 0.5,
        transform: [
          { rotate: rock.interpolate({ inputRange: [0, 1], outputRange: ['-3deg', '3deg'] }) },
          { translateY: rock.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, -4, 0] }) },
        ],
      }}>📦</Animated.Text>
    </View>
  );
}

/**
 * PulseGlow — Animated glowing ring around any child
 */
export function PulseGlow({ children, color = colors.chart1, size = 60 }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1000, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 1000, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: size, height: size, borderRadius: size / 2,
        borderWidth: 2, borderColor: color,
        opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
        transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.5] }) }],
      }} />
      {children}
    </View>
  );
}
