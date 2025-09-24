export {};
const http = require('http');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { Server: SocketIOServer } = require('socket.io');
const router = require('./routes').default || require('./routes');
const { maybeEscalate } = require('./services/escalation');

dotenv.config();

async function createServer() {
  const app = express();
  app.use(express.json());
  app.use(cors({ origin: (process.env.ALLOWED_ORIGINS || '').split(',').filter(Boolean) || true }));

  const server = http.createServer(app);
  const io = new SocketIOServer(server, { cors: { origin: '*' } });
  app.set('io', io);

  io.on('connection', (socket: any) => {
    console.log('socket connected', socket.id);
    socket.on('disconnect', () => console.log('socket disconnected', socket.id));
  });

  app.use('/api', router);

  let mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/accidents';
  try {
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');
  } catch (err) {
    console.warn('Mongo connection failed, starting in-memory MongoDB for dev...');
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mem = await MongoMemoryServer.create();
      mongoUri = mem.getUri();
      await mongoose.connect(mongoUri);
      console.log('Connected to in-memory MongoDB');
    } catch (memErr) {
      console.error('Failed to start in-memory MongoDB:', memErr);
      // Continue without database for demo purposes
    }
  }

  // Escalation timer
  setInterval(async () => {
    try {
      const dayjs = require('dayjs');
      const twoMinutesAgo = dayjs().subtract(2, 'minute').toDate();
      const { AccidentEvent } = require('./models/AccidentEvent');
      const events = (await AccidentEvent.find({ status: 'notified', acknowledged: false, contactsNotifiedAt: { $lte: twoMinutesAgo } })).map((e: any) => e.id);
      await Promise.all(events.map((id: any) => maybeEscalate(id)));
    } catch (_) {}
  }, 30_000);

  return { app, server };
}

module.exports = { createServer };


