import React, { useState } from "react";
import { View, TextInput, Text, StyleSheet } from "react-native";
import { Colors, BorderRadius, Shadows, Typography } from "../../constants/theme";

type TextInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  icon?: React.ReactNode;
  error?: string;
};

const TextInputField: React.FC<TextInputFieldProps> = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = "default",
  icon,
  error,
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.container}>
      <Text style={[styles.label, isFocused && styles.labelFocused, error && styles.labelError]}>
        {label}
      </Text>
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
      >
        {icon && <View style={styles.iconContainer}>{icon}</View>}
        <TextInput
          style={icon ? [styles.input, styles.inputWithIcon] : styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textMuted}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    marginBottom: 16,
  },
  label: {
    ...Typography.callout,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginLeft: 4,
  },
  labelFocused: {
    color: Colors.primary,
  },
  labelError: {
    color: Colors.danger,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.surfaceElevated,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  inputError: {
    borderColor: Colors.danger,
    backgroundColor: "#FEF2F2",
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.textPrimary,
    paddingVertical: 12,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
  errorText: {
    ...Typography.caption,
    color: Colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
});

export default TextInputField;
