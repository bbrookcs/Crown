import type { PageServerLoad } from './$types';
import { query } from '$lib/server/db';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
  requireAuth(event);

  await query(`UPDATE events SET status='Client Selection'
    WHERE status='Pending' AND event_date < CURDATE()`);

  const [rows] = await Promise.all([
    query<any[]>(`SELECT
      COUNT(*) as total,
      SUM(status='Pending') as pending,
      SUM(status='Client Selection') as selection,
      SUM(status='Editing') as editing,
      SUM(status='Delivered') as delivered,
      SUM(final_payment_status='Unpaid' AND status='Delivered') as unpaid_delivered,
      SUM(event_date >= CURDATE() AND event_date <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)) as upcoming
    FROM events`)
  ]);

  const s = rows[0] as any;

  const recent = await query<any[]>(`
    SELECT id, groom_name, bride_name, event_date, status, total_price, remaining_amount
    FROM events ORDER BY created_at DESC LIMIT 6`);

  return {
    stats: {
      total:    Number(s.total)    || 0,
      pending:  Number(s.pending)  || 0,
      selection:Number(s.selection)|| 0,
      editing:  Number(s.editing)  || 0,
      delivered:Number(s.delivered)|| 0,
      unpaid:   Number(s.unpaid_delivered) || 0,
      upcoming: Number(s.upcoming) || 0,
    },
    recent
  };
};
