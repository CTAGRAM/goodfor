import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radius } from '../../constants/theme';

/**
 * Reusable Badge Component
 * Small label/chip for status indicators, tags, etc.
 */
export const Badge = ({
    children,
    variant = 'default',
    size = 'default',
    icon,
    style,
    textStyle,
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'success':
                return {
                    backgroundColor: `${colors.chart1}1A`, // 10% opacity
                    borderColor: `${colors.chart1}33`, // 20% opacity
                };
            case 'warning':
                return {
                    backgroundColor: `${colors.chart2}1A`,
                    borderColor: `${colors.chart2}33`,
                };
            case 'error':
                return {
                    backgroundColor: `${colors.chart3}1A`,
                    borderColor: `${colors.chart3}33`,
                };
            case 'primary':
                return {
                    backgroundColor: `${colors.primary}1A`,
                    borderColor: `${colors.primary}33`,
                };
            case 'accent':
                return {
                    backgroundColor: `${colors.accent}4D`, // 30% opacity
                    borderColor: `${colors.accent}33`,
                };
            default:
                return {
                    backgroundColor: colors.secondary,
                    borderColor: colors.border,
                };
        }
    };

    const getTextColor = () => {
        switch (variant) {
            case 'success':
                return colors.chart1;
            case 'warning':
                return colors.chart2;
            case 'error':
                return colors.chart3;
            case 'primary':
                return colors.primary;
            case 'accent':
                return colors.accentForeground;
            default:
                return colors.foreground;
        }
    };

    const getSizeStyles = () => {
        switch (size) {
            case 'sm':
                return {
                    paddingVertical: 2,
                    paddingHorizontal: 8,
                };
            case 'lg':
                return {
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                };
            default:
                return {
                    paddingVertical: 4,
                    paddingHorizontal: 12,
                };
        }
    };

    return (
        <View
            style={[
                styles.badge,
                getVariantStyles(),
                getSizeStyles(),
                style,
            ]}
            {...props}
        >
            {icon && <>{icon}</>}
            {typeof children === 'string' ? (
                <Text style={[styles.text, { color: getTextColor() }, textStyle]}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.full,
        borderWidth: 1,
        gap: 4,
    },
    text: {
        fontFamily: fonts.sansSemiBold,
        fontSize: fontSizes.xs,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
});

export default Badge;
