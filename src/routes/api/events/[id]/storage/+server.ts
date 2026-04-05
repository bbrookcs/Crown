import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const PATCH: RequestHandler = async (event) => {
  requireAuth(event);
  const id = parseInt(event.params.id);
  if (isNaN(id)) throw error(400, 'Invalid ID');

  const { storage_disk_number, backup_disk_number } = await event.request.json();

  await query(
    'UPDATE events SET storage_disk_number=?, backup_disk_number=? WHERE id=?',
    [storage_disk_number || null, backup_disk_number || null, id]
  );

  return json({ success: true });
};
