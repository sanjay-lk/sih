const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { AccidentEvent } = require('./models/AccidentEvent');

dotenv.config();

async function main() {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/accidents';
  await mongoose.connect(mongoUri);

  await AccidentEvent.deleteMany({});
  await AccidentEvent.create([
    {
      userId: 'demo_user',
      severity: 0.8,
      location: { lat: 12.9716, lng: 77.5946 },
      timestamp: new Date(),
      acknowledged: false,
      status: 'reported',
    },
    {
      userId: 'demo_user',
      severity: 0.35,
      location: { lat: 13.0358, lng: 77.5970 },
      timestamp: new Date(),
      acknowledged: true,
      status: 'acknowledged',
    },
  ]);

  console.log('Seed complete');
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });



