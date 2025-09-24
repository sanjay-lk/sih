export {};
const { AccidentEvent } = require('../models/AccidentEvent');
const { notifyContacts } = require('./notifications');

// In-memory contact directory for demo
const userIdToContacts: Record<string, { name: string; phone?: string; pushToken?: string }[]> = {
  demo_user: [
    { name: 'Alice', phone: '+15555550123' },
    { name: 'Bob', pushToken: 'demo_token' },
  ],
};

async function initialNotify(eventId: string): Promise<void> {
  const event = await AccidentEvent.findById(eventId);
  if (!event) return;
  const contacts = userIdToContacts[event.userId] || [];
  const message = `Accident detected. Severity ${Math.round(event.severity * 100)}%. Location: https://maps.google.com/?q=${event.location.lat},${event.location.lng}`;
  await notifyContacts(contacts, message, { eventId: event.id });
  event.status = 'notified';
  event.contactsNotifiedAt = new Date();
  await event.save();
}

async function maybeEscalate(eventId: string): Promise<void> {
  const event = await AccidentEvent.findById(eventId);
  if (!event || event.acknowledged) return;
  const notifiedAt = event.contactsNotifiedAt?.getTime() ?? 0;
  const twoMinutes = 2 * 60 * 1000;
  if (Date.now() - notifiedAt >= twoMinutes) {
    // Escalate to hospitals/police (stub)
    console.log(`[escalation] Escalating event ${eventId} to hospital/police`);
    event.status = 'escalated';
    event.escalatedAt = new Date();
    await event.save();
  }
}

module.exports = { initialNotify, maybeEscalate };


