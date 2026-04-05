// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { JWTPayload } from '$lib/server/auth';

declare global {
	namespace App {
		interface Locals {
			user: JWTPayload | null;
		}
	}
}

export {};
