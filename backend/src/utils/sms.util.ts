import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import config from '../config';

const snsClient = new SNSClient({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKey,
    secretAccessKey: config.aws.secretKey,
  },
});

/**
 * Sends an OTP via AWS SNS SMS to a phone number.
 * @param phone - E.164 format, e.g. "+919876543210"
 * @param otp   - 6-digit OTP string
 */
export const sendPhoneOTP = async (phone: string, otp: string): Promise<boolean> => {
  const message = `Your VedicScan verification code is: ${otp}. Valid for 10 minutes. Do not share this code with anyone.`;

  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional', // ensures delivery priority
        },
        'AWS.SNS.SMS.SenderID': {
          DataType: 'String',
          StringValue: 'VedicScan',   // appears as sender name where supported
        },
      },
    });

    const result = await snsClient.send(command);
    console.log(`[SNS] SMS sent to ${phone}, MessageId: ${result.MessageId}`);
    return true;
  } catch (error) {
    console.error('[SNS] Error sending SMS:', error);
    return false;
  }
};

/**
 * Sends a test SMS via AWS SNS to verify configuration.
 * @param phone - E.164 format, e.g. "+919876543210"
 */
export const sendTestSMS = async (phone: string): Promise<boolean> => {
  const message = `VedicScan AWS SNS Test: Successful! 🚀 System confirms SMS delivery is working correctly at ${new Date().toLocaleTimeString()}.`;

  try {
    const command = new PublishCommand({
      Message: message,
      PhoneNumber: phone,
      MessageAttributes: {
        'AWS.SNS.SMS.SMSType': {
          DataType: 'String',
          StringValue: 'Transactional',
        },
      },
    });

    const result = await snsClient.send(command);
    console.log(`[SNS] Test SMS sent to ${phone}, MessageId: ${result.MessageId}`);
    return true;
  } catch (error) {
    console.error('[SNS] Error sending test SMS:', error);
    return false;
  }
};
