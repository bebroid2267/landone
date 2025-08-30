import { customNanoid } from './customNanoid'
import { uploadAudioToR2 } from './cloudflare/cloudflare-storage'

// Download audio from URL and return as Buffer
export async function downloadAudio(audioUrl: string): Promise<Buffer> {
  const response = await fetch(audioUrl)
  if (!response.ok) {
    throw new Error('Failed to download audio')
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

// Save audio to R2 storage and return public URL
export async function saveAudioToStorage(
  audioBuffer: Buffer,
  format = 'flac',
  originalUrl: string,
): Promise<string> {
  try {
    const audioId = customNanoid(16)
    const audioUrl = await uploadAudioToR2(
      audioId,
      audioBuffer,
      `audio/${format}`,
    )

    if (!audioUrl) {
      throw new Error('Failed to upload audio to storage')
    }

    return audioUrl
  } catch (error) {
    console.error('R2 Storage Error, using original URL:', error)
    return originalUrl
  }
}
