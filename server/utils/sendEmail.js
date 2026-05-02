// SendGrid (Twilio) HTTP API for sending emails
// Uses HTTPS (port 443) which works on Railway and all hosting platforms

const sgMail = require('@sendgrid/mail');

// Initialize SendGrid with API key
function initSendGrid() {
  const apiKey = process.env.SENDGRID_API_KEY;
  if (!apiKey) {
    console.warn('⚠️  SENDGRID_API_KEY not set — emails will be logged to console only');
    return false;
  }
  sgMail.setApiKey(apiKey);
  return true;
}

// Sender email — must match verified sender in SendGrid dashboard
const SENDER_EMAIL = '2200040029ece@gmail.com';
const SENDER_NAME = 'TaskFlow';

async function sendEmailViaSendGrid(to, subject, htmlContent, textContent) {
  const isReady = initSendGrid();

  if (!isReady) {
    console.log(`📧 [DRY RUN] Would send to: ${to} | Subject: ${subject}`);
    return { dryRun: true };
  }

  const msg = {
    to: to,
    from: { email: SENDER_EMAIL, name: SENDER_NAME },
    replyTo: { email: SENDER_EMAIL, name: SENDER_NAME },
    subject: subject,
    // Both text and html reduce spam score significantly
    text: textContent || subject,
    html: htmlContent,
    // Mail settings to improve deliverability
    mailSettings: {
      bypassListManagement: { enable: false },
      sandboxMode: { enable: false }
    },
    // Tracking settings — disable click tracking to avoid spam triggers
    trackingSettings: {
      clickTracking: { enable: false, enableText: false },
      openTracking: { enable: false },
      subscriptionTracking: { enable: false }
    }
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log(`✅ Email sent via SendGrid to ${to} — status: ${response.statusCode}`);
    return response;
  } catch (err) {
    const body = err.response?.body;
    const errMsg = body?.errors?.map(e => e.message).join(', ') || err.message;
    console.error(`❌ SendGrid error: ${errMsg}`);
    if (body) console.error('SendGrid response body:', JSON.stringify(body, null, 2));
    throw new Error(errMsg);
  }
}

// send OTP verification email
async function sendOTPEmail(to, otp, purpose) {
  const subjects = {
    register: 'Your TaskFlow verification code',
    login: 'Your TaskFlow login code',
    reset: 'Your TaskFlow password reset code'
  };

  const messages = {
    register: `Thanks for signing up! Use the code below to verify your email and activate your account.`,
    login: `Use this code to complete your sign-in to TaskFlow.`,
    reset: `You requested a password reset. Use the code below to set a new password.`
  };

  // Plain text version (reduces spam score)
  const textBody = `${SENDER_NAME}\n\n${messages[purpose]}\n\nYour verification code: ${otp}\n\nThis code expires in 15 minutes. Do not share it with anyone.\n\nIf you did not request this, you can safely ignore this email.`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: #635bff; margin-bottom: 8px;">TaskFlow</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.6;">${messages[purpose]}</p>
      <div style="text-align: center; margin: 28px 0;">
        <span style="display: inline-block; font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #1a1a2e; background: #e8e6ff; padding: 16px 32px; border-radius: 8px;">
          ${otp}
        </span>
      </div>
      <p style="color: #888; font-size: 13px;">This code expires in <strong>15 minutes</strong>. Do not share it with anyone.</p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 20px 0;" />
      <p style="color: #aaa; font-size: 12px;">If you did not request this, you can safely ignore this email.</p>
    </div>
  `;

  try {
    await sendEmailViaSendGrid(to, subjects[purpose], htmlBody, textBody);
    console.log(`📨 OTP email delivered to ${to} [${purpose}]`);
  } catch (err) {
    console.error(`OTP email to ${to} failed: ${err.message}`);
    console.log(`[FALLBACK] OTP for ${to} [${purpose}]: ${otp} — email delivery failed, check SendGrid settings`);
    // don't rethrow so the login/register flow still continues
  }
}

// send welcome email after account activation
async function sendWelcomeEmail(to, name) {
  const textBody = `Welcome to TaskFlow!\n\nHi ${name},\n\nYour account has been created and verified successfully. You are now part of TaskFlow — a collaborative platform for managing team projects and tracking tasks efficiently.\n\nWhat you can do now:\n- Create and manage projects\n- Add team members to collaborate\n- Assign tasks with priorities and deadlines\n- Track progress on your dashboard\n\nLog in anytime and start organizing your team's workflow.`;

  const htmlBody = `
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px; background: #f8f9fa; border-radius: 12px;">
      <h2 style="color: #635bff; margin-bottom: 4px;">Welcome to TaskFlow!</h2>
      <p style="color: #555; font-size: 15px; line-height: 1.7; margin-top: 16px;">
        Hi <strong>${name}</strong>,
      </p>
      <p style="color: #555; font-size: 15px; line-height: 1.7;">
        Your account has been created and verified successfully. You are now part of TaskFlow — a collaborative platform for managing team projects and tracking tasks efficiently.
      </p>
      <div style="background: #eef0ff; border-left: 4px solid #635bff; padding: 16px 20px; border-radius: 6px; margin: 24px 0;">
        <p style="color: #333; font-size: 14px; margin: 0 0 8px 0; font-weight: 600;">What you can do now:</p>
        <ul style="color: #555; font-size: 14px; margin: 0; padding-left: 18px; line-height: 1.8;">
          <li>Create and manage projects</li>
          <li>Add team members to collaborate</li>
          <li>Assign tasks with priorities and deadlines</li>
          <li>Track progress on your dashboard</li>
        </ul>
      </div>
      <p style="color: #555; font-size: 15px; line-height: 1.7;">
        Log in anytime and start organizing your team's workflow.
      </p>
      <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 24px 0;" />
      <p style="color: #aaa; font-size: 12px;">This is an automated message from TaskFlow. No reply needed.</p>
    </div>
  `;

  try {
    await sendEmailViaSendGrid(to, `Welcome to TaskFlow, ${name}!`, htmlBody, textBody);
  } catch (err) {
    console.error('Welcome email failed:', err.message);
    // don't rethrow — welcome email is non-critical
  }
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
