const mongoose = require('mongoose');

const ProgressNoteSchema = new mongoose.Schema({
  note: { type: String, required: true },
  photoUrl: { type: String, default: '' },
  status: { type: String, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now }
});

const IssueSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  category: {
    type: String,
    enum: ['pothole', 'garbage', 'streetlight', 'water_leakage', 'sewage', 'road_damage', 'safety', 'other'],
    required: true
  },
  imageUrl: { type: String, default: '' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String, default: '' }
  },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true },
  constituencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Constituency', required: true },
  panchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Panchayat', required: true },
  wardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ward', required: true },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: [
      'submitted',
      'pending_verification',
      'verified',
      'assigned',
      'in_progress',
      'resolved',
      'rejected',
      'duplicate',
      'spam'
    ],
    default: 'submitted'
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null for anonymous reports
  isAnonymous: { type: Boolean, default: false },
  isEmergency: { type: Boolean, default: false },
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  assignedEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  progressNotes: [ProgressNoteSchema]
}, { timestamps: true });

// Upvotes count index
IssueSchema.virtual('upvoteCount').get(function () {
  return this.upvotes.length;
});

module.exports = mongoose.model('Issue', IssueSchema);
