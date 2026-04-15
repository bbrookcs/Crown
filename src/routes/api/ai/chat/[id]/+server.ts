import { json } from '@sveltejs/kit';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export async function GET(event) {
    const user = requireAuth(event);
    const chatId = event.params.id;
    
    // Security check: ensure this chat belongs to the user
    const conv = await query<any[]>('SELECT id FROM ai_conversations WHERE id = ? AND user_id = ?', [chatId, user.userId]);
    if (conv.length === 0) {
        return json({ error: 'Conversation not found or unauthorized' }, { status: 404 });
    }
    
    // Fetch all messages for the requested chat history
    const msgs = await query<any[]>('SELECT id, role, content, created_at FROM ai_messages WHERE conversation_id = ? ORDER BY created_at ASC', [chatId]);
    
    return json({ messages: msgs });
}

export async function DELETE(event) {
    const user = requireAuth(event);
    const chatId = event.params.id;
    
    await query('DELETE FROM ai_conversations WHERE id = ? AND user_id = ?', [chatId, user.userId]);
    
    return json({ success: true });
}

export async function PATCH(event) {
    const user = requireAuth(event);
    const chatId = event.params.id;
    const { title } = await event.request.json();
    
    if (!title || title.trim() === '') {
        return json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    
    await query('UPDATE ai_conversations SET title = ? WHERE id = ? AND user_id = ?', [title.trim(), chatId, user.userId]);
    
    return json({ success: true });
}
