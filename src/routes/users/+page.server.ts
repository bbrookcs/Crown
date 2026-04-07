import type { PageServerLoad, Actions } from './$types';
import { query } from '$lib/server/db';
import { requireRole, hashPassword } from '$lib/server/auth';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async (event) => {
  // Only admins can view/manage users
  requireRole(event, ['admin']);
  
  const users = await query<any[]>('SELECT id, name, email, role, created_at FROM users ORDER BY created_at DESC');
  return { users };
};

export const actions: Actions = {
  add: async (event) => {
    requireRole(event, ['admin']);
    const data = await event.request.formData();
    const name = data.get('name')?.toString();
    const email = data.get('email')?.toString();
    const password = data.get('password')?.toString();
    const role = data.get('role')?.toString() || 'viewer';

    if (!name || !email || !password) {
      return fail(400, { error: 'Name, email, and password are required' });
    }

    try {
      const hashed = await hashPassword(password);
      await query(
        'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
        [name, email, hashed, role]
      );
      return { success: true };
    } catch (e: any) {
      if (e.code === 'ER_DUP_ENTRY') {
        return fail(400, { error: 'Email already exists' });
      }
      console.error(e);
      return fail(500, { error: 'Failed to create user' });
    }
  },
  
  delete: async (event) => {
    requireRole(event, ['admin']);
    const data = await event.request.formData();
    const id = data.get('id')?.toString();
    if (!id) return fail(400, { error: 'User ID is required' });

    try {
      await query('DELETE FROM users WHERE id = ?', [id]);
      return { success: true };
    } catch (e: any) {
      console.error(e);
      return fail(500, { error: 'Failed to delete user' });
    }
  }
};
