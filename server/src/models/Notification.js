const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: {
    type: String,
    enum: ['report_status', 'comment', 'assignment', 'moderation', 'emergency'],
    required: true
  },
  isRead: { type: Boolean, default: false },
  issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', default: null }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);
