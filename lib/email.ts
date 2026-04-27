import { Resend } from 'resend'
import { createClerkClient } from '@clerk/nextjs/server'

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

async function generateLoveLetter(userName: string): Promise<string> {
  const res = await fetch('https://api.kie.ai/gemini/v1/models/gemini-3-flash-v1betamodels:streamGenerateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.KIE_API_KEY}`,
    },
    body: JSON.stringify({
      stream: false,
      contents: [{
        role: 'user',
        parts: [{ text: `你是一个来自伊藤润二漫画世界的神秘存在，用充满诗意和黑暗美感的语言，给用户${userName}写一段早安问候，50字以内，不要用emoji。` }],
      }],
    }),
  })
  const data = await res.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? `早安 ${userName}，漩涡在等你。`
}

export async function sendWelcomeEmail(userEmail: string, userName: string) {
  await getResend().emails.send({
    from: 'Tomie-fy <hello@bestskills.top>',
    to: userEmail,
    subject: '您有一封来自黑白世界的邀请函',
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <h2>Hi ${userName}，欢迎来到漩涡镇！</h2>
        <p>您在网页端提交的照片已转化成功。我们为您保留了最细腻的排线与最诡谲的影调，请点击下方链接查看您的漫画替身</p>
        <br/>
        <p>—— Tomie-fy</p>
      </div>
    `,
  })
}

export async function sendDailyLoveLetter(userEmail: string, userName: string) {
  const loveLetter = await generateLoveLetter(userName)
  await getResend().emails.send({
    from: 'Tomie-fy <hello@bestskills.top>',
    to: userEmail,
    subject: `早安 ${userName}，今天也想你了`,
    html: `
      <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
        <p>${loveLetter}</p>
        <br/>
        <p>—— Tomie-fy</p>
        <p style="color: #999; font-size: 12px;">
          想来找我玩？<a href="https://bestskills.top">点这里回来找我</a>
        </p>
      </div>
    `,
  })
}

export async function sendDailyLoveLetterToAll() {
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  const { data: users } = await clerk.users.getUserList({ limit: 500 })
  for (const user of users) {
    const email = user.emailAddresses[0]?.emailAddress
    const name = user.firstName || '用户'
    if (!email) continue
    try {
      await sendDailyLoveLetter(email, name)
    } catch (error) {
      console.error(`给 ${email} 发情话失败：`, error)
    }
  }
}
