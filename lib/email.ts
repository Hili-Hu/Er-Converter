import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
) {
  await resend.emails.send({
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
