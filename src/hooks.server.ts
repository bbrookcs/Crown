import type { Handle } from '@sveltejs/kit';
import { initializeDatabase } from '$lib/server/db';
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

	const user = getUser(event);
	event.locals.user = user;

	const path = event.url.pathname;
	const isAuthRoute = path.startsWith('/auth');
	const isApiRoute = path.startsWith('/api');

	if (!isAuthRoute && !isApiRoute && !user) {
		throw redirect(302, '/auth/login');
	}

	if (isAuthRoute && user) {
		throw redirect(302, '/dashboard');
	}

	return resolve(event);
};
