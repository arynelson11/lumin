import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Variáveis de ambiente do Supabase não encontradas. Verifique o arquivo .env.local');
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder'
);

/**
 * Cached user ID to avoid repeated network calls.
 * Only one getUser() network call is made per session.
 * Reset on auth state change (login/logout).
 */
let cachedUserId: string | null = null;
let pendingUserRequest: Promise<string> | null = null;

// Listen for auth changes to update/clear the cache
supabase.auth.onAuthStateChange((_event, session) => {
    cachedUserId = session?.user?.id ?? null;
    pendingUserRequest = null;
});

/**
 * Clears the auth cache. Call before signOut for reliable logout.
 */
export const clearAuthCache = () => {
    cachedUserId = null;
    pendingUserRequest = null;
};

/**
 * Returns the authenticated user's ID.
 * Uses getUser() on first call (validates token + triggers refresh if expired),
 * then caches the result so subsequent calls are instant (no network).
 * Deduplicates concurrent calls so even 10 parallel calls = 1 network request.
 */
export const getAuthUserId = async (): Promise<string> => {
    // Fast path: return cached ID
    if (cachedUserId) return cachedUserId;

    // Deduplicate: if a request is already in-flight, reuse it
    if (pendingUserRequest) return pendingUserRequest;

    pendingUserRequest = (async () => {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
            pendingUserRequest = null;
            throw new Error('Usuário não autenticado. Faça login novamente.');
        }
        cachedUserId = user.id;
        pendingUserRequest = null;
        return user.id;
    })();

    return pendingUserRequest;
};
