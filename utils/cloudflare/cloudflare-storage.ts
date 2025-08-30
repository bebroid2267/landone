const URL_BUCKET =
  process.env.CLOUDFLARE_R2_URL_BUCKET ??
  'https://pub-def89a6e03b747889887d59e8a3785e2.r2.dev'

const MAIN_BUCKET = process.env.CLOUDFLARE_R2_MAIN_BUCKET ?? 'songs'

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3'

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.CLOUDFLARE_R2_ENDPOINT ?? '',
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ?? '',
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ?? '',
  },
})

export async function uploadImageToR2(
  id: string,
  content: Buffer,
  contentType: string,
): Promise<string | undefined> {
  const path = `songs/${id}`
  const params = {
    Bucket: MAIN_BUCKET,
    Key: path,
    Body: content,
    ContentType: contentType,
  }

  try {
    const command = new PutObjectCommand(params)
    await r2.send(command)
    return `${URL_BUCKET}/${path}`
  } catch (error) {
    console.error('Upload Error:', error)
    throw error
  }
}

export async function removeFileFromR2(path: string): Promise<void> {
  const params = {
    Bucket: MAIN_BUCKET,
    Key: path,
  }

  try {
    const command = new DeleteObjectCommand(params)
    await r2.send(command)
    console.log('File successfully deleted:', path)
  } catch (error) {
    console.error('Delete Error:', error)
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    throw new Error(error.message)
  }
}

export async function uploadAudioToR2(
  id: string,
  content: Buffer,
  contentType = 'audio/mpeg',
): Promise<string | undefined> {
  const path = `songs/${id}`
  const params = {
    Bucket: MAIN_BUCKET,
    Key: path,
    Body: content,
    ContentType: contentType,
  }

  try {
    const command = new PutObjectCommand(params)
    await r2.send(command)
    return `${URL_BUCKET}/${path}`
  } catch (error) {
    console.error('Upload Audio Error:', error)
    throw error
  }
}
