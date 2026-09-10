import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Rect, G } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedG = Animated.createAnimatedComponent(G);

const LogoAnimation: React.FC<{ size?: number }> = ({ size = 150 }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    );
  }, [rotation]);

  const animatedProps = useAnimatedProps(() => {
    return {
      transform: [{ rotate: `${rotation.value}deg` }, { translateX: 0 }, { translateY: 0 }],
    };
  });

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width="100%" height="100%" viewBox="0 0 200 200">
        {/* Green Background Rounded Square */}
        <Rect x="10" y="10" width="180" height="180" rx="40" ry="40" fill="#2D9F88" />

        {/* Human Face Profile Outline */}
        <Path
          d="M 150 40 
             C 120 20, 70 30, 60 70 
             C 55 90, 65 100, 60 110 
             C 50 115, 60 125, 60 135 
             C 60 145, 65 145, 70 160 
             C 75 180, 90 180, 90 180"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <Path
          d="M 150 40
             C 170 60, 180 90, 170 130
             C 165 150, 150 180, 140 180"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Spinning Spiral (Brain area) */}
        <AnimatedG animatedProps={animatedProps} origin="110, 90">
          <Path
            d="M 110 90
               m 0 -3
               a 3 3 0 1 0 0 6
               a 3 3 0 1 0 0 -6
               m 0 -6
               a 9 9 0 1 0 0 18
               a 9 9 0 1 0 0 -18
               m 0 -6
               a 15 15 0 1 0 0 30
               a 15 15 0 1 0 0 -30
               m 0 -6
               a 21 21 0 1 0 0 42
               a 21 21 0 1 0 0 -42
               m 0 -6
               a 27 27 0 1 0 0 54
               a 27 27 0 1 0 0 -54"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
          />
        </AnimatedG>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LogoAnimation;
