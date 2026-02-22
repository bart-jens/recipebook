import { Resend } from "resend";

function getResend() {
  return new Resend(process.env.RESEND_API_KEY);
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://eefeats.com";

export async function sendInviteEmail(
  to: string,
  code: string,
  inviterName: string
) {
  const signupUrl = `${APP_URL}/signup?code=${code}`;

  const html = `
    <div style="font-family: 'Inter Tight', system-ui, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px;">
      <h1 style="font-family: Georgia, serif; font-size: 28px; font-weight: 400; color: #1a1a1a; margin: 0 0 8px;">
        EefEats
      </h1>
      <p style="color: #6B7280; font-size: 14px; margin: 0 0 32px;">
        You've been invited to join
      </p>
      <p style="color: #1a1a1a; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        ${inviterName} invited you to EefEats, a place to collect, cook, and share recipes with friends.
      </p>
      <div style="background: #F1F5F9; border-radius: 8px; padding: 20px; text-align: center; margin: 0 0 24px;">
        <p style="color: #6B7280; font-size: 12px; letter-spacing: 0.02em; margin: 0 0 8px;">
          Your invite code
        </p>
        <p style="font-size: 24px; font-weight: 400; color: #8B4513; letter-spacing: 0.02em; margin: 0;">
          ${code}
        </p>
      </div>
      <a href="${signupUrl}" style="display: block; background: #8B4513; color: white; text-decoration: none; text-align: center; padding: 14px 24px; border-radius: 8px; font-size: 16px; font-weight: 400;">
        Sign up now
      </a>
      <p style="color: #9CA3AF; font-size: 12px; text-align: center; margin: 24px 0 0;">
        Or visit ${APP_URL}/signup and enter the code above.
      </p>
    </div>
  `;

  await getResend().emails.send({
    from: "EefEats <invites@eefeats.com>",
    to,
    subject: `${inviterName} invited you to EefEats`,
    html,
  });
}
