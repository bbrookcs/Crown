import { error, fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);
  const id = parseInt(event.params.id);
  if (isNaN(id)) throw error(404, 'Not found');
  const rows = await query<any[]>('SELECT * FROM events WHERE id=?', [id]);
  if (!rows[0]) throw error(404, 'Event not found');
  return { event: rows[0] };
};

export const actions: Actions = {
  default: async (event) => {
    requireAuth(event);
    const id = parseInt(event.params.id);
    const d = await event.request.formData();
    const get = (k: string) => d.get(k)?.toString().trim() || '';

    const groom  = get('groom_name');
    const bride  = get('bride_name');
    const phone  = get('phone');
    const bdate  = get('booking_date');
    const edate  = get('event_date');
    const eloc   = get('event_location');
    const categoriesStr = get('categories') || null;
    const status = get('status');
    const total  = parseFloat(get('total_price')  || '0');
    const pre    = parseFloat(get('prepayment')   || '0');
    const fps    = get('final_payment_status')    || 'Unpaid';
    const disk   = get('storage_disk_number')     || null;
    const bkp    = get('backup_disk_number')      || null;
    const notes  = get('notes')                   || null;
    const crewStr= get('crew')                    || null;

    if (!groom || !bride || !phone || !bdate || !edate)
      return fail(400, { error: 'Please fill all required fields.' });

    await query(`UPDATE events SET
      groom_name=?,bride_name=?,phone=?,booking_date=?,event_date=?,event_location=?,categories=?,status=?,
      total_price=?,prepayment=?,final_payment_status=?,
      storage_disk_number=?,backup_disk_number=?,notes=?,crew=? WHERE id=?`,
      [groom,bride,phone,bdate,edate,eloc || null,categoriesStr,status,total,pre,fps,disk,bkp,notes,crewStr,id]);

    throw redirect(302, `/admin/events/${id}`);
  }
};
