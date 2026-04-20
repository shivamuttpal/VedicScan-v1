import { Request, Response } from 'express';
import { sendTestEmail } from '../../../utils/mail.util';
import { sendTestSMS } from '../../../utils/sms.util';

export const testEmail = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  if (!email) {
    res.status(400).json({
      success: false,
      message: 'Email is required',
    });
    return;
  }

  const result = await sendTestEmail(email);

  if (result) {
    res.json({
      success: true,
      message: `Test email sent successfully to ${email}. Please check your inbox and spam folder.`,
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send test email. Check server logs for details.',
    });
  }
};

export const testPhone = async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;

  if (!phone) {
    res.status(400).json({
      success: false,
      message: 'Phone number is required (E.164 format, e.g., +919876543210)',
    });
    return;
  }

  const result = await sendTestSMS(phone);

  if (result) {
    res.json({
      success: true,
      message: `Test SMS sent successfully to ${phone}.`,
    });
  } else {
    res.status(500).json({
      success: false,
      message: 'Failed to send test SMS. Check server logs for details.',
    });
  }
};
