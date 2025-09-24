export {};
const dotenv = require('dotenv');
dotenv.config();

const twilioPkg = require('twilio');
const admin = require('firebase-admin');

let twilioClient: ReturnType<typeof twilioPkg> | null = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilioPkg(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

if (!admin.apps.length && process.env.FIREBASE_PROJECT_ID) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      } as any),
    });
  } catch (e) {
    // noop for stub
  }
}

type Contact = { name: string; phone?: string; pushToken?: string; email?: string };

async function sendSms(to: string, body: string): Promise<void> {
  if (!twilioClient || !process.env.TWILIO_FROM_NUMBER) {
    console.log(`[stub] SMS to ${to}: ${body}`);
    return;
  }
  await twilioClient.messages.create({ to, from: process.env.TWILIO_FROM_NUMBER, body });
}

async function sendPush(tokens: string[], title: string, body: string, data?: Record<string, string>): Promise<void> {
  if (!admin.apps.length) {
    console.log(`[stub] Push`, { tokens, title, body, data });
    return;
  }
  const message = {
    tokens,
    notification: { title, body },
    data,
  };
  await admin.messaging().sendEachForMulticast(message as any);
}

async function notifyContacts(contacts: Contact[], message: string, pushData?: Record<string, string>): Promise<void> {
  const smsTargets = contacts.filter(c => c.phone && c.phone.trim()).map(c => c.phone!)
  const pushTargets = contacts.filter(c => c.pushToken && c.pushToken.trim()).map(c => c.pushToken!)
  await Promise.all([
    ...smsTargets.map(num => sendSms(num, message)),
    pushTargets.length ? sendPush(pushTargets, 'Accident Alert', message, pushData) : Promise.resolve(),
  ]);
}

module.exports = { sendSms, sendPush, notifyContacts };


