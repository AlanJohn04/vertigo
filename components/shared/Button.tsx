import React from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  GestureResponderEvent,
  ActivityIndicator,
  View,
} from "react-native";
import { Colors, Shadows, BorderRadius, Typography } from "../../constants/theme";

type ButtonProps = {
  text: string;
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outlined" | "ghost";
  size?: "sm" | "md" | "lg";
  icon?: React.ReactNode;
  style?: any;
};

const Button: React.FC<ButtonProps> = ({
  text,
  onPress,
  disabled = false,
  variant = "primary",
  size = "lg",
  icon,
  style,
}) => {
  const buttonStyles = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`size_${size}_text`],
  ];

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      {disabled ? (
        <ActivityIndicator
          color={variant === "outlined" || variant === "ghost" ? Colors.primary : Colors.white}
        />
      ) : (
        <View style={styles.content}>
          {icon && <View style={styles.iconWrap}>{icon}</View>}
          <Text style={textStyles}>{text}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: BorderRadius.lg,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    marginRight: 8,
  },
  // Variants
  primary: {
    backgroundColor: Colors.primary,
    ...Shadows.glow(Colors.primary),
  },
  secondary: {
    backgroundColor: Colors.danger,
    ...Shadows.glow(Colors.danger),
  },
  outlined: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  ghost: {
    backgroundColor: Colors.primaryGlow,
    elevation: 0,
    shadowOpacity: 0,
  },
  // Sizes
  size_sm: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  size_md: {
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  // Text
  text: {
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  primaryText: {
    color: Colors.white,
    fontSize: 16,
  },
  secondaryText: {
    color: Colors.white,
    fontSize: 16,
  },
  outlinedText: {
    color: Colors.primary,
    fontSize: 16,
  },
  ghostText: {
    color: Colors.primary,
    fontSize: 15,
  },
  size_sm_text: { fontSize: 14 },
  size_md_text: { fontSize: 15 },
  size_lg_text: { fontSize: 16 },
  // Disabled
  disabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
    borderColor: "#CBD5E1",
  },
});

export default Button;
