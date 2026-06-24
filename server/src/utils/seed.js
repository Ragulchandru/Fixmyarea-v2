const User = require('../models/User');
const { District, Constituency, Panchayat, Ward } = require('../models/Geography');
const Settings = require('../models/Settings');

const seedDatabase = async () => {
  try {
    // 1. Seed global settings if empty
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create({
        maintenanceMode: false,
        maintenanceMessage: 'FixMyArea is currently undergoing scheduled maintenance. Please try again later.'
      });
      console.log('Seeded global application settings.');
    }

    // 2. Seed Admin user if empty
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount === 0) {
      await User.create({
        name: 'State Administrator',
        email: 'admin@fixmyarea.tn.gov.in',
        password: 'Admin@123', // Will be hashed by pre-save hook
        role: 'admin',
        status: 'active',
        reputation: 100,
        badges: ['Pioneer', 'Super Admin']
      });
      console.log('Seeded default admin user: admin@fixmyarea.tn.gov.in / Admin@123');
    }

    // 3. Seed Geography if empty
    const districtCount = await District.countDocuments();
    if (districtCount === 0) {
      console.log('Seeding Tamil Nadu location hierarchy...');

      // Districts
      const erode = await District.create({ name: 'Erode District', code: 'ERD' });
      const chennai = await District.create({ name: 'Chennai District', code: 'CHN' });
      const coimbatore = await District.create({ name: 'Coimbatore District', code: 'CBE' });
      const madurai = await District.create({ name: 'Madurai District', code: 'MDU' });

      // Constituencies
      const kangeyam = await Constituency.create({ name: 'Kangeyam Constituency', districtId: erode._id });
      const erodeWest = await Constituency.create({ name: 'Erode West Constituency', districtId: erode._id });
      
      const harbour = await Constituency.create({ name: 'Harbour Constituency', districtId: chennai._id });
      const royapuram = await Constituency.create({ name: 'Royapuram Constituency', districtId: chennai._id });
      
      const singanallur = await Constituency.create({ name: 'Singanallur Constituency', districtId: coimbatore._id });
      const cbeSouth = await Constituency.create({ name: 'Coimbatore South Constituency', districtId: coimbatore._id });
      
      const maduraiWest = await Constituency.create({ name: 'Madurai West Constituency', districtId: madurai._id });
      const maduraiEast = await Constituency.create({ name: 'Madurai East Constituency', districtId: madurai._id });

      // Panchayats / Corporations / Municipalities
      const chennimalaiUnion = await Panchayat.create({
        name: 'Chennimalai Town Panchayat',
        unionName: 'Chennimalai Panchayat Union',
        districtId: erode._id
      });
      const erodeMuni = await Panchayat.create({
        name: 'Erode Municipal Corporation',
        unionName: 'Erode Corporation',
        districtId: erode._id
      });

      const chennaiCorp1 = await Panchayat.create({
        name: 'Royapuram Zone 5',
        unionName: 'Greater Chennai Corporation',
        districtId: chennai._id
      });
      const chennaiCorp2 = await Panchayat.create({
        name: 'Adyar Zone 13',
        unionName: 'Greater Chennai Corporation',
        districtId: chennai._id
      });

      const coimbatoreCorp = await Panchayat.create({
        name: 'Ramanathapuram Zone 3',
        unionName: 'Coimbatore Corporation',
        districtId: coimbatore._id
      });

      const maduraiCorp = await Panchayat.create({
        name: 'KK Nagar Zone 2',
        unionName: 'Madurai Corporation',
        districtId: madurai._id
      });

      // Wards
      await Ward.create({ name: 'Ward 1 - Nalligoundenpalayam', panchayatId: chennimalaiUnion._id });
      await Ward.create({ name: 'Ward 2 - Chennimalai Town', panchayatId: chennimalaiUnion._id });
      await Ward.create({ name: 'Ward 12 - Solar', panchayatId: erodeMuni._id });
      await Ward.create({ name: 'Ward 15 - Kasipalayam', panchayatId: erodeMuni._id });

      await Ward.create({ name: 'Ward 50 - Royapuram West', panchayatId: chennaiCorp1._id });
      await Ward.create({ name: 'Ward 52 - Royapuram East', panchayatId: chennaiCorp1._id });
      await Ward.create({ name: 'Ward 170 - Adyar South', panchayatId: chennaiCorp2._id });

      await Ward.create({ name: 'Ward 62 - Ramanathapuram North', panchayatId: coimbatoreCorp._id });
      await Ward.create({ name: 'Ward 65 - Ramanathapuram South', panchayatId: coimbatoreCorp._id });

      await Ward.create({ name: 'Ward 30 - KK Nagar Central', panchayatId: maduraiCorp._id });
      await Ward.create({ name: 'Ward 32 - Anna Nagar', panchayatId: maduraiCorp._id });

      console.log('Tamil Nadu location hierarchy seeded successfully!');
    }
  } catch (error) {
    console.error('Seeding database failed:', error);
  }
};

module.exports = seedDatabase;
