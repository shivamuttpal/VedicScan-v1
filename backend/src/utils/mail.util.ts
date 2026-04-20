import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import nodemailer from 'nodemailer';
import config from '../config';

const sesClient = new SESClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKey,
    secretAccessKey: config.aws.secretKey,
  },
});

/* ─────────────────────────────────────────────────── */
/*  Nodemailer Fallback Configuration                  */
/* ─────────────────────────────────────────────────── */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: config.mail.user,
    pass: config.mail.pass,
  },
});

let lastSESFailureNotificationDate: string | null = null;

const notifyAdminOfSESFailure = async (error: any) => {
  const adminEmail = 'contact@vedicscan.com';
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  if (lastSESFailureNotificationDate !== today) {
    try {
      await transporter.sendMail({
        from: `"VedicScan System" <${config.mail.user}>`,
        to: adminEmail,
        subject: '⚠️ URGENT: AWS SES Email Failed - Fallback Activated',
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h2 style="color: #ef4444;">AWS SES Delivery Failure</h2>
            <p>The VedicScan backend encountered an error while trying to send an email via AWS SES. The system has automatically fallen back to the Nodemailer SMTP service.</p>
            <p><strong>Time:</strong> ${new Date().toISOString()}</p>
            <p><strong>Error Details:</strong></p>
            <pre style="background: #f1f5f9; padding: 15px; border-radius: 5px; overflow-x: auto;">${((error && error.message) ? error.message : JSON.stringify(error))}</pre>
            <p style="margin-top: 20px; font-size: 12px; color: #64748b;">This notification is sent only once per day to prevent spam.</p>
          </div>
        `
      });
      lastSESFailureNotificationDate = today;
      console.log('[MAIL] Admin notified of SES failure.');
    } catch (adminErr) {
      console.error('[MAIL] Failed to notify admin of SES failure:', adminErr);
    }
  }
};

const sendFallbackEmail = async (to: string, subject: string, html: string): Promise<boolean> => {
  try {
    await transporter.sendMail({
      from: `"VedicScan" <${config.mail.user}>`,
      to,
      subject,
      html
    });
    console.log('[Nodemailer] Fallback email sent successfully to:', to);
    return true;
  } catch (error) {
    console.error('[Nodemailer] Fallback email failed:', error);
    return false;
  }
};

/* ─────────────────────────────────────────────────── */
/*  Account Verification OTP                           */
/* ─────────────────────────────────────────────────── */
export const sendSignupVerificationEmail = async (email: string, otp: string): Promise<boolean> => {
  const subject = 'Verify your VedicScan account';
  const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 36px 40px; text-align: center;">
          <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700; letter-spacing: 1px;">✨ VedicScan</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.85); font-size: 15px;">Your Cosmic Journey Begins</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="margin: 0 0 10px; font-size: 22px; color: #1f2937;">Welcome! Please verify your email</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
            Thank you for creating a VedicScan account. Enter the code below in the app to activate your account.
          </p>

          <!-- OTP Box -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #fffbeb; border: 2px dashed #f59e0b; border-radius: 10px; padding: 16px 32px;">
              <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #d97706;">${otp}</span>
            </div>
            <p style="margin: 14px 0 0; color: #9ca3af; font-size: 13px;">⏱ Valid for <strong>10 minutes</strong></p>
          </div>

          <div style="background: #f3f4f6; border-left: 4px solid #f59e0b; border-radius: 6px; padding: 14px 18px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #4b5563;">
              🔒 <strong>Security tip:</strong> VedicScan will never ask for this code over the phone or email. Don't share it with anyone.
            </p>
          </div>

          <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">
            If you didn't create a VedicScan account, you can safely ignore this email.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} VedicScan · All rights reserved</p>
        </div>
      </div>
    `;

  const params = {
    Source: `"VedicScan" <${config.aws.sourceEmail}>`,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log('[SES] Signup verification email sent, MessageId:', result.MessageId);
    return true;
  } catch (error) {
    console.error('[SES] Error sending signup verification email:', error);
    notifyAdminOfSESFailure(error);
    return sendFallbackEmail(email, subject, html);
  }
};

/* ─────────────────────────────────────────────────── */
/*  Password Reset OTP                                 */
/* ─────────────────────────────────────────────────── */
export const sendOTPEmail = async (email: string, otp: string): Promise<boolean> => {
  const subject = 'Reset your VedicScan password';
  const html = `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #1f2937 0%, #374151 100%); padding: 36px 40px; text-align: center;">
          <h1 style="margin: 0; color: #f59e0b; font-size: 28px; font-weight: 700; letter-spacing: 1px;">🔐 VedicScan</h1>
          <p style="margin: 8px 0 0; color: rgba(255,255,255,0.6); font-size: 15px;">Account Security</p>
        </div>

        <!-- Body -->
        <div style="padding: 40px;">
          <h2 style="margin: 0 0 10px; font-size: 22px; color: #1f2937;">Password Reset Request</h2>
          <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 30px;">
            We received a request to reset the password for your VedicScan account. Use the code below to proceed. This code expires in 10 minutes.
          </p>

          <!-- OTP Box -->
          <div style="text-align: center; margin: 32px 0;">
            <div style="display: inline-block; background: #1f2937; border-radius: 10px; padding: 16px 32px;">
              <span style="font-size: 38px; font-weight: 800; letter-spacing: 10px; color: #f59e0b;">${otp}</span>
            </div>
            <p style="margin: 14px 0 0; color: #9ca3af; font-size: 13px;">⏱ Valid for <strong>10 minutes</strong></p>
          </div>

          <div style="background: #fef2f2; border-left: 4px solid #ef4444; border-radius: 6px; padding: 14px 18px; margin: 24px 0;">
            <p style="margin: 0; font-size: 13px; color: #b91c1c;">
              ⚠️ <strong>Didn't request this?</strong> If you did not ask for a password reset, your account may be at risk. Please change your password immediately.
            </p>
          </div>

          <p style="font-size: 13px; color: #9ca3af; margin-top: 24px;">
            For security, this link was only requested from <strong>${email}</strong>. Do not share this code with anyone.
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="margin: 0; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} VedicScan · All rights reserved</p>
        </div>
      </div>
    `;

  const params = {
    Source: `"VedicScan" <${config.aws.sourceEmail}>`,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log('[SES] Password reset email sent, MessageId:', result.MessageId);
    return true;
  } catch (error) {
    console.error('[SES] Error sending password reset email:', error);
    notifyAdminOfSESFailure(error);
    return sendFallbackEmail(email, subject, html);
  }
};

/* ─────────────────────────────────────────────────── */
/*  System Diagnostic Test Email                       */
/* ─────────────────────────────────────────────────── */
export const sendTestEmail = async (email: string): Promise<boolean> => {
  const subject = '✅ AWS SES Configuration Test - VedicScan';
  const html = `
      <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
        <h2 style="color: #059669;">SES Connection Successful!</h2>
        <p>This is a test email sent from the <strong>VedicScan</strong> backend to verify that your AWS SES integration is working correctly.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="font-size: 12px; color: #666;">
          <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
          <strong>Environment:</strong> ${config.env}
        </p>
      </div>
    `;

  const params = {
    Source: `"VedicScan Support" <${config.aws.sourceEmail}>`,
    Destination: { ToAddresses: [email] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: { Html: { Data: html, Charset: 'UTF-8' } },
    },
  };

  try {
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log('[SES] Test email sent, MessageId:', result.MessageId);
    return true;
  } catch (error) {
    console.error('[SES] Error sending test email:', error);
    notifyAdminOfSESFailure(error);
    return sendFallbackEmail(email, subject, html);
  }
};

