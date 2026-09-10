import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface LogoAnimationProps {
  size?: number;
  rounded?: boolean;
  style?: ViewStyle;
}

const LogoAnimation: React.FC<LogoAnimationProps> = ({
  size = 200,
  rounded = size < 160,
  style,
}) => {
  const borderRadius = rounded ? Math.round(size * 0.22) : 0;

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          overflow: rounded ? 'hidden' : 'visible',
        },
        style,
      ]}
    >
      <Image
        source={require('../assets/images/splash_animated.gif')}
        defaultSource={require('../assets/images/splash-icon.png')}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
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

