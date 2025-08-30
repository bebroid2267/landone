import type { Database } from '@/types_db'
import type { Json } from '@/types_db'

export type ImageFormat = 'jpeg' | 'png' | 'webp'
export type AudioFormat = 'mp3' | 'wav' | 'ogg' | 'flac'
export type GenreType =
  | 'pop'
  | 'rock'
  | 'electronic'
  | 'hip_hop'
  | 'jazz'
  | 'classical'
  | 'folk'
  | 'ambient'
  | 'other'

export const IMAGE_FORMATS: Record<ImageFormat, string> = {
  png: 'image/png',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
} as const

export const AUDIO_FORMATS: Record<AudioFormat, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  ogg: 'audio/ogg',
  flac: 'audio/flac',
} as const

export enum AIModel {
  Default = 'Default',
  Universal = 'Universal',
  Pro = 'Pro',
  Lightning = 'Lightning',
  Logo = 'Logo',
  Cartoon = 'Cartoon',
  AmateurPhoto = 'AmateurPhoto',
  Ghibli = 'Ghibli',
  Anime = 'Anime',
  UniversalDeep = 'UniversalDeep',
  PhotoStyling = 'PhotoStyling',
  Vivid = 'Vivid',
}

export interface ModelInfo {
  id: AIModel
  name: string
  description: string
  modelCode: string
  lora?: {
    model: string
    weight: number
  }
  isGPTAvailable?: boolean
  isEditorAvailable?: boolean
}

