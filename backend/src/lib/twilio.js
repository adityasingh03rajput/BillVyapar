import twilio from 'twilio';

export function canSendSms() {
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM);
}

export async function sendSms({ to, body }) {
  if (!canSendSms()) {
    throw new Error('Twilio is not configured');
  }

  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({
    from: process.env.TWILIO_FROM,
    to,
    body,
  });
}
