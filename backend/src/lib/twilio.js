import twilio from 'twilio';

export function canSendSms() {
  const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM;
  return Boolean(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && from);
}

export async function sendSms({ to, body }) {
  if (!canSendSms()) {
    throw new Error('Twilio is not configured');
  }

  const from = process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM;
  const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  return client.messages.create({
    from,
    to,
    body,
  });
}
