The logs indicate that Supabase’s authentication events are happening (i.e., TOKEN_REFRESHED and SIGNED_IN), so your backend is working fine. The fact that you're stuck on the sign–in screen on the first run (but then properly redirected after reopening the app) suggests that the app’s navigation or auth state handling isn’t updating immediately after the login event.

Here are some common causes and suggestions to resolve the issue:

1. Auth State Propagation Delay  
   • When signing in for the first time, the auth state (or the user context) may not be updated immediately in your app’s UI.  
   • As a result, calls that depend on the updated auth state (such as a router.replace, which redirects the signed–in user to the main app) may not execute correctly until a later re–render (for example, after restarting the app).

2. Timing of Navigation Redirection  
   • If the redirection (router.replace('/(tabs)')) is triggered too early (i.e., before your navigation stack or auth context is fully initialized), the redirect might be “missed” in the initial session.  
   • The fact that closing and opening the app later fixes the issue further suggests a timing problem.

3. Recommended Fix: Use an Auth State Listener  
   • Instead of relying solely on the sign–in function to perform the redirect, subscribe to Supabase auth state changes using onAuthStateChange.  
   • This ensures that as soon as the sign–in event is fully registered (and the session is available), you trigger the redirect.
   
   For example, in your top–level auth provider or a component that manages navigation, add a listener like this:
   
   ```typescript
   import { useEffect } from 'react';
   import { supabase } from '../utils/supabase';
   import { useRouter } from 'your-router-library';

   function AuthListener() {
     const router = useRouter();

     useEffect(() => {
       const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
         if (event === 'SIGNED_IN' && session) {
           router.replace('/(tabs)');
         }
       });
       return () => authListener.subscription.unsubscribe();
     }, [router]);

     return null;
   }

   export default AuthListener;
   ```

   • Make sure to mount this component at a level where it’s active for the entire app (for example, inside your main app component).

4. Verify Your Auth Context  
   • Double–check that your useUser hook (or equivalent) is correctly subscribed to auth state changes and updates in real time.
   • Sometimes the initial session may need to be reloaded from local storage or refreshed from Supabase before it becomes available in your context.

By using an auth state listener and ensuring that the navigation redirection only occurs after the session is fully established, you can ensure that the user is automatically redirected on the initial sign–in without having to restart the app.