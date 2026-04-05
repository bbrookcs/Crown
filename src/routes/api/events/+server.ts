import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const d = await event.request.json();

  const {
    groom_name, bride_name, phone, booking_date, event_date,
    status, total_price, prepayment, storage_disk_number, backup_disk_number, notes
  } = d;

  if (!groom_name || !bride_name || !phone || !booking_date || !event_date) {
    throw error(400, 'Missing required fields');
  }

  const result = await query<any>(
    `INSERT INTO events
      (groom_name, bride_name, phone, booking_date, event_date, status, total_price, prepayment,
       storage_disk_number, backup_disk_number, notes, created_by, final_payment_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')`,
    [
      groom_name, bride_name, phone, booking_date, event_date,
      status || 'Pending',
      Number(total_price) || 0,
      Number(prepayment) || 0,
      storage_disk_number || null,
      backup_disk_number || null,
      notes || null,
      user.userId
    ]
  );

  return json({ id: result.insertId });
};
