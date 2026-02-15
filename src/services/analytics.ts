import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnalyticsEvent, AnalyticsEventType } from '../types/auth';

/**
 * Analytics Service using @react-native-async-storage/async-storage
 *
 * Why AsyncStorage?
 * - Ships with Expo — no native build or cloud account required
 * - Well-documented React Native SDK: https://react-native-async-storage.github.io/async-storage/
 * - Simple key-value API, perfect for event logging and session persistence
 * - Recommended in the assignment as a valid SDK choice
 *
 * We use it to:
 * 1. Log analytics events (OTP generated, validation success/failure, logout)
 * 2. Persist session data (bonus feature)
 */

const EVENTS_KEY = '@lokal_analytics_events';
const SESSION_KEY = '@lokal_active_session';

/**
 * Logs an analytics event with timestamp and optional payload.
 * Events are stored as a JSON array in AsyncStorage for persistence.
 */
export async function logEvent(
    type: AnalyticsEventType,
    payload?: Record<string, unknown>
): Promise<void> {
    const event: AnalyticsEvent = {
        type,
        timestamp: Date.now(),
        payload,
    };

    try {
        // Read existing events
        const existingJson = await AsyncStorage.getItem(EVENTS_KEY);
        const events: AnalyticsEvent[] = existingJson
            ? JSON.parse(existingJson)
            : [];

        // Append new event
        events.push(event);

        // Persist
        await AsyncStorage.setItem(EVENTS_KEY, JSON.stringify(events));

        // Console log for development visibility
        console.log(`[Analytics] ${type}`, payload ?? '');
    } catch (error) {
        console.error('[Analytics] Failed to log event:', error);
    }
}

/**
 * Persists session data to AsyncStorage (bonus: session survives app restart).
 */
export async function saveSession(
    email: string,
    loginTime: number
): Promise<void> {
    try {
        await AsyncStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ email, loginTime })
        );
    } catch (error) {
        console.error('[Analytics] Failed to save session:', error);
    }
}

/**
 * Retrieves persisted session data, if any.
 */
export async function getPersistedSession(): Promise<{
    email: string;
    loginTime: number;
} | null> {
    try {
        const json = await AsyncStorage.getItem(SESSION_KEY);
        return json ? JSON.parse(json) : null;
    } catch (error) {
        console.error('[Analytics] Failed to read session:', error);
        return null;
    }
}

/**
 * Clears persisted session data (called on logout).
 */
export async function clearSession(): Promise<void> {
    try {
        await AsyncStorage.removeItem(SESSION_KEY);
    } catch (error) {
        console.error('[Analytics] Failed to clear session:', error);
    }
}
