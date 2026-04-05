import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { getUser } from '$lib/server/auth';

export const DELETE: RequestHandler = async (event) => {
	const user = getUser(event);
	if (!user) throw error(401, 'Unauthorized');

	const id = parseInt(event.params.id);
	if (isNaN(id)) throw error(400, 'Invalid ID');

	await query('DELETE FROM receipts WHERE id = ?', [id]);
	return json({ success: true });
};
