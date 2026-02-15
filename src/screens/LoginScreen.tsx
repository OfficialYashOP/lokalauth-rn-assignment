import React, { useState, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Alert,
    StatusBar,
    Image,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { generateOtp } from '../services/otpManager';
import { logEvent } from '../services/analytics';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { width, height } = useWindowDimensions();

    const isValidEmail = useMemo(() => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    }, [email]);

    const cardWidth = Math.min(width - 32, 460);
    const compact = height < 720;

    const handleSendOtp = useCallback(async () => {
        if (!isValidEmail) {
            Alert.alert('Invalid Email', 'Please enter a valid email address.');
            return;
        }

        setIsLoading(true);
        try {
            const trimmedEmail = email.trim().toLowerCase();
            const otp = await generateOtp(trimmedEmail);
            await logEvent('otp_generated', { email: trimmedEmail });

            Alert.alert(
                'OTP Sent',
                `Your OTP is: ${otp}\n\n(In a real app, this would be sent via SMS/Email)`,
                [
                    {
                        text: 'Continue',
                        onPress: () => navigation.navigate('Otp', { email: trimmedEmail }),
                    },
                ]
            );
        } finally {
            setIsLoading(false);
        }
    }, [email, isValidEmail, navigation]);

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <StatusBar barStyle="light-content" backgroundColor="#090E1A" />
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                bounces={false}
            >
                <View style={[styles.card, { width: cardWidth, padding: compact ? 20 : 24 }]}> 
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/icon.png')}
                            style={[styles.brandImage, compact && styles.brandImageCompact]}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>LokalAuth</Text>
                        <Text style={styles.subtitle}>
                            Passwordless sign-in with email and OTP verification
                        </Text>
                    </View>

                    <View style={styles.inputSection}>
                        <Text style={styles.label}>Email Address</Text>
                        <View
                            style={[
                                styles.inputContainer,
                                email.length > 0 && !isValidEmail && styles.inputError,
                                email.length > 0 && isValidEmail && styles.inputValid,
                            ]}
                        >
                            <TextInput
                                style={styles.input}
                                placeholder="you@example.com"
                                placeholderTextColor="#64748B"
                                value={email}
                                onChangeText={setEmail}
                                keyboardType="email-address"
                                autoCapitalize="none"
                                autoCorrect={false}
                                autoComplete="email"
                                editable={!isLoading}
                            />
                        </View>
                        {email.length > 0 && !isValidEmail && (
                            <Text style={styles.errorHint}>Please enter a valid email address</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.button, (!isValidEmail || isLoading) && styles.buttonDisabled]}
                        onPress={handleSendOtp}
                        disabled={!isValidEmail || isLoading}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>{isLoading ? 'Sending...' : 'Send OTP'}</Text>
                    </TouchableOpacity>

                    <Text style={styles.footer}>OTP is generated locally and expires in 60 seconds.</Text>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
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
        marginBottom: 24,
    },
    brandImage: {
        width: 84,
        height: 84,
        borderRadius: 16,
        marginBottom: 12,
    },
    brandImageCompact: {
        width: 72,
        height: 72,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
        letterSpacing: 0.3,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    inputSection: {
        marginBottom: 20,
    },
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#CBD5E1',
        marginBottom: 8,
    },
    inputContainer: {
        backgroundColor: '#0B1220',
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: '#334155',
        paddingHorizontal: 14,
        height: 52,
        justifyContent: 'center',
    },
    inputError: {
        borderColor: '#EF4444',
    },
    inputValid: {
        borderColor: '#22C55E',
    },
    input: {
        fontSize: 16,
        color: '#F8FAFC',
    },
    errorHint: {
        color: '#F87171',
        fontSize: 12,
        marginTop: 6,
    },
    button: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 2,
        borderWidth: 1,
        borderColor: '#3B82F6',
    },
    buttonDisabled: {
        backgroundColor: '#334155',
        borderColor: '#334155',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    footer: {
        textAlign: 'center',
        color: '#64748B',
        fontSize: 12,
        marginTop: 14,
    },
});
