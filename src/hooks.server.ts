import type { Handle } from '@sveltejs/kit';
import { initializeDatabase, query } from '$lib/server/db';
import { getUser } from '$lib/server/auth';
import { redirect } from '@sveltejs/kit';

let dbInitialized = false;

export const handle: Handle = async ({ event, resolve }) => {
	if (!dbInitialized) {
		try {
			await initializeDatabase();
			dbInitialized = true;
		} catch (err) {
			console.error('DB init failed:', err);
		}
	}

	let user = getUser(event);

	// Validate against DB to ensure they still exist
	if (user) {
		const rows = await query<any[]>('SELECT id, role FROM users WHERE id = ? LIMIT 1', [user.userId]);
		if (!rows || rows.length === 0) {
			user = null;
			event.cookies.delete('auth_token', { path: '/' });
		} else {
		    // Optionally sync up-to-date role if changed
			user.role = rows[0].role;
		}
	}

	event.locals.user = user;

	const path = event.url.pathname;
	const isAuthRoute = path.startsWith('/auth');
	const isAdminRoute = path.startsWith('/admin');

	// Protect only /admin routes
	if (isAdminRoute && !user) {
		throw redirect(302, '/auth/login');
	}

	if (isAuthRoute && user) {
		throw redirect(302, '/admin/dashboard');
	}

	return resolve(event);
};
