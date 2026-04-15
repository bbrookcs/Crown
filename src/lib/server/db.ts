import mysql from 'mysql2/promise';
import { env } from '$env/dynamic/private';

let pool: mysql.Pool | null = null;

function getPool(): mysql.Pool {
	if (!pool) {
		pool = mysql.createPool({
			uri: env.DATABASE_URL,
			waitForConnections: true,
			connectionLimit: 10,
			queueLimit: 0,
			timezone: '+00:00'
		});
	}
	return pool;
}

export async function query<T = unknown>(sql: string, values?: unknown[]): Promise<T> {
	const db = getPool();
	const [rows] = await db.execute(sql, values);
	return rows as T;
}

export async function initializeDatabase(): Promise<void> {
	await query(`
		CREATE TABLE IF NOT EXISTS users (
			id INT AUTO_INCREMENT PRIMARY KEY,
			name VARCHAR(255) NOT NULL,
			email VARCHAR(255) UNIQUE NOT NULL,
			password_hash VARCHAR(255) NOT NULL,
			role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
		)
	`);

	await query(`
		CREATE TABLE IF NOT EXISTS events (
			id INT AUTO_INCREMENT PRIMARY KEY,
			groom_name VARCHAR(255) NOT NULL,
			bride_name VARCHAR(255) NOT NULL,
			phone VARCHAR(50) NOT NULL,
			booking_date DATE NOT NULL,
			event_date DATE NOT NULL,
			event_location VARCHAR(255),
			categories TEXT,
			status ENUM('Pending', 'File Selection', 'Editing', 'Delivered') DEFAULT 'Pending',
			total_price DECIMAL(12,2) NOT NULL DEFAULT 0,
			prepayment DECIMAL(12,2) NOT NULL DEFAULT 0,
			remaining_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_price - prepayment) STORED,
			final_payment_status ENUM('Paid', 'Unpaid') DEFAULT 'Unpaid',
			agreement_pdf_url VARCHAR(1024),
			storage_disk_number VARCHAR(100),
			backup_disk_number VARCHAR(100),
			notes TEXT,
			created_by INT,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
		)
	`);

	await query(`
		CREATE TABLE IF NOT EXISTS receipts (
			id INT AUTO_INCREMENT PRIMARY KEY,
			event_id INT NOT NULL,
			file_url VARCHAR(1024) NOT NULL,
			file_name VARCHAR(255) NOT NULL,
			amount DECIMAL(12,2),
			description VARCHAR(500),
			uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
		)
	`);

	console.log('Database initialized successfully');

	await query(`
		CREATE TABLE IF NOT EXISTS ai_conversations (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			title VARCHAR(255) DEFAULT 'New Conversation',
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	await query(`
		CREATE TABLE IF NOT EXISTS ai_messages (
			id INT AUTO_INCREMENT PRIMARY KEY,
			conversation_id INT NOT NULL,
			role ENUM('user', 'model') NOT NULL,
			content LONGTEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (conversation_id) REFERENCES ai_conversations(id) ON DELETE CASCADE
		)
	`);

	await query(`
		CREATE TABLE IF NOT EXISTS ai_global_memories (
			id INT AUTO_INCREMENT PRIMARY KEY,
			user_id INT NOT NULL,
			content TEXT NOT NULL,
			created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
			FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
		)
	`);

	console.log('Database initialized successfully');
}
