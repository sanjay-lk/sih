export {};
const { Router } = require('express');
const Joi = require('joi');
const { AccidentEvent } = require('./models/AccidentEvent');
const { initialNotify } = require('./services/escalation');
const { notifyContacts } = require('./services/notifications');

const router = Router();

const reportSchema = Joi.object({
  userId: Joi.string().required(),
  location: Joi.object({ lat: Joi.number().required(), lng: Joi.number().required() }).required(),
  severityScore: Joi.number().min(0).max(1).required(),
  timestamp: Joi.date().required(),
});

router.post('/report-accident', async (req: any, res: any) => {
  const { error, value } = reportSchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  const { userId, location, severityScore, timestamp } = value;
  const event = await AccidentEvent.create({
    userId,
    severity: severityScore,
    location,
    timestamp,
    acknowledged: false,
    status: 'reported',
  });
  req.app.get('io').emit('hospital-feed', { type: 'NEW_EVENT', payload: event });
  initialNotify(event.id).catch(() => {});
  res.json({ ok: true, eventId: event.id });
});

const notifySchema = Joi.object({
  contacts: Joi.array().items(Joi.object({ name: Joi.string(), phone: Joi.string(), pushToken: Joi.string(), email: Joi.string() })).required(),
  message: Joi.string().required(),
  data: Joi.object().optional(),
});

router.post('/notify-contacts', async (req: any, res: any) => {
  const { error, value } = notifySchema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });
  await notifyContacts(value.contacts, value.message, value.data);
  res.json({ ok: true });
});

router.post('/events/:id/ack', async (req: any, res: any) => {
  const event = await AccidentEvent.findById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  event.acknowledged = true;
  event.status = 'acknowledged';
  await event.save();
  req.app.get('io').emit('hospital-feed', { type: 'UPDATE_EVENT', payload: event });
  res.json({ ok: true });
});

router.post('/events/:id/assign', async (req: any, res: any) => {
  const event = await AccidentEvent.findById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  event.status = 'assigned';
  await event.save();
  req.app.get('io').emit('hospital-feed', { type: 'UPDATE_EVENT', payload: event });
  res.json({ ok: true });
});

router.post('/events/:id/dispatch', async (req: any, res: any) => {
  const event = await AccidentEvent.findById(req.params.id);
  if (!event) return res.status(404).json({ error: 'Not found' });
  event.status = 'dispatched';
  await event.save();
  req.app.get('io').emit('hospital-feed', { type: 'UPDATE_EVENT', payload: event });
  res.json({ ok: true });
});

router.get('/hospital-feed', (_req: any, res: any) => {
  res.json({ ok: true, message: 'Use WebSocket at /socket.io for live feed' });
});

router.get('/events/user/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const events = await AccidentEvent.find({ userId }).sort({ timestamp: -1 });
    res.json({ ok: true, events });
  } catch (error) {
    console.error('Error fetching user events:', error);
    res.status(500).json({ error: 'Failed to fetch user events' });
  }
});

router.get('/events', async (_req: any, res: any) => {
  try {
    const events = await AccidentEvent.find().sort({ timestamp: -1 }).limit(50);
    res.json({ ok: true, events });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

module.exports = router;


