import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/LoginScreen';
import OtpScreen from '../screens/OtpScreen';
import SessionScreen from '../screens/SessionScreen';
import type { RootStackParamList } from '../types/navigation';

/**
 * Navigation param types for type-safe navigation.
 */
type AppNavigatorProps = {
    initialSession?: RootStackParamList['Session'];
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * AppNavigator
 *
 * Stack navigator: Login → OTP → Session
 * - No header shown (custom headers in each screen)
 * - Session screen replaces the stack (no back gesture to OTP)
 */
export default function AppNavigator({ initialSession }: AppNavigatorProps) {
    return (
        <Stack.Navigator
            initialRouteName={initialSession ? 'Session' : 'Login'}
            screenOptions={{
                headerShown: false,
                animation: 'slide_from_right',
                contentStyle: { backgroundColor: '#0F172A' },
            }}
        >
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Otp" component={OtpScreen} />
            <Stack.Screen
                name="Session"
                component={SessionScreen}
                initialParams={initialSession}
                options={{
                    gestureEnabled: false, // Prevent swipe back from session
                }}
            />
        </Stack.Navigator>
    );
}
