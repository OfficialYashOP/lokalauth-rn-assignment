import React, { useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    StatusBar,
    Alert,
    ScrollView,
    Image,
    useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSessionTimer } from '../hooks/useSessionTimer';
import { logEvent, saveSession, clearSession } from '../services/analytics';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Session'>;

export default function SessionScreen({ route, navigation }: Props) {
    const { email, loginTime } = route.params;
    const { formattedTime, stop } = useSessionTimer(loginTime);
    const { width, height } = useWindowDimensions();

    useEffect(() => {
        void saveSession(email, loginTime);
    }, [email, loginTime]);

    const formattedLoginTime = new Date(loginTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    });

    const cardWidth = Math.min(width - 32, 520);
    const compact = height < 720;

    const handleLogout = useCallback(() => {
        Alert.alert('Logout', 'Are you sure you want to end your session?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Logout',
                style: 'destructive',
                onPress: async () => {
                    stop();
                    await logEvent('user_logout', {
                        email,
                        sessionDuration: formattedTime,
                    });
                    await clearSession();
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'Login' }],
                    });
                },
            },
        ]);
    }, [stop, email, formattedTime, navigation]);

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#090E1A" />
            <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
                <View style={[styles.card, { width: cardWidth, padding: compact ? 20 : 24 }]}> 
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/icon.png')}
                            style={[styles.brandImage, compact && styles.brandImageCompact]}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>Session Active</Text>
                        <Text style={styles.emailText}>{email}</Text>
                    </View>

                    <View style={styles.metricsContainer}>
                        <View style={styles.timerCard}>
                            <Text style={styles.timerLabel}>Session Duration</Text>
                            <Text style={styles.timerValue}>{formattedTime}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Session Started</Text>
                            <Text style={styles.infoValue}>{formattedLoginTime}</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.85}>
                        <Text style={styles.logoutText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#090E1A',
    },
    scrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 24,
        paddingHorizontal: 16,
    },
    card: {
        backgroundColor: '#111827',
        borderRadius: 20,
        borderWidth: 1,
        borderColor: '#1F2937',
    },
    header: {
        alignItems: 'center',
        marginBottom: 22,
    },
    brandImage: {
        width: 78,
        height: 78,
        borderRadius: 16,
        marginBottom: 10,
    },
    brandImageCompact: {
        width: 68,
        height: 68,
    },
    title: {
        fontSize: 25,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
    },
    emailText: {
        fontSize: 14,
        color: '#94A3B8',
    },
    metricsContainer: {
        gap: 12,
        marginBottom: 20,
    },
    timerCard: {
        backgroundColor: '#0B1220',
        borderRadius: 14,
        paddingVertical: 20,
        paddingHorizontal: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#1D4ED8',
    },
    timerLabel: {
        color: '#93C5FD',
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 6,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    timerValue: {
        fontSize: 44,
        fontWeight: '700',
        color: '#F8FAFC',
        fontVariant: ['tabular-nums'],
    },
    infoCard: {
        backgroundColor: '#0B1220',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#334155',
    },
    infoLabel: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '600',
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 16,
        color: '#F8FAFC',
        fontWeight: '600',
    },
    logoutButton: {
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(239, 68, 68, 0.12)',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.35)',
    },
    logoutText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#F87171',
    },
});
