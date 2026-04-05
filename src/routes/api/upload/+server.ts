import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadFile } from '$lib/server/storage';
import { query } from '$lib/server/db';
import { getUser } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
	const user = getUser(event);
	if (!user) throw error(401, 'Unauthorized');

	const formData = await event.request.formData();
	const file = formData.get('file') as File | null;
	const event_id = parseInt(formData.get('event_id')?.toString() || '0');
	const type = formData.get('type')?.toString() as 'agreement' | 'receipt';
	const amount = formData.get('amount')?.toString();
	const description = formData.get('description')?.toString();

	if (!file || !event_id || !type) throw error(400, 'Missing required fields');

	const maxSize = 20 * 1024 * 1024; // 20MB
	if (file.size > maxSize) throw error(400, 'File too large (max 20MB)');

	const folder = type === 'agreement' ? 'agreements' : 'receipts';
	const { url } = await uploadFile(file, folder);

	if (type === 'agreement') {
		await query('UPDATE events SET agreement_pdf_url = ? WHERE id = ?', [url, event_id]);
		return json({ success: true, url });
	} else {
		const result = await query<{ insertId: number }>(
			`INSERT INTO receipts (event_id, file_url, file_name, amount, description)
			 VALUES (?, ?, ?, ?, ?)`,
			[event_id, url, file.name, amount ? parseFloat(amount) : null, description || null]
		);

		const insertId = (result as unknown as { insertId: number }).insertId;
		const receipts = await query<any[]>('SELECT * FROM receipts WHERE id = ?', [insertId]);

		return json({ success: true, receipt: receipts[0] });
	}
};
