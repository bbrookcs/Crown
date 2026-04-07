import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { getUser } from '$lib/server/auth';

export const PATCH: RequestHandler = async (event) => {
	const user = getUser(event);
	if (!user) throw error(401, 'Unauthorized');

	const id = parseInt(event.params.id);
	const { status } = await event.request.json();

	const validStatuses = ['Pending', 'File Selection', 'Editing', 'Delivered'];
	if (!validStatuses.includes(status)) throw error(400, 'Invalid status');

	await query('UPDATE events SET status = ? WHERE id = ?', [status, id]);
	return json({ success: true });
};
