const PRESENTATION_GPT_URL = 'https://chatgpt.com/g/g-ZOaikRdss-presentation'
const PRESENTATION_LIMIT = 100
const PRESENTATIONS_TABLE_NAME = 'presentations'
const ERROR_LOAD_IMAGE_URL =
  'https://vncfikgvyrjvzcaseehe.supabase.co/storage/v1/object/public/presentation-constants/default_url.jpg'
const DEFAULT_IMAGE_SIZE = 650

export const ORIGIN =
  process.env.NEXT_PUBLIC_SITE_URL === 'http://localhost:3000'
    ? 'https://resume.a.pinggy.online'
    : process.env.NEXT_PUBLIC_SITE_URL

export const ERROR_AUTH_NAME = 'auth-error'

export {
  PRESENTATION_GPT_URL,
  PRESENTATION_LIMIT,
  PRESENTATIONS_TABLE_NAME,
  ERROR_LOAD_IMAGE_URL,
  DEFAULT_IMAGE_SIZE,
}
