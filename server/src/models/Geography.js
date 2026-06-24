const mongoose = require('mongoose');

const DistrictSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  code: { type: String, required: true, unique: true }
}, { timestamps: true });

const ConstituencySchema = new mongoose.Schema({
  name: { type: String, required: true },
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true }
}, { timestamps: true });

// Ensure compound index for constituency name uniqueness within a district
ConstituencySchema.index({ name: 1, districtId: 1 }, { unique: true });

const PanchayatSchema = new mongoose.Schema({
  name: { type: String, required: true },
  unionName: { type: String, required: true }, // Panchayat Union / Municipality / Corporation
  districtId: { type: mongoose.Schema.Types.ObjectId, ref: 'District', required: true }
}, { timestamps: true });

PanchayatSchema.index({ name: 1, districtId: 1, unionName: 1 }, { unique: true });

const WardSchema = new mongoose.Schema({
  name: { type: String, required: true }, // Ward number or Panchayat Village name
  panchayatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Panchayat', required: true }
}, { timestamps: true });

WardSchema.index({ name: 1, panchayatId: 1 }, { unique: true });

module.exports = {
  District: mongoose.model('District', DistrictSchema),
  Constituency: mongoose.model('Constituency', ConstituencySchema),
  Panchayat: mongoose.model('Panchayat', PanchayatSchema),
  Ward: mongoose.model('Ward', WardSchema)
};
