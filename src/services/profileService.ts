import { supabase, getAuthUserId } from '../lib/supabase';

export interface UserProfile {
    id: string;
    full_name: string | null;
    whatsapp_number: string | null;
    created_at?: string;
}

export const fetchUserProfile = async (): Promise<UserProfile | null> => {
    try {
        const userId = await getAuthUserId();

        // First, try to fetch the existing profile
        const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') {
            // PGRST116 means no rows returned, which is fine initially
            throw error;
        }

        return profile || null;
    } catch (err) {
        console.error("Error fetching user profile:", err);
        return null;
    }
};

export const updateWhatsappNumber = async (whatsappNumber: string): Promise<boolean> => {
    try {
        const userId = await getAuthUserId();

        // We get the user's name from auth to populate full_name if the row doesn't exist
        const { data: userData } = await supabase.auth.getUser();
        const fullName = userData?.user?.user_metadata?.full_name || '';

        // The UPSERT mechanism (update if exists, insert if it doesn't)
        const { error } = await supabase
            .from('profiles')
            .upsert({
                id: userId,
                full_name: fullName,
                whatsapp_number: whatsappNumber
            }, { onConflict: 'id' });

        if (error) {
            if (error.code === '23505') { throw new Error('Este número já está atrelado a outra conta.'); }
            throw error;
        }

        return true;
    } catch (err) {
        console.error("Error updating whatsapp info:", err);
        throw err;
    }
};
