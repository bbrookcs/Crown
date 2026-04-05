import type { PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);
  const { url } = event;
  const search  = url.searchParams.get('search')  || '';
  const status  = url.searchParams.get('status')  || '';
  const payment = url.searchParams.get('payment') || '';

  await query(`UPDATE events SET status='Client Selection'
    WHERE status='Pending' AND event_date < CURDATE()`);

  let sql = `SELECT id,groom_name,bride_name,phone,event_date,booking_date,status,
    total_price,prepayment,remaining_amount,final_payment_status,
    storage_disk_number,backup_disk_number FROM events WHERE 1=1`;
  const p: string[] = [];

  if (search)  { sql += ` AND (groom_name LIKE ? OR bride_name LIKE ? OR phone LIKE ?)`; const s=`%${search}%`; p.push(s,s,s); }
  if (status)  { sql += ` AND status=?`;               p.push(status); }
  if (payment) { sql += ` AND final_payment_status=?`; p.push(payment); }

  sql += ` ORDER BY event_date DESC`;
  const events = await query<any[]>(sql, p);
  return { events, search, status, payment };
};
