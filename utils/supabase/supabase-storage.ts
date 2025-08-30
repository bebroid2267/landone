import { Database } from '@/types_db'
import { SupabaseClient } from '@supabase/supabase-js'

const WEBSITES_STORAGE_NAME = 'websites-data'

interface StorageFunction {
  uploadFile: (
    supabase: SupabaseClient<Database>,
    path: string,
    content: BlobPart,
  ) => Promise<string | undefined>
  updateFile: (
    supabase: SupabaseClient<Database>,
    path: string,
    content: BlobPart,
  ) => Promise<string | undefined>
  removeFile: (
    supabase: SupabaseClient<Database>,
    path: string,
  ) => Promise<void>
}

export const {
  uploadFile: uploadWebsiteLogoToStorage,
  updateFile: updateWebsiteLogoToStorage,
  removeFile: removeWebsiteLogoFromStorage,
} = createStorageFunction(WEBSITES_STORAGE_NAME, 'image/webp', 'logo')

/*
 * A factory function that creates a set of storage functions specific to a
 * file type.
 */
function createStorageFunction(
  storageName: string,
  contentType: string,
  folder: string,
): StorageFunction {
  async function uploadFile(
    supabase: SupabaseClient<Database>,
    id: string,
    content: BlobPart,
  ): Promise<string | undefined> {
    const blob = new Blob([content], { type: contentType })

    const path = `${folder}/${id}`

    const { error } = await supabase.storage
      .from(storageName)
      .upload(path, blob)

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from(storageName).getPublicUrl(path)

    return data?.publicUrl
  }

  async function updateFile(
    supabase: SupabaseClient<Database>,
    id: string,
    content: BlobPart,
  ): Promise<string | undefined> {
    const blob = new Blob([content], { type: contentType })

    const path = `${folder}/${id}`

    const { error } = await supabase.storage
      .from(storageName)
      .upload(path, blob, {
        upsert: true,
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage.from(storageName).getPublicUrl(path)

    return data?.publicUrl
  }

  async function removeFile(supabase: SupabaseClient<Database>, id: string) {
    const path = `${folder}/${id}`

    const { error } = await supabase.storage.from(storageName).remove([path])

    if (error) {
      throw error
    }
  }

  return { uploadFile, updateFile, removeFile }
}

export async function removeLogo(
  supabase: SupabaseClient<Database>,
  id: string,
) {
  const path = `logo/${id}`

  const { error } = await supabase.storage
    .from(WEBSITES_STORAGE_NAME)
    .remove([path])

  if (error) {
    throw new Error(error.message)
  }
}

export async function uploadImageStorage(
  supabase: SupabaseClient<Database>,
  id: string,
  content: BlobPart,
  contentType: string,
): Promise<string | undefined> {
  const blob = new Blob([content], { type: contentType })

  const path = `imgs/${id}`

  const { error } = await supabase.storage
    .from(WEBSITES_STORAGE_NAME)
    .upload(path, blob)

  if (error) {
    throw error
  }

  const { data } = supabase.storage
    .from(WEBSITES_STORAGE_NAME)
    .getPublicUrl(path)

  return data?.publicUrl
}
