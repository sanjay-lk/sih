export {};
const { Router } = require('express');
const Joi = require('joi');
const { AccidentEvent } = require('./models/AccidentEvent');
const { User } = require('./models/User');
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

// User Authentication and Management Routes
const userRegistrationSchema = Joi.object({
  userId: Joi.string().required(),
  email: Joi.string().email().required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  userType: Joi.string().valid('driver', 'hospital', 'admin').default('driver'),
  licenseNumber: Joi.string().optional(),
  vehicleInfo: Joi.object({
    make: Joi.string(),
    model: Joi.string(),
    year: Joi.number(),
    plateNumber: Joi.string()
  }).optional(),
  hospitalName: Joi.string().optional(),
  department: Joi.string().optional(),
  hospitalId: Joi.string().optional(),
  emergencyContacts: Joi.array().items(Joi.object({
    name: Joi.string().required(),
    phone: Joi.string().required(),
    email: Joi.string().email().optional(),
    relationship: Joi.string().required(),
    isPrimary: Joi.boolean().default(false)
  })).optional()
});

router.post('/auth/register', async (req: any, res: any) => {
  try {
    const { error, value } = userRegistrationSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.message });

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: value.email }, { userId: value.userId }]
    });
    
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Create new user
    const user = await User.create(value);
    
    res.status(201).json({ 
      ok: true, 
      message: 'User registered successfully',
      userId: user.userId,
      userType: user.userType
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

router.post('/auth/login', async (req: any, res: any) => {
  try {
    const { userId, email } = req.body;
    
    if (!userId && !email) {
      return res.status(400).json({ error: 'UserId or email required' });
    }

    const user = await User.findOne({
      $or: [{ userId }, { email }],
      isActive: true
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    res.json({
      ok: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        userType: user.userType,
        emergencyContacts: user.emergencyContacts,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

router.get('/auth/profile/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ok: true,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        licenseNumber: user.licenseNumber,
        vehicleInfo: user.vehicleInfo,
        hospitalName: user.hospitalName,
        department: user.department,
        emergencyContacts: user.emergencyContacts,
        notificationPreferences: user.notificationPreferences,
        locationSharing: user.locationSharing,
        emergencyLocationSharing: user.emergencyLocationSharing
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/auth/profile/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    const user = await User.findOneAndUpdate(
      { userId, isActive: true },
      { $set: updates, updatedAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      ok: true,
      message: 'Profile updated successfully',
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
        phone: user.phone,
        userType: user.userType,
        emergencyContacts: user.emergencyContacts,
        notificationPreferences: user.notificationPreferences
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

router.post('/auth/emergency-contacts/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { emergencyContacts } = req.body;

    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.emergencyContacts = emergencyContacts;
    await user.save();

    res.json({
      ok: true,
      message: 'Emergency contacts updated successfully',
      emergencyContacts: user.emergencyContacts
    });
  } catch (error) {
    console.error('Error updating emergency contacts:', error);
    res.status(500).json({ error: 'Failed to update emergency contacts' });
  }
});

// Device token management for push notifications
router.post('/auth/device-token/:userId', async (req: any, res: any) => {
  try {
    const { userId } = req.params;
    const { deviceToken } = req.body;

    const user = await User.findOne({ userId, isActive: true });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add device token if not already present
    if (!user.deviceTokens.includes(deviceToken)) {
      user.deviceTokens.push(deviceToken);
      await user.save();
    }

    res.json({
      ok: true,
      message: 'Device token registered successfully'
    });
  } catch (error) {
    console.error('Error registering device token:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

module.exports = router;


