import { Webhook } from 'svix'
import { headers } from 'next/headers'
import { sendWelcomeEmail } from '@/lib/email'

export async function POST(req: Request) {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return new Response('Missing secret', { status: 400 })

  const headerPayload = await headers()
  const svix_id = headerPayload.get('svix-id')
  const svix_timestamp = headerPayload.get('svix-timestamp')
  const svix_signature = headerPayload.get('svix-signature')
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response('Missing svix headers', { status: 400 })
  }

  const payload = await req.json()
  const body = JSON.stringify(payload)
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: { type: string; data: { email_addresses: { email_address: string }[]; first_name: string } }
  try {
    evt = wh.verify(body, { 'svix-id': svix_id, 'svix-timestamp': svix_timestamp, 'svix-signature': svix_signature }) as typeof evt
  } catch {
    return new Response('Invalid signature', { status: 400 })
  }

  if (evt.type === 'user.created') {
    const email = evt.data.email_addresses[0]?.email_address
    const name = evt.data.first_name || '用户'
    if (email) await sendWelcomeEmail(email, name)
  }

  return new Response('OK', { status: 200 })
}
