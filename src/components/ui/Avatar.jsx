import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors, fonts, fontSizes, radius, shadows } from '../../constants/theme';

/**
 * Reusable Avatar Component
 * Displays user profile pictures or initials
 */
export const Avatar = ({
    source,
    size = 48,
    initials,
    badge,
    style,
    ...props
}) => {
    const avatarSize = {
        width: size,
        height: size,
        borderRadius: size / 2,
    };

    const renderContent = () => {
        if (source) {
            return (
                <Image
                    source={typeof source === 'string' ? { uri: source } : source}
                    style={[styles.image, avatarSize]}
                    {...props}
                />
            );
        }

        if (initials) {
            return (
                <View style={[styles.initialsContainer, avatarSize, style]}>
                    <Text style={[styles.initials, { fontSize: size / 2.5 }]}>
                        {initials}
                    </Text>
                </View>
            );
        }

        return (
            <View style={[styles.placeholder, avatarSize, style]} />
        );
    };

    return (
        <View style={styles.container}>
            {renderContent()}
            {badge && (
                <View style={[styles.badge, { width: size / 3, height: size / 3 }]}>
                    {badge}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'relative',
    },
    image: {
        resizeMode: 'cover',
    },
    initialsContainer: {
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    initials: {
        color: colors.primaryForeground,
        fontFamily: fonts.sansBold,
        textTransform: 'uppercase',
    },
    placeholder: {
        backgroundColor: colors.muted,
    },
    badge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        borderRadius: 999,
        backgroundColor: colors.chart1,
        borderWidth: 2,
        borderColor: colors.card,
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default Avatar;
