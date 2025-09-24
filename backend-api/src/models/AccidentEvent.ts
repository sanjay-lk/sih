export {};
const mongoose = require('mongoose');
const { Schema } = mongoose;

const LocationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
});

const AccidentEventSchema = new Schema({
  userId: { type: String, required: true, index: true },
  severity: { type: Number, required: true, min: 0, max: 1 },
  location: { type: LocationSchema, required: true },
  timestamp: { type: Date, required: true },
  acknowledged: { type: Boolean, default: false },
  status: { type: String, enum: ['reported','notified','acknowledged','assigned','dispatched','resolved','escalated'], default: 'reported' },
  contactsNotifiedAt: { type: Date },
  escalatedAt: { type: Date },
}, { timestamps: true });

const AccidentEvent = mongoose.models.AccidentEvent || mongoose.model('AccidentEvent', AccidentEventSchema);
module.exports = { AccidentEvent };


