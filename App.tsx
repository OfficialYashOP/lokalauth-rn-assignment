import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import { getPersistedSession } from './src/services/analytics';
import type { SessionData } from './src/types/auth';

/**
 * App Entry Point
 *
 * Wraps the navigator with NavigationContainer.
 * Checks for a persisted session on startup (bonus feature).
 */
export default function App() {
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [initialSession, setInitialSession] = useState<SessionData | undefined>();

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      const persisted = await getPersistedSession();
      if (!isMounted) return;

      const validSession =
        persisted &&
        typeof persisted.email === 'string' &&
        typeof persisted.loginTime === 'number'
          ? persisted
          : undefined;

      setInitialSession(validSession);
      setIsBootstrapping(false);
    };

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isBootstrapping) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <AppNavigator initialSession={initialSession} />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0F172A',
  },
});
