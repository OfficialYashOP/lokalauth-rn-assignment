import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for tracking session duration.
 *
 * Key design decisions:
 * - Uses `Date.now() - startTime` instead of incrementing a counter.
 *   This means backgrounding the app doesn't cause time drift.
 * - Uses useRef for the interval ID to prevent re-render issues.
 * - Properly cleans up the interval on unmount (no memory leaks).
 *
 * @param startTime - The timestamp when the session began (Date.now())
 * @returns { elapsed, formattedTime, stop }
 */
export function useSessionTimer(startTime: number) {
    const [elapsed, setElapsed] = useState(0);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        // Calculate initial elapsed time (handles app restart with persisted session)
        setElapsed(Math.floor((Date.now() - startTime) / 1000));

        // Update every second using absolute time difference
        intervalRef.current = setInterval(() => {
            setElapsed(Math.floor((Date.now() - startTime) / 1000));
        }, 1000);

        // Cleanup on unmount — prevents setInterval leaks
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [startTime]);

    const stop = useCallback(() => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    // Format as mm:ss
    const minutes = Math.floor(elapsed / 60);
    const seconds = elapsed % 60;
    const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds
        .toString()
        .padStart(2, '0')}`;

    return { elapsed, formattedTime, stop };
}
