import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);
  const id = parseInt(event.params.id);
  if (isNaN(id)) throw error(404, 'Not found');

  const rows = await query<any[]>('SELECT * FROM events WHERE id=?', [id]);
  if (!rows[0]) throw error(404, 'Event not found');

  const receipts = await query<any[]>(
    'SELECT * FROM receipts WHERE event_id=? ORDER BY uploaded_at DESC', [id]);

  return { event: rows[0], receipts };
};
