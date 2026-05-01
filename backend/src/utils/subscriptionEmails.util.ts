/**
 * Subscription Lifecycle Email Templates
 * 
 * Beautiful, branded emails for:
 * 1. Subscription expiring soon (3 days before)
 * 2. Subscription expired
 * 
 * All emails include an unsubscribe link and respect emailUnsubscribed flag.
 */

import { PLAN_DISPLAY_NAMES } from '../config/plans';

const UNSUBSCRIBE_URL = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL}/unsubscribe`
  : 'https://vedicscan.com/unsubscribe';

const RESUBSCRIBE_URL = process.env.FRONTEND_URL
  ? `${process.env.FRONTEND_URL}/subscription`
  : 'https://vedicscan.com/subscription';

/**
 * Shared footer with unsubscribe link
 */
const emailFooter = (unsubscribeToken: string) => `
  <!-- Footer -->
  <div style="background: #f9fafb; padding: 24px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
    <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af;">© ${new Date().getFullYear()} VedicScan · All rights reserved</p>
    <p style="margin: 0; font-size: 11px; color: #b0b0b0;">
      You're receiving this because you have a VedicScan account.<br>
      <a href="${UNSUBSCRIBE_URL}?token=${unsubscribeToken}" style="color: #9ca3af; text-decoration: underline;">Unsubscribe from subscription emails</a>
    </p>
  </div>
`;

/**
 * Email: Your subscription is expiring soon (sent ~3 days before expiry)
 */
export const getExpiryWarningEmailHtml = (
  firstName: string,
  planName: string,
  expiryDate: Date,
  unsubscribeToken: string
): string => {
  const displayPlan = PLAN_DISPLAY_NAMES[planName] || planName;
  const formattedDate = expiryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 40px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">⏳ Subscription Ending Soon</h1>
      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.9); font-size: 16px;">Don't lose your premium benefits</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: #1f2937;">Namaste, ${firstName}! 🙏</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
        Your <strong style="color: #d97706;">${displayPlan}</strong> plan is expiring on <strong>${formattedDate}</strong>.
        After this date, your account will switch to the Free plan and you'll lose access to:
      </p>

      <!-- What you'll lose -->
      <div style="background: #fef3c7; border-radius: 10px; padding: 20px; margin: 24px 0; border-left: 4px solid #f59e0b;">
        <ul style="margin: 0; padding: 0 0 0 18px; color: #92400e; font-size: 14px; line-height: 2;">
          <li>Extended daily question limits</li>
          <li>Priority AI responses</li>
          <li>Advanced predictions & insights</li>
          <li>Full chat history retention</li>
        </ul>
      </div>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
        Renew now to keep your uninterrupted access to our AI astrologers and all the features you love.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${RESUBSCRIBE_URL}" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(245,158,11,0.4);">
          Renew My Plan →
        </a>
      </div>

      <p style="color: #9ca3af; font-size: 13px; text-align: center;">
        Questions? Just reply to this email — we're here to help.
      </p>
    </div>

    ${emailFooter(unsubscribeToken)}
  </div>
  `;
};

/**
 * Email: Your subscription has expired
 */
export const getExpiredEmailHtml = (
  firstName: string,
  planName: string,
  unsubscribeToken: string
): string => {
  const displayPlan = PLAN_DISPLAY_NAMES[planName] || planName;

  return `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #7B1A38 0%, #4a0d22 100%); padding: 40px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">Subscription Ended</h1>
      <p style="margin: 10px 0 0; color: rgba(255,255,255,0.8); font-size: 16px;">We miss you already 💫</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="margin: 0 0 16px; font-size: 22px; color: #1f2937;">Namaste, ${firstName}! 🙏</h2>
      <p style="color: #4b5563; font-size: 15px; line-height: 1.7; margin-bottom: 16px;">
        Your <strong style="color: #7B1A38;">${displayPlan}</strong> subscription has ended. Your account has been moved to the <strong>Free</strong> plan.
      </p>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
        You can still use VedicScan with limited daily questions, but you're missing out on:
      </p>

      <!-- What you're missing -->
      <div style="background: #fdf2f8; border-radius: 10px; padding: 20px; margin: 24px 0; border: 1px solid #fbcfe8;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 8px 0; color: #9ca3af; font-size: 14px;">Free Plan</td>
            <td style="padding: 8px 0; text-align: right; color: #6b7280; font-size: 14px;">3 questions/day</td>
          </tr>
          <tr style="border-top: 1px solid #fce7f3;">
            <td style="padding: 8px 0; color: #7B1A38; font-size: 14px; font-weight: 600;">${displayPlan} Plan</td>
            <td style="padding: 8px 0; text-align: right; color: #7B1A38; font-weight: 600; font-size: 14px;">${planName === 'premium' ? '51' : '11'} questions/day</td>
          </tr>
        </table>
      </div>

      <p style="color: #4b5563; font-size: 15px; line-height: 1.7;">
        The stars haven't stopped guiding you. Get back your full access to our AI astrologers and continue your cosmic journey.
      </p>

      <!-- CTA -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${RESUBSCRIBE_URL}" style="display: inline-block; background: linear-gradient(135deg, #7B1A38, #a02050); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 14px rgba(123,26,56,0.4);">
          Resubscribe Now →
        </a>
      </div>

      <!-- Special offer -->
      <div style="background: linear-gradient(135deg, #fdf2f8, #fce7f3); border-radius: 10px; padding: 20px; margin: 24px 0; text-align: center;">
        <p style="margin: 0; color: #7B1A38; font-size: 14px; font-weight: 600;">
          🎁 Come back within 7 days and your chat history will still be preserved!
        </p>
      </div>

      <p style="color: #9ca3af; font-size: 13px; text-align: center;">
        Questions? Just reply to this email — our team is always here for you.
      </p>
    </div>

    ${emailFooter(unsubscribeToken)}
  </div>
  `;
};

/**
 * Subject lines for lifecycle emails
 */
export const LIFECYCLE_SUBJECTS = {
  expiryWarning: (planName: string) => 
    `⏳ Your VedicScan ${PLAN_DISPLAY_NAMES[planName] || planName} plan expires soon`,
  expired: (planName: string) => 
    `Your VedicScan ${PLAN_DISPLAY_NAMES[planName] || planName} subscription has ended`,
};
