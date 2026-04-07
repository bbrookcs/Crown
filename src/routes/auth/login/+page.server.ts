import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { comparePassword, signToken } from '$lib/server/auth';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) throw redirect(302, '/admin/dashboard');
	return {};
};

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required', email });
		}

		const users = await query<{ id: number; name: string; email: string; password_hash: string; role: string }[]>(
			'SELECT id, name, email, password_hash, role FROM users WHERE email = ?',
			[email]
		);

		const user = users[0];
		if (!user) {
			return fail(401, { error: 'Invalid email or password', email });
		}

		const valid = await comparePassword(password, user.password_hash);
		if (!valid) {
			return fail(401, { error: 'Invalid email or password', email });
		}

		const token = signToken({ userId: user.id, email: user.email, role: user.role, name: user.name });

		cookies.set('auth_token', token, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'strict',
			maxAge: 60 * 60 * 24 * 7 // 7 days
		});

		throw redirect(302, '/admin/dashboard');
	}
};
