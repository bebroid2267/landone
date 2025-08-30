export async function handleImageDownload(
  imageUrl: string,
  filename: string,
  showToast?: (message: string, type: 'success' | 'error') => void,
) {
  try {
    const apiUrl = `/api/images/download?url=${encodeURIComponent(imageUrl)}`
    const response = await fetch(apiUrl)

    if (!response.ok) {
      throw new Error('Download failed')
    }

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url

    // Create filename preserving all Unicode characters
    let safeFilename = filename.slice(0, 30).trim()
    // Replace only characters that are unsafe for file systems
    safeFilename = safeFilename.replace(/[/\\?%*:|"<>]/g, '_')
    a.download = `${safeFilename}.png`

    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)

    if (showToast) {
      showToast('Image download started', 'success')
    }
  } catch (error) {
    console.error('Error downloading image:', error)
    if (showToast) {
      showToast('Failed to download image', 'error')
    }
  }
}
