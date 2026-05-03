import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Clipboard, Platform } from 'react-native';

/**
 * Global Error Boundary
 * Catches JavaScript crashes and displays a diagnostic screen
 * instead of the app silently dying on Samsung/Android devices.
 */
export class CrashBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo });
        console.error('[CrashBoundary] App crashed:', error.message);
        console.error('[CrashBoundary] Component stack:', errorInfo?.componentStack);
    }

    render() {
        if (this.state.hasError) {
            const errorMessage = this.state.error?.message || 'Unknown error';
            const errorStack = this.state.error?.stack || '';
            const componentStack = this.state.errorInfo?.componentStack || '';

            const fullReport = `Error: ${errorMessage}\n\nStack: ${errorStack}\n\nComponent: ${componentStack}`;

            return (
                <View style={styles.container}>
                    <View style={styles.card}>
                        <Text style={styles.emoji}>🐼💥</Text>
                        <Text style={styles.title}>GoodFor Crashed</Text>
                        <Text style={styles.subtitle}>
                            Please screenshot this and send it to the developer
                        </Text>
                        
                        <ScrollView style={styles.errorBox} contentContainerStyle={{ padding: 12 }}>
                            <Text style={styles.errorLabel}>Error:</Text>
                            <Text style={styles.errorText} selectable>{errorMessage}</Text>
                            
                            {errorStack ? (
                                <>
                                    <Text style={[styles.errorLabel, { marginTop: 12 }]}>Stack Trace:</Text>
                                    <Text style={styles.errorText} selectable>
                                        {errorStack.split('\n').slice(0, 10).join('\n')}
                                    </Text>
                                </>
                            ) : null}
                            
                            {componentStack ? (
                                <>
                                    <Text style={[styles.errorLabel, { marginTop: 12 }]}>Component:</Text>
                                    <Text style={styles.errorText} selectable>
                                        {componentStack.split('\n').slice(0, 8).join('\n')}
                                    </Text>
                                </>
                            ) : null}
                        </ScrollView>

                        <TouchableOpacity 
                            style={styles.retryButton}
                            onPress={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                        >
                            <Text style={styles.retryText}>Try Again</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F2F5F3',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 8,
    },
    emoji: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        color: '#243628',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 13,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 16,
    },
    errorBox: {
        backgroundColor: '#FEF2F2',
        borderRadius: 12,
        maxHeight: 300,
        borderWidth: 1,
        borderColor: '#FCA5A5',
    },
    errorLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#991B1B',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    errorText: {
        fontSize: 11,
        color: '#7F1D1D',
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginTop: 4,
    },
    retryButton: {
        marginTop: 16,
        backgroundColor: '#243628',
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
    },
    retryText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '700',
    },
});
