import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';
import bcrypt from 'bcryptjs';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireAuth(event);
    const d = await event.request.formData();
    const currPass = d.get('current_password')?.toString() || '';
    const newPass  = d.get('new_password')?.toString() || '';

    if (!currPass || !newPass)
      return fail(400, { error: 'Please provide both current and new passwords.' });
    if (newPass.length < 6)
      return fail(400, { error: 'New password must be at least 6 characters.' });

    const rows = await query<any[]>('SELECT password_hash FROM users WHERE id=?', [user.userId]);
    if (!rows[0] || !(await bcrypt.compare(currPass, rows[0].password_hash))) {
      return fail(400, { error: 'Incorrect current password.' });
    }

    const hashed = await bcrypt.hash(newPass, 10);
    await query('UPDATE users SET password_hash=? WHERE id=?', [hashed, user.userId]);

    return { success: true };
  }
};
