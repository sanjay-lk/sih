export {};
const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmergencyContactSchema = new Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String },
  relationship: { type: String, required: true },
  isPrimary: { type: Boolean, default: false }
});

const UserSchema = new Schema({
  userId: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  userType: { type: String, enum: ['driver', 'hospital', 'admin'], default: 'driver' },
  
  // Driver-specific fields
  licenseNumber: { type: String },
  vehicleInfo: {
    make: String,
    model: String,
    year: Number,
    plateNumber: String
  },
  
  // Hospital-specific fields
  hospitalName: { type: String },
  department: { type: String },
  hospitalId: { type: String },
  
  // Emergency contacts
  emergencyContacts: [EmergencyContactSchema],
  
  // Device and notification settings
  deviceTokens: [{ type: String }], // For push notifications
  notificationPreferences: {
    sms: { type: Boolean, default: true },
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true }
  },
  
  // Location and privacy settings
  locationSharing: { type: Boolean, default: true },
  emergencyLocationSharing: { type: Boolean, default: true },
  
  // Account status
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  
  // Timestamps
  lastLogin: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { 
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
UserSchema.virtual('fullName').get(function(this: any) {
  return this.name;
});

// Virtual for primary emergency contact
UserSchema.virtual('primaryEmergencyContact').get(function(this: any) {
  return this.emergencyContacts.find((contact: any) => contact.isPrimary) || this.emergencyContacts[0];
});

// Pre-save middleware to update timestamps
UserSchema.pre('save', function(this: any, next: any) {
  this.updatedAt = new Date();
  next();
});

// Index for efficient queries
UserSchema.index({ userType: 1, isActive: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });

const User = mongoose.models.User || mongoose.model('User', UserSchema);
module.exports = { User };
