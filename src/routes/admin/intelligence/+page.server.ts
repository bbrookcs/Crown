import type { PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
    const user = requireAuth(event);
    
    // Load the user's past conversations for the sidebar
    const conversations = await query<any[]>(
        'SELECT id, title, created_at, updated_at FROM ai_conversations WHERE user_id = ? ORDER BY updated_at DESC', 
        [user.userId]
    );

    return { conversations };
};
