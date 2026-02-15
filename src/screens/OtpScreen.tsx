import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    StatusBar,
    Image,
    ScrollView,
    useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { validateOtp, generateOtp, getRemainingTime } from '../services/otpManager';
import { logEvent } from '../services/analytics';
import type { RootStackParamList } from '../types/navigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;

export default function OtpScreen({ route, navigation }: Props) {
    const { email } = route.params;
    const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [countdown, setCountdown] = useState(60);
    const [error, setError] = useState<string | null>(null);
    const [remainingAttempts, setRemainingAttempts] = useState(3);
    const [isVerifying, setIsVerifying] = useState(false);
    const inputRefs = useRef<(TextInput | null)[]>([]);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { width, height } = useWindowDimensions();

    const cardWidth = Math.min(width - 32, 500);
    const otpBoxSize = useMemo(() => {
        const available = cardWidth - 88;
        return Math.max(42, Math.min(54, Math.floor(available / 6)));
    }, [cardWidth]);

    useEffect(() => {
        let isMounted = true;

        const refreshCountdown = async () => {
            const timeLeft = await getRemainingTime(email);
            if (!isMounted) return;

            setCountdown(timeLeft);
            if (timeLeft <= 0 && countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };

        void refreshCountdown();
        countdownRef.current = setInterval(() => {
            void refreshCountdown();
        }, 1000);

        return () => {
            isMounted = false;
            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };
    }, [email]);

    const handleDigitChange = useCallback(
        (index: number, value: string) => {
            if (value.length > 1) {
                const digits = value.replace(/[^0-9]/g, '').split('').slice(0, 6);
                const nextDigits = [...otpDigits];
                digits.forEach((digit, offset) => {
                    if (index + offset < 6) {
                        nextDigits[index + offset] = digit;
                    }
                });
                setOtpDigits(nextDigits);
                const nextIndex = Math.min(index + digits.length, 5);
                inputRefs.current[nextIndex]?.focus();
                return;
            }

            const digit = value.replace(/[^0-9]/g, '');
            const nextDigits = [...otpDigits];
            nextDigits[index] = digit;
            setOtpDigits(nextDigits);
            setError(null);

            if (digit && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        },
        [otpDigits]
    );

    const handleKeyPress = useCallback(
        (index: number, key: string) => {
            if (key === 'Backspace' && !otpDigits[index] && index > 0) {
                const nextDigits = [...otpDigits];
                nextDigits[index - 1] = '';
                setOtpDigits(nextDigits);
                inputRefs.current[index - 1]?.focus();
            }
        },
        [otpDigits]
    );

    const handleVerify = useCallback(async () => {
        const otpString = otpDigits.join('');
        if (otpString.length !== 6) {
            setError('Please enter all 6 digits.');
            return;
        }

        setIsVerifying(true);
        const result = await validateOtp(email, otpString);

        if (result.success) {
            await logEvent('otp_validation_success', { email });

            if (countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }

            const loginTime = Date.now();
            navigation.reset({
                index: 0,
                routes: [{ name: 'Session', params: { email, loginTime } }],
            });
            return;
        }

        await logEvent('otp_validation_failure', {
            email,
            reason: result.error,
            remainingAttempts: result.remainingAttempts,
        });

        setIsVerifying(false);

        switch (result.error) {
            case 'expired':
                setError('OTP expired. Tap resend to get a new code.');
                setRemainingAttempts(0);
                break;
            case 'max_attempts':
                setError('Maximum attempts reached. Please resend OTP.');
                setRemainingAttempts(0);
                break;
            case 'invalid':
                setError(`Incorrect OTP. ${result.remainingAttempts ?? 0} attempt(s) left.`);
                setRemainingAttempts(result.remainingAttempts ?? 0);
                setOtpDigits(['', '', '', '', '', '']);
                inputRefs.current[0]?.focus();
                break;
            case 'not_found':
                setError('No OTP found for this email. Request a new OTP.');
                setRemainingAttempts(0);
                break;
            default:
                setError('OTP validation failed. Please try again.');
                break;
        }
    }, [otpDigits, email, navigation]);

    const handleResend = useCallback(async () => {
        const newOtp = await generateOtp(email);
        await logEvent('otp_generated', { email, resend: true });

        setOtpDigits(['', '', '', '', '', '']);
        setError(null);
        setRemainingAttempts(3);
        setCountdown(60);

        if (countdownRef.current) {
            clearInterval(countdownRef.current);
            countdownRef.current = null;
        }

        const refreshCountdown = async () => {
            const timeLeft = await getRemainingTime(email);
            setCountdown(timeLeft);
            if (timeLeft <= 0 && countdownRef.current) {
                clearInterval(countdownRef.current);
                countdownRef.current = null;
            }
        };

        countdownRef.current = setInterval(() => {
            void refreshCountdown();
        }, 1000);
        void refreshCountdown();

        inputRefs.current[0]?.focus();
        Alert.alert('OTP Resent', `Your new OTP is: ${newOtp}`);
    }, [email]);

    const isOtpComplete = otpDigits.every((digit) => digit !== '');
    const isExpired = countdown <= 0;
    const isBlocked = isExpired || remainingAttempts <= 0;
    const compact = height < 720;

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#090E1A" />
            <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" bounces={false}>
                <View style={[styles.card, { width: cardWidth, padding: compact ? 20 : 24 }]}> 
                    <View style={styles.header}>
                        <Image
                            source={require('../../assets/images/splash-icon.png')}
                            style={[styles.brandImage, compact && styles.brandImageCompact]}
                            resizeMode="contain"
                        />
                        <Text style={styles.title}>Enter Verification Code</Text>
                        <Text style={styles.subtitle}>We sent a 6-digit code to {email}</Text>
                    </View>

                    <View style={styles.otpContainer}>
                        {otpDigits.map((digit, index) => (
                            <TextInput
                                key={index}
                                ref={(ref) => {
                                    inputRefs.current[index] = ref;
                                }}
                                style={[
                                    styles.otpInput,
                                    { width: otpBoxSize, height: otpBoxSize + 8 },
                                    digit ? styles.otpInputFilled : null,
                                    error ? styles.otpInputError : null,
                                ]}
                                value={digit}
                                onChangeText={(value) => handleDigitChange(index, value)}
                                onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                                keyboardType="number-pad"
                                maxLength={1}
                                selectTextOnFocus
                                editable={!isVerifying && remainingAttempts > 0}
                                textContentType="oneTimeCode"
                            />
                        ))}
                    </View>

                    {error ? <Text style={styles.errorText}>{error}</Text> : null}

                    <View style={styles.timerSection}>
                        {!isExpired ? (
                            <Text style={[styles.timerText, countdown <= 10 && styles.timerDanger]}>
                                Expires in {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}
                            </Text>
                        ) : (
                            <Text style={[styles.timerText, styles.timerDanger]}>Code expired</Text>
                        )}
                        {!isBlocked && (
                            <Text style={styles.attemptsText}>
                                {remainingAttempts} attempt{remainingAttempts !== 1 ? 's' : ''} remaining
                            </Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[
                            styles.button,
                            (!isOtpComplete || isVerifying || isBlocked) && styles.buttonDisabled,
                        ]}
                        onPress={handleVerify}
                        disabled={!isOtpComplete || isVerifying || isBlocked}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>{isVerifying ? 'Verifying...' : 'Verify OTP'}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.linkButton} onPress={handleResend} activeOpacity={0.8}>
                        <Text style={styles.linkText}>Resend OTP</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
                        <Text style={styles.backText}>Back to Login</Text>
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
        marginBottom: 20,
    },
    brandImage: {
        width: 80,
        height: 80,
        marginBottom: 10,
        borderRadius: 16,
    },
    brandImageCompact: {
        width: 68,
        height: 68,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#F8FAFC',
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: '#94A3B8',
        textAlign: 'center',
        lineHeight: 20,
    },
    otpContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
        gap: 8,
    },
    otpInput: {
        borderRadius: 12,
        backgroundColor: '#0B1220',
        borderWidth: 1.5,
        borderColor: '#334155',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '700',
        color: '#F8FAFC',
    },
    otpInputFilled: {
        borderColor: '#2563EB',
    },
    otpInputError: {
        borderColor: '#EF4444',
    },
    errorText: {
        color: '#F87171',
        fontSize: 12,
        textAlign: 'center',
        marginBottom: 12,
    },
    timerSection: {
        alignItems: 'center',
        marginBottom: 18,
    },
    timerText: {
        color: '#22C55E',
        fontSize: 14,
        fontWeight: '600',
    },
    timerDanger: {
        color: '#EF4444',
    },
    attemptsText: {
        color: '#64748B',
        fontSize: 12,
        marginTop: 6,
    },
    button: {
        backgroundColor: '#2563EB',
        borderRadius: 12,
        height: 52,
        justifyContent: 'center',
        alignItems: 'center',
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
    linkButton: {
        alignItems: 'center',
        marginTop: 14,
    },
    linkText: {
        color: '#60A5FA',
        fontSize: 14,
        fontWeight: '600',
    },
    backButton: {
        alignItems: 'center',
        marginTop: 10,
    },
    backText: {
        color: '#64748B',
        fontSize: 13,
    },
});
