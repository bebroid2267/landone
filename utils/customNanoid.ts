import { customAlphabet } from 'nanoid'

const CUSTOM_ALPHABET =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'

export const customNanoid = (count: number): string => {
  return customAlphabet(CUSTOM_ALPHABET, count)()
}
