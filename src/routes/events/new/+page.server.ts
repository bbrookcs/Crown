import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);
  return {};
};

export const actions: Actions = {
  default: async (event) => {
    const user = requireAuth(event);
    const d = await event.request.formData();
    const get = (k: string) => d.get(k)?.toString().trim() || '';

    const groom  = get('groom_name');
    const bride  = get('bride_name');
    const phone  = get('phone');
    const bdate  = get('booking_date');
    const edate  = get('event_date');
    const status = get('status') || 'Pending';
    const total  = parseFloat(get('total_price')  || '0');
    const pre    = parseFloat(get('prepayment')   || '0');
    const fps    = get('final_payment_status')    || 'Unpaid';
    const disk   = get('storage_disk_number')     || null;
    const bkp    = get('backup_disk_number')      || null;
    const notes  = get('notes')                   || null;

    if (!groom || !bride || !phone || !bdate || !edate)
      return fail(400, { error: 'Please fill all required fields.' });

    const r = await query<any>(`INSERT INTO events
      (groom_name,bride_name,phone,booking_date,event_date,status,
       total_price,prepayment,final_payment_status,storage_disk_number,backup_disk_number,notes,created_by)
      VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [groom,bride,phone,bdate,edate,status,total,pre,fps,disk,bkp,notes,user.userId]);

    throw redirect(302, `/events/${r.insertId}`);
  }
};
