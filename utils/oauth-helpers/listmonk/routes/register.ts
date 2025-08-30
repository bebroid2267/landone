export interface RegisterUserRequestBody {
  email: string
  name: string
  lists: number[]
}

export async function registerListmonkUser(
  data: RegisterUserRequestBody,
  accessToken: string,
): Promise<boolean> {
  const resp = await fetch('/api/listmonk/register_listmonk_email', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(data),
  })

  if (resp.ok) {
    return true
  }
  return false
}
