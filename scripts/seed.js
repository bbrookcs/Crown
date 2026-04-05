// scripts/seed.js - Run with: node scripts/seed.js
// Creates the initial admin user in the database

import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config(); // Load .env

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
	console.error('❌ DATABASE_URL is not set in .env file');
	process.exit(1);
}

const pool = mysql.createPool({
	uri: DATABASE_URL,
	waitForConnections: true,
	connectionLimit: 5
});

async function seed() {
	console.log('🌱 Seeding database...');

	// Create tables
	await pool.execute(`
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

	await pool.execute(`
		CREATE TABLE IF NOT EXISTS events (
			id INT AUTO_INCREMENT PRIMARY KEY,
			groom_name VARCHAR(255) NOT NULL,
			bride_name VARCHAR(255) NOT NULL,
			phone VARCHAR(50) NOT NULL,
			booking_date DATE NOT NULL,
			event_date DATE NOT NULL,
			status ENUM('Pending', 'Client Selection', 'Editing', 'Delivered') DEFAULT 'Pending',
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

	await pool.execute(`
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

	console.log('✅ Tables created');

	// Create admin user
	const adminEmail = 'admin@crownfilms.com';
	const adminPassword = '123456';
	const hash = await bcrypt.hash(adminPassword, 12);

	try {
		await pool.execute(
			'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
			['Admin User', adminEmail, hash, 'admin']
		);
		console.log('✅ Admin user created:');
		console.log(`   Email:    ${adminEmail}`);
		console.log(`   Password: ${adminPassword}`);
	} catch (err) {
		if (err.code === 'ER_DUP_ENTRY') {
			console.log('ℹ️  Admin user already exists, skipping...');
		} else {
			throw err;
		}
	}

	// Seed sample events
	const sampleEvents = [
		{ groom: 'Ahmad', bride: 'Fatima', phone: '+966501234567', booking: '2025-12-01', event: '2026-01-15', status: 'Delivered', total: 3500, pre: 1500, pay: 'Paid', disk: 'HDD-001', backup: 'BKP-001' },
		{ groom: 'Mohammed', bride: 'Sara', phone: '+966509876543', booking: '2026-01-10', event: '2026-03-20', status: 'Editing', total: 4200, pre: 2000, pay: 'Unpaid', disk: 'HDD-002', backup: null },
		{ groom: 'Khalid', bride: 'Nora', phone: '+966507654321', booking: '2026-02-05', event: '2026-05-10', status: 'Pending', total: 2800, pre: 800, pay: 'Unpaid', disk: null, backup: null },
		{ groom: 'Omar', bride: 'Reem', phone: '+966503456789', booking: '2026-02-20', event: '2026-07-22', status: 'Pending', total: 5000, pre: 2500, pay: 'Unpaid', disk: null, backup: null },
	];

	for (const e of sampleEvents) {
		try {
			await pool.execute(
				`INSERT INTO events (groom_name, bride_name, phone, booking_date, event_date, status, total_price, prepayment, final_payment_status, storage_disk_number, backup_disk_number, created_by)
				 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
				[e.groom, e.bride, e.phone, e.booking, e.event, e.status, e.total, e.pre, e.pay, e.disk, e.backup]
			);
		} catch {}
	}

	console.log('✅ Sample events created');
	console.log('\n🎉 Database seeded successfully!');
	process.exit(0);
}

seed().catch((err) => {
	console.error('❌ Seed failed:', err);
	process.exit(1);
});
