import type { ReactNode } from 'react';
import { StyleSheet, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';

interface ZoomableProps {
  children: ReactNode;
  /** Disable gestures (e.g. while drawing a new chord box). */
  enabled?: boolean;
  maxScale?: number;
}

const SPRING = { damping: 20, stiffness: 220 };

/** Pinch-to-zoom, pan and double-tap zoom for the sheet preview. */
export function Zoomable({ children, enabled = true, maxScale = 5 }: ZoomableProps) {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const savedTx = useSharedValue(0);
  const savedTy = useSharedValue(0);
  const width = useSharedValue(0);
  const height = useSharedValue(0);

  const clamp = (value: number, s: number, size: number) => {
    'worklet';
    const limit = Math.max(0, (size * s - size) / 2);
    return Math.min(limit, Math.max(-limit, value));
  };

  const pinch = Gesture.Pinch()
    .enabled(enabled)
    .onUpdate((e) => {
      scale.value = Math.min(maxScale, Math.max(1, savedScale.value * e.scale));
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      tx.value = withSpring(clamp(tx.value, scale.value, width.value), SPRING);
      ty.value = withSpring(clamp(ty.value, scale.value, height.value), SPRING);
      savedTx.value = clamp(tx.value, scale.value, width.value);
      savedTy.value = clamp(ty.value, scale.value, height.value);
    });

  const pan = Gesture.Pan()
    .enabled(enabled)
    .minPointers(1)
    .averageTouches(true)
    .onUpdate((e) => {
      if (scale.value <= 1) return;
      tx.value = clamp(savedTx.value + e.translationX, scale.value, width.value);
      ty.value = clamp(savedTy.value + e.translationY, scale.value, height.value);
    })
    .onEnd(() => {
      savedTx.value = tx.value;
      savedTy.value = ty.value;
    });

  const doubleTap = Gesture.Tap()
    .enabled(enabled)
    .numberOfTaps(2)
    .onEnd(() => {
      const next = scale.value > 1.2 ? 1 : 2.5;
      scale.value = withTiming(next);
      savedScale.value = next;
      tx.value = withTiming(0);
      ty.value = withTiming(0);
      savedTx.value = 0;
      savedTy.value = 0;
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: scale.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    width.value = e.nativeEvent.layout.width;
    height.value = e.nativeEvent.layout.height;
  };

  return (
    <GestureDetector gesture={Gesture.Simultaneous(pinch, pan, doubleTap)}>
      <Animated.View style={[styles.container, style]} onLayout={onLayout}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
