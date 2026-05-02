const nodemailer = require('nodemailer');

// create transporter lazily so env vars are guaranteed to be loaded
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    _transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return _transporter;
}

// send OTP verification email
async function sendOTPEmail(to, otp, purpose) {
  const subjects = {
    register: 'Verify your TaskFlow account',
    login: 'Your TaskFlow login verification code',
    reset: 'Reset your TaskFlow password'
  };

  const messages = {
    register: `Thanks for signing up! Use the code below to verify your email and activate your account.`,
    login: `We noticed a login attempt on your account. Use this code to complete your sign-in.`,
    reset: `You requested a password reset. Use the code below to set a new password.`
  };

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
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: subjects[purpose],
      html: htmlBody
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
    console.error('SMTP config:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      user: process.env.SMTP_USER ? '***set***' : '***MISSING***',
      pass: process.env.SMTP_PASS ? '***set***' : '***MISSING***',
      from: process.env.SMTP_FROM || '***MISSING***'
    });
    throw err;
  }
}

// send welcome email after account activation
async function sendWelcomeEmail(to, name) {
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
    await getTransporter().sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: `Welcome to TaskFlow, ${name}!`,
      html: htmlBody
    });
  } catch (err) {
    console.error('Welcome email failed:', err.message);
    // don't rethrow — welcome email is non-critical
  }
}

module.exports = { sendOTPEmail, sendWelcomeEmail };
