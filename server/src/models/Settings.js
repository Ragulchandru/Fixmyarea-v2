const mongoose = require('mongoose');

const SettingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'FixMyArea is currently undergoing scheduled maintenance. Please try again later.' }
}, { timestamps: true });

module.exports = mongoose.model('Settings', SettingsSchema);
