export interface SendEmailRequestBody {
  subscriber_email: string
  template_id: number
}

export async function sendEmailToListmonkUser(
  data: SendEmailRequestBody,
  accessToken: string,
) {
  const resp = await fetch('/api/listmonk/send_listmonk_email', {
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
