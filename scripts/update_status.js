import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import mysql from 'mysql2/promise';

async function run() {
  const pool = mysql.createPool({ uri: process.env.DATABASE_URL });
  try {
    await pool.execute("UPDATE events SET status='File Selection' WHERE status='Client Selection'");
    console.log("DB Updated");
  } catch(e) { console.error(e); }
  pool.end();
}
run();

function walk(dir) {
  for (let file of fs.readdirSync(dir)) {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.svelte') || p.endsWith('.ts') || p.endsWith('.js')) {
      const c = fs.readFileSync(p, 'utf8');
      if (c.includes('Client Selection')) {
        fs.writeFileSync(p, c.replace(/Client Selection/g, 'File Selection'));
        // Also handle derived classes like badge-selection to badge-file-selection?
        // Wait, badge-selection is generic enough. Just matching the exact string.
      }
    }
  }
}
walk('./src');
