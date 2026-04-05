import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { env } from '$env/dynamic/private';
import type { RequestEvent } from '@sveltejs/kit';

export interface JWTPayload {
	userId: number;
	email: string;
	role: string;
	name: string;
}

export function signToken(payload: JWTPayload): string {
	return jwt.sign(payload, env.JWT_SECRET || 'fallback-secret', { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, env.JWT_SECRET || 'fallback-secret') as JWTPayload;
	} catch {
		return null;
	}
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
	return bcrypt.compare(password, hash);
}

export function getUser(event: RequestEvent): JWTPayload | null {
	const token = event.cookies.get('auth_token');
	if (!token) return null;
	return verifyToken(token);
}

export function requireAuth(event: RequestEvent): JWTPayload {
	const user = getUser(event);
	if (!user) {
		throw new Error('Unauthorized');
	}
	return user;
}

export function requireRole(event: RequestEvent, roles: string[]): JWTPayload {
	const user = requireAuth(event);
	if (!roles.includes(user.role)) {
		throw new Error('Forbidden');
	}
	return user;
}
