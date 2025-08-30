export const getCookie = (name: string) => {
  const matches = document.cookie.match(
    new RegExp(
      '(?:^|; )' +
        name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
        '=([^;]*)',
    ),
  )
  return matches ? decodeURIComponent(matches[1]) : undefined
}

export const deleteCookie = (name: string) => {
  document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;'
}

export const setCookie = (name: string, value: string, days: number) => {
  let expires = ''
  if (days) {
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    expires = '; expires=' + date.toUTCString()
  }

  // Add security attributes for sensitive cookies
  const isSecure = window.location.protocol === 'https:'
  const secureAttr = isSecure ? '; Secure' : ''
  const sameSiteAttr = '; SameSite=Lax'

  document.cookie =
    name +
    '=' +
    (value || '') +
    expires +
    '; path=/' +
    secureAttr +
    sameSiteAttr
}
