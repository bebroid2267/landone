import { createCipheriv, createDecipheriv, Cipher, Decipher } from 'crypto'

const ENCRYPTION_KEY = Buffer.from(
  'e53ea3d76623605e0eab952abf7ebb4f9e0c0387a51a26a845ab243d07cb867f',
  'hex',
)
const IV = Buffer.from('ca874261625b227a74b5287cc2a37c7b', 'hex')

export function encrypt(text: string): string {
  const cipher: Cipher = createCipheriv('aes-256-cbc', ENCRYPTION_KEY, IV)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return encrypted
}

export function decrypt(encryptedText: string): string {
  const decipher: Decipher = createDecipheriv('aes-256-cbc', ENCRYPTION_KEY, IV)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}
