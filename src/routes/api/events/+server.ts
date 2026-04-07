import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
  const user = requireAuth(event);
  const d = await event.request.json();

  const {
    groom_name, bride_name, phone, booking_date, event_date,
    event_location, categories, status,
    total_price, prepayment, storage_disk_number, backup_disk_number, notes, crew
  } = d;

  if (!groom_name || !bride_name || !phone || !booking_date || !event_date) {
    throw error(400, 'Missing required fields');
  }

  let result: any;
  try {
    result = await query<any>(
      `INSERT INTO events
        (groom_name, bride_name, phone, booking_date, event_date, event_location, categories,
         status, total_price, prepayment, storage_disk_number, backup_disk_number, notes, crew,
         created_by, final_payment_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unpaid')`,
      [
        groom_name, bride_name, phone, booking_date, event_date,
        event_location || null,
        categories || null,
        status || 'Pending',
        Number(total_price) || 0,
        Number(prepayment) || 0,
        storage_disk_number || null,
        backup_disk_number || null,
        notes || null,
        crew || null,
        user.userId
      ]
    );
  } catch (e: any) {
    // If new columns don't exist yet (migration not run), fall back to insert without them
    if (e.code === 'ER_BAD_FIELD_ERROR') {
      result = await query<any>(
        `INSERT INTO events
          (groom_name, bride_name, phone, booking_date, event_date,
           status, total_price, prepayment, storage_disk_number, backup_disk_number, notes,
           created_by, final_payment_status)
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
    } else {
      throw error(500, e.message);
    }
  }

  return json({ id: result.insertId });
};
