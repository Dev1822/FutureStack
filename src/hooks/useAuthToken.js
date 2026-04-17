import { useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { setAuthTokenGetter } from '../services/api';

/**
 * Hook to set up the auth token getter for API calls
 * Must be used within a ClerkProvider context
 */
export const useAuthToken = () => {
    const { getToken, isLoaded, isSignedIn } = useAuth();

    // Memoize the token getter to avoid unnecessary re-renders
    // Note: getToken from Clerk is stable across renders
    const tokenGetter = useCallback(async () => {
        if (!isSignedIn) return null;
        return await getToken();
    }, [isSignedIn, getToken]);

    // Set synchronously on every render (not in useEffect).
    // This ensures getAuthToken is available before any child component's
    // useEffect fires, eliminating the race condition where Dashboard/other
    // pages fire API calls before the token getter is registered.
    if (isLoaded) {
        setAuthTokenGetter(tokenGetter);
    }

    return { isLoaded, isSignedIn };
};

export default useAuthToken;
