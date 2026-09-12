import React from 'react';
import { View, Image, StyleSheet, ViewStyle } from 'react-native';

interface LogoAnimationProps {
  size?: number;
  rounded?: boolean;
  style?: ViewStyle;
}

const LogoAnimation: React.FC<LogoAnimationProps> = ({
  size = 200,
  rounded = true,
  style,
}) => {
  const borderRadius = rounded ? Math.round(size * 0.22) : 0;

  return (
    <View
      style={[
        styles.container,
        rounded && styles.shadow,
        {
          width: size,
          height: size,
          borderRadius,
        },
        style,
      ]}
    >
      <View
        style={{
          width: size,
          height: size,
          borderRadius,
          overflow: 'hidden',
          backgroundColor: '#018b60',
        }}
      >
        <Image
          source={require('../assets/images/splash_animated.gif')}
          defaultSource={require('../assets/images/splash-icon.png')}
          style={{ width: size, height: size }}
          resizeMode="cover"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  shadow: {
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
});

export default LogoAnimation;

