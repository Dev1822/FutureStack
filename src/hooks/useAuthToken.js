import { useEffect, useCallback } from 'react';
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

    useEffect(() => {
        if (isLoaded) {
            // Set the token getter function for the API service
            setAuthTokenGetter(tokenGetter);
        }
    }, [isLoaded, tokenGetter]);

    return { isLoaded, isSignedIn };
};

export default useAuthToken;
