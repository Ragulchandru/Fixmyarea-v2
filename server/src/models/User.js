const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ['citizen', 'employee', 'admin'],
    default: 'citizen'
  },
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned'],
    default: 'active'
  },
  reputation: { type: Number, default: 0 },
  badges: { type: [String], default: [] },
  preferredLanguage: {
    type: String,
    enum: ['en', 'ta'],
    default: 'en'
  },
  // Locations assigned to Employees for resolution responsibilities
  assignedLocations: {
    districts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'District' }],
    panchayats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Panchayat' }]
  }
}, { timestamps: true });

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Instance method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