export const AI_MODELS: ModelInfo[] = [
  {
    id: AIModel.Default,
    name: 'Fast',
    description:
      'Default option for everything. Works exceptionally well with fantasy, artistic themes and text in images.',
    modelCode: 'runware:100@1',
    isGPTAvailable: true,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Universal,
    name: 'Universal',
    description:
      'Versatile alternative for general requests. Provides balanced results but with slightly reduced text quality.',
    modelCode: 'runware:101@1',
    isGPTAvailable: true,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Pro,
    name: 'PRO',
    description:
      'Professional-grade model excelling in all types of content, particularly effective for logo creation.',
    modelCode: 'rundiffusion:130@100',
    isGPTAvailable: true,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Lightning,
    name: 'Lightning',
    description:
      'Cost-effective model delivering good general-purpose results with faster processing.',
    modelCode: 'rundiffusion:110@101',
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Logo,
    name: 'LOGO',
    description:
      'Specialized model optimized for professional logo design and branding materials.',
    modelCode: 'rundiffusion:130@100',
    isGPTAvailable: true,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Cartoon,
    name: 'Cartoon',
    description:
      'Perfect for creating engaging cartoon-style illustrations and characters.',
    modelCode: 'civitai:30240@125771',
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
  {
    id: AIModel.AmateurPhoto,
    name: 'Amateur Photo',
    description:
      'Creates realistic images with an amateur photography aesthetic. Perfect for authentic-looking photos.',
    modelCode: 'runware:101@1',
    lora: {
      model: 'civitai:652699@828456',
      weight: 1.0,
    },
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Ghibli,
    name: 'Ghibli',
    description:
      'Generates images in the distinctive Studio Ghibli animation style with whimsical and charming aesthetics.',
    modelCode: 'runware:101@1',
    lora: {
      model: 'civitai:715472@800101',
      weight: 1.0,
    },
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Anime,
    name: 'Anime',
    description:
      'Creates images in popular anime style with vibrant colors and distinctive character designs.',
    modelCode: 'runware:101@1',
    lora: {
      model: 'civitai:128568@747534',
      weight: 1.0,
    },
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
  /*
   * {
   *   id: AIModel.UniversalDeep,
   *   name: 'Universal Deep',
   *   description:
   *     'Advanced model capable of generating diverse content with exceptional
   *     detail and complexity.',
   *   modelCode: 'runware:103@1',
   *   isGPTAvailable: false,
   *   isEditorAvailable: true,
   * },
   */
  {
    id: AIModel.PhotoStyling,
    name: 'Photo Styling',
    description:
      'Creates images with authentic photographic qualities and a deliberately unpolished, genuine look.',
    modelCode: 'runware:101@1',
    lora: {
      model: 'rundiffusion:500@100',
      weight: 1.0,
    },
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
  {
    id: AIModel.Vivid,
    name: 'Vivid',
    description:
      'Generates images with enhanced vibrancy and rich, intense colors for eye-catching visual content.',
    modelCode: 'runware:101@1',
    lora: {
      model: 'civitai:663742@742813',
      weight: 1.0,
    },
    isGPTAvailable: false,
    isEditorAvailable: true,
  },
]

// Filtered model lists for different use cases
export const GPT_MODELS = AI_MODELS.filter((model) => model.isGPTAvailable)
export const EDITOR_MODELS = AI_MODELS.filter(
  (model) => model.isEditorAvailable,
)

// Subscription, Product, Price from supabase
export type Subscription = Database['public']['Tables']['subscriptions']['Row']
export type Product = Database['public']['Tables']['products']['Row']
export type Price = Database['public']['Tables']['prices']['Row']

// Image type with Date objects for timestamps
export interface Image {
  id: string
  short_id: string
  user_id: string | null
  prompt: string
  negative_prompt: string | null
  image_url: string
  thumbnail_url: string | null
  width: number
  height: number
  model: string
  model_style: string
  steps: number
  seed: number | null
  cfg_scale: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  format: ImageFormat
  created_at: string
  updated_at: string
  metadata: Json | null
  cost: number | null
  user_cost: number | null
}

export interface SupabaseUser {
  id: string
  full_name: string
  avatar_url: string
  utm_source: string
  consent_status: ConsentStatus
  email: string
  user_request: string | null
  sql_id: string | null
}

export type ConsentStatus = 'not_specified' | 'consented' | 'declined'

export interface ProductWithPrices extends Product {
  prices: Price[]
}
export interface PriceWithProduct extends Price {
  products: Product | null
}
export interface SubscriptionWithProduct extends Subscription {
  prices: PriceWithProduct | null
}

export interface AnimationProps {
  mainColor?: string
  secondColor?: string
  bgColor: string
}

export interface RenderProps {
  blocks: (JSX.Element | null)[]
  isAnimations: boolean
}

export interface WebsiteSupabase {
  id: string
  user_id: string | null
  website_title: string
  website_data: string
  last_modified: string
  link: string | null
  created_at: string
  subdomain: string | null
  mail: string | null
  user_domain: string | null
  gpt_token: string | null
}

export interface OpenaiFileIdRefs {
  name: string
  id: string
  mime_type: string
  download_link: string
}

export interface ImageDimension {
  name: string
  width: number
  height: number
}

export const IMAGE_DIMENSIONS: ImageDimension[] = [
  { name: 'Square', width: 512, height: 512 },
  { name: 'Square x2', width: 1024, height: 1024 },
  { name: 'Square HD', width: 2048, height: 2048 },
  { name: 'Portrait 3:4', width: 512, height: 704 },
  { name: 'Portrait 9:16', width: 512, height: 896 },
  { name: 'Portrait 9:16 HD', width: 1024, height: 1792 },
  { name: 'Landscape 4:3', width: 704, height: 512 },
  { name: 'Landscape 16:9', width: 896, height: 512 },
  { name: 'Landscape 16:9 HD', width: 2048, height: 1152 },
  { name: 'Custom', width: 512, height: 512 },
]

// Song type with timestamps
export interface Song {
  id: string
  short_id: string
  user_id: string | null
  title: string | null
  prompt: string | null
  negative_prompt: string | null
  song_url: string | null
  preview_url: string | null
  duration: number | null
  tempo: number | null
  model: string | null
  genre: GenreType | null
  mood: string | null
  lyrics: string | null
  instruments: string[] | null
  vocals: boolean | null
  status: string | null
  created_at: string | null
  updated_at: string | null
  metadata: Json | null
  format: AudioFormat | null
  model_style: string | null
  cost: number | null
  user_cost: number | null
}

// Audio model enum
export enum SongModel {
  Default = 'Default',
  Instrumental = 'Instrumental',
  Vocal = 'Vocal',
  Ambient = 'Ambient',
  Electronic = 'Electronic',
  Classic = 'Classic',
}

export interface SongModelInfo {
  id: SongModel
  name: string
  description: string
  modelCode: string
  isGPTAvailable?: boolean
  isEditorAvailable?: boolean
}

export interface SongDuration {
  name: string
  seconds: number
}

export const SONG_DURATIONS: SongDuration[] = [
  { name: 'Short (15s)', seconds: 15 },
  { name: 'Medium (30s)', seconds: 30 },
  { name: 'Standard (60s)', seconds: 60 },
  { name: 'Extended (120s)', seconds: 120 },
  { name: 'Custom', seconds: 30 },
]
