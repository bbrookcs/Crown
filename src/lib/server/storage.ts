import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '$env/dynamic/private';
import { v4 as uuidv4 } from 'uuid';

function getS3Client(): S3Client {
	return new S3Client({
		region: 'auto',
		endpoint: env.CLOUDFLARE_R2_ENDPOINT,
		credentials: {
			accessKeyId: env.CLOUDFLARE_R2_ACCESS_KEY || '',
			secretAccessKey: env.CLOUDFLARE_R2_SECRET_KEY || ''
		}
	});
}

export async function uploadFile(
	file: File,
	folder: 'agreements' | 'receipts'
): Promise<{ url: string; key: string }> {
	const client = getS3Client();
	const bucket = env.CLOUDFLARE_R2_BUCKET || 'crown-wedding-files';
	const ext = file.name.split('.').pop();
	const key = `${folder}/${uuidv4()}.${ext}`;

	const buffer = Buffer.from(await file.arrayBuffer());

	await client.send(
		new PutObjectCommand({
			Bucket: bucket,
			Key: key,
			Body: buffer,
			ContentType: file.type
		})
	);

	const publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL || '';
	const url = `${publicUrl}/${key}`;

	return { url, key };
}

export async function deleteFile(key: string): Promise<void> {
	const client = getS3Client();
	const bucket = env.CLOUDFLARE_R2_BUCKET || 'crown-wedding-files';

	await client.send(
		new DeleteObjectCommand({
			Bucket: bucket,
			Key: key
		})
	);
}

export async function getSignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
	const client = getS3Client();
	const bucket = env.CLOUDFLARE_R2_BUCKET || 'crown-wedding-files';

	const command = new GetObjectCommand({ Bucket: bucket, Key: key });
	return getSignedUrl(client, command, { expiresIn });
}
