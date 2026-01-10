import React from 'react';
import { Pressable, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, fonts, fontSizes, radius, shadows } from '../../constants/theme';

/**
 * Reusable Button Component
 * Supports multiple variants: primary, secondary, outline, ghost
 */
export const Button = ({
    children,
    onPress,
    variant = 'primary',
    size = 'default',
    disabled = false,
    loading = false,
    icon,
    style,
    textStyle,
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'primary':
                return {
                    backgroundColor: colors.primary,
                    ...shadows.lg,
                };
            case 'secondary':
                return {
                    backgroundColor: colors.secondary,
                    ...shadows.sm,
                };
            case 'outline':
                return {
                    backgroundColor: 'transparent',
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                };
            case 'destructive':
                return {
                    backgroundColor: colors.destructive,
                    ...shadows.lg,
                };
            default:
                return {
                    backgroundColor: colors.primary,
                };
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'primary':
                return colors.primaryForeground;
            case 'secondary':
                return colors.secondaryForeground;
            case 'outline':
            case 'ghost':
                return colors.foreground;
            case 'destructive':
                return colors.primaryForeground;
            default:
                return colors.primaryForeground;
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    height: 36,
                };
            case 'lg':
                return {
                    paddingVertical: 16,
                    paddingHorizontal: 32,
                    height: 64,
                };
            default:
                return {
                    paddingVertical: 12,
                    paddingHorizontal: 24,
                    height: 48,
                };
        }
    };

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled || loading}
            style={({ pressed }) => [
                styles.button,
                getVariantStyles(),
                getSizeStyles(),
                disabled && styles.disabled,
                pressed && styles.pressed,
                style,
            ]}
            {...props}
        >
            {loading ? (
                <ActivityIndicator color={getTextColor()} />
            ) : (
                <>
                    {icon && <>{icon}</>}
                    {typeof children === 'string' ? (
                        <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                            {children}
                        </Text>
                    ) : (
                        children
                    )}
                </>
            )}
        </Pressable>
    );
};

const styles = StyleSheet.create({
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.full,
        gap: 8,
    },
    text: {
        fontFamily: fonts.sansBold,
        fontSize: fontSizes.base,
        textAlign: 'center',
    },
    disabled: {
        opacity: 0.5,
    },
    pressed: {
        opacity: 0.8,
    },
});

export default Button;
