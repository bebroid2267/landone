async function uploadFile(id: string, content: string) {
  try {
    const url = '/api/uploadTextFile'
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, content }),
    })
    const data = (await response.json()) as string
    return data
  } catch (error) {
    // @ts-ignore
    console.error('Error when load file:', error.message)
  }
}

export async function updateFileR2OrSupabase(
  dataUrl: string,
  websiteDataStr: string,
) {
  try {
    const fileId = dataUrl.split('/').pop()
    if (fileId) {
      await uploadFile(fileId, websiteDataStr)
    }
  } catch (err) {
    // @ts-ignore
    throw new Error(err)
  }
}
