const nodemailer = require('nodemailer')

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
})

const from = `"The Duel 💸" <${process.env.SMTP_EMAIL}>`

// API-based mail senders for platforms like Render
const sendEmailViaResend = async ({ to, subject, html }) => {
  const apiKey = process.env.RESEND_API_KEY
  const fromEmail = process.env.SMTP_EMAIL || 'onboarding@resend.dev'
  const from = process.env.RESEND_FROM || `"The Duel 💸" <${fromEmail}>`

  console.log(`[RESEND API] Sending email to ${to}...`)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject,
      html,
    })
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.message || `Resend API failed with status ${response.status}`)
  }
  return data
}

const sendEmailViaSendGrid = async ({ to, subject, html }) => {
  const apiKey = process.env.SENDGRID_API_KEY
  const fromEmail = process.env.SMTP_EMAIL || 'noreply@theduel.com'

  console.log(`[SENDGRID API] Sending email to ${to}...`)
  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: fromEmail, name: 'The Duel 💸' },
      subject,
      content: [{ type: 'text/html', value: html }],
    })
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new Error(`SendGrid API failed with status ${response.status}: ${text}`)
  }
}

const sendGenericMail = async ({ to, subject, html }) => {
  if (process.env.RESEND_API_KEY) {
    await sendEmailViaResend({ to, subject, html })
  } else if (process.env.SENDGRID_API_KEY) {
    await sendEmailViaSendGrid({ to, subject, html })
  } else {
    // Fallback to standard SMTP
    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    })
  }
}


const otpBox = (otp) => `
  <div style="background:#1a1a1a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #2e2e2e;">
    <p style="color:#a3a3a3;font-size:13px;margin:0 0 8px;">Your one-time code (valid 10 minutes)</p>
    <span style="font-size:42px;font-weight:800;letter-spacing:12px;color:#06C167;font-family:monospace;">${otp}</span>
  </div>
`

const wrapper = (content) => `
  <div style="font-family:'Inter',sans-serif;max-width:480px;margin:auto;padding:32px;background:#0a0a0a;color:#f5f5f5;border-radius:16px;border:1px solid #1a1a1a;">
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
      <span style="font-size:28px;">💸</span>
      <span style="font-size:18px;font-weight:800;color:#06C167;letter-spacing:-0.5px;">The Duel</span>
    </div>
    ${content}
    <p style="color:#4a4a4a;font-size:11px;margin-top:32px;border-top:1px solid #1a1a1a;padding-top:16px;">
      If you didn't request this, you can safely ignore this email.
    </p>
  </div>
`

/* ── OTP email (registration + password reset) ── */
exports.sendOtpEmail = async (email, name, otp, isReset = false) => {
  const subject = isReset ? 'Reset your password — The Duel' : 'Verify your account — The Duel'
  const headline = isReset ? 'Password Reset' : `Hey ${name}! 👋`
  const body     = isReset
    ? `<p style="color:#a3a3a3;margin-bottom:4px;">Use this OTP to reset your password.</p>`
    : `<p style="color:#a3a3a3;margin-bottom:4px;">Thanks for joining! Enter this code in the app to verify your email and set up your couple.</p>`

  // Always log OTP in console for easy development testing
  console.log('\n----------------------------------------')
  console.log(`🔑 [OTP EMAIL] To: ${email} | OTP: ${otp}`)
  console.log('----------------------------------------\n')

  try {
    await sendGenericMail({
      to: email,
      subject,
      html: wrapper(`
        <h2 style="color:#f5f5f5;margin:0 0 8px;font-size:22px;">${headline}</h2>
        ${body}
        ${otpBox(otp)}
        <p style="color:#737373;font-size:12px;">This code expires in <strong style="color:#f5f5f5;">10 minutes</strong>.</p>
      `),
    })
  } catch (err) {
    console.error(`❌ Failed to send email: ${err.message}`)
    // If we are in local development, don't fail the request so we can use the console OTP
    if (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      console.log('⚠️ Continuing registration response because we are in development mode.')
      return
    }
    throw err
  }
}

/* ── Partner invite email ── */
exports.sendInviteEmail = async (toEmail, fromName, coupleName, inviteCode) => {
  try {
    await sendGenericMail({
      to: toEmail,
      subject: `${fromName} invited you to The Duel 💸`,
      html: wrapper(`
        <h2 style="color:#f5f5f5;margin:0 0 8px;font-size:22px;">You've been invited! 💌</h2>
        <p style="color:#a3a3a3;margin-bottom:4px;">
          <strong style="color:#f5f5f5;">${fromName}</strong> wants you to track expenses together in
          <strong style="color:#f5f5f5;">${coupleName}</strong>.
        </p>
        <p style="color:#a3a3a3;margin-bottom:0;">Sign up and use this invite code to join:</p>
        <div style="background:#1a1a1a;border-radius:12px;padding:24px;text-align:center;margin:24px 0;border:1px solid #2e2e2e;">
          <p style="color:#a3a3a3;font-size:13px;margin:0 0 8px;">Invite Code</p>
          <span style="font-size:36px;font-weight:800;letter-spacing:10px;color:#06C167;font-family:monospace;">${inviteCode}</span>
        </div>
        <a href="${process.env.CLIENT_URL}/register"
           style="display:inline-block;padding:12px 28px;background:#06C167;color:#fff;border-radius:999px;text-decoration:none;font-weight:700;font-size:15px;">
          Join Now
        </a>
      `),
    })
  } catch (err) {
    console.error(`❌ Failed to send invite email: ${err.message}`)
  }
}

/* ── Password reset email (old link-based — kept for compatibility) ── */
exports.sendPasswordResetEmail = exports.sendOtpEmail
