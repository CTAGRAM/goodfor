import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, radius, shadows } from '../../constants/theme';

/**
 * Reusable Card Component
 * Container with consistent styling, shadows, and borders
 */
export const Card = ({
    children,
    variant = 'default',
    padding = 24,
    style,
    ...props
}) => {
    const getVariantStyles = () => {
        switch (variant) {
            case 'elevated':
                return {
                    backgroundColor: colors.card,
                    ...shadows.xl,
                };
            case 'outlined':
                return {
                    backgroundColor: colors.card,
                    borderWidth: 1,
                    borderColor: colors.border,
                };
            case 'ghost':
                return {
                    backgroundColor: 'transparent',
                };
            default:
                return {
                    backgroundColor: colors.card,
                    ...shadows.sm,
                    borderWidth: 1,
                    borderColor: `${colors.border}66`, // 40% opacity
                };
        }
    };

    return (
        <View
            style={[
                styles.card,
                getVariantStyles(),
                { padding },
                style,
            ]}
            {...props}
        >
            {children}
        </View>
    );
};

const styles = StyleSheet.create({
    card: {
        borderRadius: radius['3xl'],
        overflow: 'hidden',
    },
});

export default Card;
