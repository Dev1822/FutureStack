import { useCallback, useLayoutEffect } from 'react';
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

  // Register in commit phase before passive effects to avoid
  // render-phase side effects under concurrent rendering.
  useLayoutEffect(() => {
    if (isLoaded) {
      setAuthTokenGetter(tokenGetter);
    }
    return () => {
      setAuthTokenGetter(null);
    };
  }, [isLoaded, tokenGetter]);

  return { isLoaded, isSignedIn };
};

export default useAuthToken;
