import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { Colors, BorderRadius, FontSize, FontWeight, Spacing, Shadows, Animations } from '../constants/theme';

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'accent';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export const GradientButton: React.FC<GradientButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  loading,
  disabled,
  style,
  textStyle,
  fullWidth = false,
}) => {
  const sizeStyles = {
    sm: {
      paddingVertical: Spacing.sm,
      paddingHorizontal: Spacing.lg,
      minHeight: 36,
    },
    md: {
      paddingVertical: Spacing.md,
      paddingHorizontal: Spacing.xl,
      minHeight: 44,
    },
    lg: {
      paddingVertical: Spacing.lg,
      paddingHorizontal: Spacing['2xl'],
      minHeight: 52,
    },
  };

  const fontSizes = {
    sm: FontSize.sm,
    md: FontSize.md,
    lg: FontSize.lg,
  };

  const variantStyles = {
    primary: {
      container: {
        backgroundColor: Colors.primary,
        borderWidth: 0,
      },
      text: { color: Colors.textInverse },
    },
    secondary: {
      container: {
        backgroundColor: Colors.accent,
        borderWidth: 0,
      },
      text: { color: Colors.textInverse },
    },
    accent: {
      container: {
        backgroundColor: Colors.accent,
        borderWidth: 0,
      },
      text: { color: Colors.textInverse },
    },
    outline: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 1,
        borderColor: Colors.borderFocus,
      },
      text: { color: Colors.accent },
    },
    ghost: {
      container: {
        backgroundColor: 'transparent',
        borderWidth: 0,
      },
      text: { color: Colors.primary },
    },
  };

  const v = variantStyles[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.85}
      style={[
        styles.base,
        sizeStyles[size],
        v.container,
        fullWidth && styles.fullWidth,
        disabled && styles.disabled,
        !disabled && !loading && styles.hover,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' || variant === 'secondary' || variant === 'accent' ? Colors.textInverse : Colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[styles.text, { fontSize: fontSizes[size] }, v.text, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.button,
    gap: Spacing.sm,
    ...Shadows.button,
  },
  fullWidth: {
    width: '100%',
  },
  iconContainer: {
    marginRight: Spacing.xs,
  },
  text: {
    fontWeight: FontWeight.semibold,
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  disabled: {
    opacity: 0.5,
    ...Shadows.none,
  },
  hover: {
    // Subtle press effect will be handled by activeOpacity
  },
});
