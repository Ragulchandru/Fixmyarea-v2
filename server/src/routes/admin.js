const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const AuditLog = require('../models/AuditLog');
const Settings = require('../models/Settings');
const { District, Constituency, Panchayat, Ward } = require('../models/Geography');
const { protect, authorize } = require('../middleware/auth');

// Apply admin validation middleware
router.use(protect);
router.use(authorize('admin'));

// Helper to log administrative actions
const logAdminAction = async (adminId, action, targetId, modelName, details) => {
  try {
    await AuditLog.create({
      adminId,
      action,
      targetRecordId: targetId,
      targetModel: modelName,
      details
    });
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
};

// ==========================================
// 1. REPORT MANAGEMENT
// ==========================================

// @desc    Get all reports (including unverified ones) for admin review
// @route   GET /api/admin/reports
// @access  Private (Admin)
router.get('/reports', async (req, res) => {
  try {
    const { status, category, districtId } = req.query;
    const query = {};
    
    if (status) query.status = status;
    if (category) query.category = category;
    if (districtId) query.districtId = districtId;

    const reports = await Issue.find(query)
      .populate('districtId', 'name')
      .populate('constituencyId', 'name')
      .populate('panchayatId', 'name')
      .populate('wardId', 'name')
      .populate('assignedEmployeeId', 'name email')
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Verify/Approve a submitted report
// @route   PUT /api/admin/reports/:id/verify
// @access  Private (Admin)
router.put('/reports/:id/verify', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    issue.status = 'verified';
    await issue.save();

    // Log action
    await logAdminAction(req.user.id, 'Verify Report', issue._id, 'Issue', `Verified issue report: "${issue.title}"`);

    // Notify citizen (if registered)
    if (issue.userId) {
      await Notification.create({
        userId: issue.userId,
        title: 'Report Verified!',
        message: `Your report "${issue.title}" has been verified by the administrator and is now public.`,
        type: 'report_status',
        issueId: issue._id
      });
      // Reward initial points
      await User.findByIdAndUpdate(issue.userId, { $inc: { reputation: 5 } });
    }

    res.json({ success: true, message: 'Report verified successfully!', issue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reject a submitted report
// @route   PUT /api/admin/reports/:id/reject
// @access  Private (Admin)
router.put('/reports/:id/reject', async (req, res) => {
  try {
    const { reason } = req.body;
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    issue.status = 'rejected';
    issue.progressNotes.push({
      note: `Rejected by Admin. Reason: ${reason || 'Inappropriate or invalid information.'}`,
      status: 'rejected',
      updatedBy: req.user.id,
      updatedAt: Date.now()
    });
    await issue.save();

    // Log action
    await logAdminAction(req.user.id, 'Reject Report', issue._id, 'Issue', `Rejected report: "${issue.title}". Reason: ${reason || 'N/A'}`);

    // Notify citizen (if registered)
    if (issue.userId) {
      await Notification.create({
        userId: issue.userId,
        title: 'Report Rejected',
        message: `Your report "${issue.title}" was rejected. Reason: ${reason || 'Inappropriate or invalid information.'}`,
        type: 'report_status',
        issueId: issue._id
      });
    }

    res.json({ success: true, message: 'Report rejected.', issue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Assign an issue to an employee
// @route   PUT /api/admin/reports/:id/assign
// @access  Private (Admin)
router.put('/reports/:id/assign', async (req, res) => {
  try {
    const { employeeId } = req.body;
    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'Please select an employee' });
    }

    const employee = await User.findById(employeeId);
    if (!employee || employee.role !== 'employee') {
      return res.status(400).json({ success: false, message: 'User is not a valid employee' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    issue.status = 'assigned';
    issue.assignedEmployeeId = employee._id;
    issue.progressNotes.push({
      note: `Assigned to employee: ${employee.name}`,
      status: 'assigned',
      updatedBy: req.user.id,
      updatedAt: Date.now()
    });
    await issue.save();

    // Log action
    await logAdminAction(req.user.id, 'Assign Report', issue._id, 'Issue', `Assigned report "${issue.title}" to employee "${employee.name}"`);

    // Notify Employee
    await Notification.create({
      userId: employee._id,
      title: 'New Resolution Assignment',
      message: `You have been assigned to resolve: "${issue.title}" in ${issue.location.address || 'Tamil Nadu'}.`,
      type: 'assignment',
      issueId: issue._id
    });

    // Notify Reporter (if registered)
    if (issue.userId) {
      await Notification.create({
        userId: issue.userId,
        title: 'Employee Assigned',
        message: `An employee (${employee.name}) has been assigned to resolve your report: "${issue.title}".`,
        type: 'report_status',
        issueId: issue._id
      });
    }

    res.json({ success: true, message: `Report assigned to ${employee.name} successfully!`, issue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Delete a report (Hard delete)
// @route   DELETE /api/admin/reports/:id
// @access  Private (Admin)
router.delete('/reports/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Capture title before deletion
    const issueTitle = issue.title;
    
    // Delete associated comments first
    await Comment.deleteMany({ issueId: issue._id });
    // Delete notifications
    await Notification.deleteMany({ issueId: issue._id });
    // Delete the issue itself
    await Issue.findByIdAndDelete(req.params.id);

    // Log action
    await logAdminAction(req.user.id, 'Delete Report', req.params.id, 'Issue', `Permanently deleted report: "${issueTitle}"`);

    res.json({ success: true, message: 'Report permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Merge duplicate reports
// @route   POST /api/admin/reports/merge
// @access  Private (Admin)
router.post('/reports/merge', async (req, res) => {
  try {
    const { primaryIssueId, duplicateIssueIds } = req.body;
    if (!primaryIssueId || !duplicateIssueIds || !Array.isArray(duplicateIssueIds) || duplicateIssueIds.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select primary and duplicate issues.' });
    }

    const primary = await Issue.findById(primaryIssueId);
    if (!primary) {
      return res.status(404).json({ success: false, message: 'Primary report not found' });
    }

    // Merge duplicates
    for (let dupId of duplicateIssueIds) {
      const dupIssue = await Issue.findById(dupId);
      if (dupIssue) {
        dupIssue.status = 'duplicate';
        dupIssue.progressNotes.push({
          note: `Marked as duplicate of report: "${primary.title}" (ID: ${primary._id})`,
          status: 'duplicate',
          updatedBy: req.user.id,
          updatedAt: Date.now()
        });
        await dupIssue.save();
        
        // Notify original reporter of duplicate status change
        if (dupIssue.userId) {
          await Notification.create({
            userId: dupIssue.userId,
            title: 'Report Marked as Duplicate',
            message: `Your report "${dupIssue.title}" was marked as a duplicate of: "${primary.title}". We are tracking the issue under that report.`,
            type: 'report_status',
            issueId: primary._id
          });
        }
      }
    }

    await logAdminAction(
      req.user.id,
      'Merge Reports',
      primary._id,
      'Issue',
      `Merged ${duplicateIssueIds.length} duplicate reports into primary: "${primary.title}"`
    );

    res.json({ success: true, message: 'Duplicate reports merged successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. USER MANAGEMENT
// ==========================================

// @desc    Get all users list
// @route   GET /api/admin/users
// @access  Private (Admin)
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Change user status (Ban / Suspend / Restore)
// @route   PUT /api/admin/users/:id/status
// @access  Private (Admin)
router.put('/users/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'suspended', 'banned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status type' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Super Administrators cannot be suspended or banned.' });
    }

    user.status = status;
    await user.save();

    await logAdminAction(
      req.user.id,
      'Change User Status',
      user._id,
      'User',
      `Changed user status for "${user.email}" to "${status}"`
    );

    res.json({ success: true, message: `User status changed to ${status} successfully!`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Reset citizen or employee account password
// @route   PUT /api/admin/users/:id/reset
// @access  Private (Admin)
router.put('/users/:id/reset', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Set default password
    user.password = 'Reset@123'; // pre-save hook will hash this
    await user.save();

    await logAdminAction(
      req.user.id,
      'Reset User Password',
      user._id,
      'User',
      `Reset account password to default "Reset@123" for user email "${user.email}"`
    );

    res.json({ success: true, message: 'Account password reset to default "Reset@123".' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 3. EMPLOYEE MANAGEMENT
// ==========================================

// @desc    Create/Add a new Employee account
// @route   POST /api/admin/employees
// @access  Private (Admin)
router.post('/employees', async (req, res) => {
  try {
    const { name, email, password, districts, panchayats } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please supply name, email, and password.' });
    }

    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ success: false, message: 'Email address already registered' });
    }

    const employee = await User.create({
      name,
      email,
      password, // will be auto-hashed on save
      role: 'employee',
      assignedLocations: {
        districts: districts || [],
        panchayats: panchayats || []
      }
    });

    await logAdminAction(
      req.user.id,
      'Create Employee',
      employee._id,
      'User',
      `Created Employee account: "${employee.name}" (${employee.email})`
    );

    res.status(201).json({ success: true, message: 'Employee account created successfully!', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Modify employee geographical coverage
// @route   PUT /api/admin/employees/:id/locations
// @access  Private (Admin)
router.put('/employees/:id/locations', async (req, res) => {
  try {
    const { districts, panchayats } = req.body;
    const employee = await User.findById(req.params.id);
    if (!employee || employee.role !== 'employee') {
      return res.status(400).json({ success: false, message: 'Invalid employee account ID.' });
    }

    employee.assignedLocations = {
      districts: districts || [],
      panchayats: panchayats || []
    };
    await employee.save();

    await logAdminAction(
      req.user.id,
      'Update Employee Locations',
      employee._id,
      'User',
      `Updated location allocations for employee "${employee.name}"`
    );

    res.json({ success: true, message: 'Employee location allocations updated.', employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 4. GEOGRAPHICAL MANAGEMENT
// ==========================================

// @desc    Add a new District to Tamil Nadu
// @route   POST /api/admin/geography/district
// @access  Private (Admin)
router.post('/geography/district', async (req, res) => {
  try {
    const { name, code } = req.body;
    if (!name || !code) {
      return res.status(400).json({ success: false, message: 'District name and code are required.' });
    }

    const newDistrict = await District.create({ name, code });
    await logAdminAction(req.user.id, 'Create District', newDistrict._id, 'District', `Added district: "${name}"`);
    res.status(201).json({ success: true, district: newDistrict });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a new Assembly Constituency
// @route   POST /api/admin/geography/constituency
// @access  Private (Admin)
router.post('/geography/constituency', async (req, res) => {
  try {
    const { name, districtId } = req.body;
    if (!name || !districtId) {
      return res.status(400).json({ success: false, message: 'Constituency name and districtId are required.' });
    }

    const newConstituency = await Constituency.create({ name, districtId });
    await logAdminAction(req.user.id, 'Create Constituency', newConstituency._id, 'Constituency', `Added constituency: "${name}"`);
    res.status(201).json({ success: true, constituency: newConstituency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a new Panchayat Union / Municipality / Corporation
// @route   POST /api/admin/geography/panchayat
// @access  Private (Admin)
router.post('/geography/panchayat', async (req, res) => {
  try {
    const { name, unionName, districtId } = req.body;
    if (!name || !unionName || !districtId) {
      return res.status(400).json({ success: false, message: 'Name, UnionName and DistrictId are required.' });
    }

    const newPanchayat = await Panchayat.create({ name, unionName, districtId });
    await logAdminAction(req.user.id, 'Create Panchayat', newPanchayat._id, 'Panchayat', `Added panchayat/municipality: "${name}"`);
    res.status(201).json({ success: true, panchayat: newPanchayat });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Add a new Ward / Village Panchayat
// @route   POST /api/admin/geography/ward
// @access  Private (Admin)
router.post('/geography/ward', async (req, res) => {
  try {
    const { name, panchayatId } = req.body;
    if (!name || !panchayatId) {
      return res.status(400).json({ success: false, message: 'Ward name/number and panchayatId are required.' });
    }

    const newWard = await Ward.create({ name, panchayatId });
    await logAdminAction(req.user.id, 'Create Ward', newWard._id, 'Ward', `Added Ward: "${name}"`);
    res.status(201).json({ success: true, ward: newWard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 5. MAINTENANCE MODE & AUDIT LOGS
// ==========================================

// @desc    Toggle maintenance mode state
// @route   PUT /api/admin/settings/maintenance
// @access  Private (Admin)
router.put('/settings/maintenance', async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings({});
    }

    settings.maintenanceMode = maintenanceMode !== undefined ? maintenanceMode : settings.maintenanceMode;
    settings.maintenanceMessage = maintenanceMessage || settings.maintenanceMessage;

    await settings.save();

    await logAdminAction(
      req.user.id,
      'Toggle Maintenance Mode',
      settings._id,
      'Settings',
      `Set Maintenance Mode to ${settings.maintenanceMode}`
    );

    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get system settings (maintenance state)
// @route   GET /api/admin/settings
// @access  Public / Private
router.get('/settings', async (req, res) => {
  try {
    const settings = await Settings.findOne();
    res.json({ success: true, settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get administrative audit logs
// @route   GET /api/admin/audit-logs
// @access  Private (Admin)
router.get('/audit-logs', async (req, res) => {
  try {
    const logs = await AuditLog.find()
      .populate('adminId', 'name email')
      .sort({ timestamp: -1 })
      .limit(200);

    res.json({ success: true, logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 6. ANALYTICS DASHBOARD
// ==========================================

// @desc    Fetch aggregated statistics for Admin analytics
// @route   GET /api/admin/analytics
// @access  Private (Admin)
router.get('/analytics', async (req, res) => {
  try {
    // 1. Quick Counters
    const totalReports = await Issue.countDocuments();
    const pendingVerification = await Issue.countDocuments({ status: 'submitted' });
    const verifiedReports = await Issue.countDocuments({ status: { $in: ['verified', 'assigned', 'in_progress'] } });
    const resolvedReports = await Issue.countDocuments({ status: 'resolved' });

    // 2. Active Employees count
    const activeEmployeesCount = await User.countDocuments({ role: 'employee', status: 'active' });

    // 3. Resolution rate = resolved / (verified + assigned + in_progress + resolved)
    const baseVerified = await Issue.countDocuments({ status: { $in: ['verified', 'assigned', 'in_progress', 'resolved'] } });
    const resolutionRate = baseVerified > 0 ? Math.round((resolvedReports / baseVerified) * 100) : 0;

    // 4. District-wise breakdown
    const districtBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: '$districtId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'districts',
          localField: '_id',
          foreignField: '_id',
          as: 'district'
        }
      },
      {
        $unwind: '$district'
      },
      {
        $project: {
          name: '$district.name',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 5. Category breakdown
    const categoryBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: '$category',
          count: { $sum: 1 }
        }
      },
      {
        $project: {
          name: '$_id',
          count: 1,
          _id: 0
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    // 6. Panchayat breakdown
    const panchayatBreakdown = await Issue.aggregate([
      {
        $group: {
          _id: '$panchayatId',
          count: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'panchayats',
          localField: '_id',
          foreignField: '_id',
          as: 'panchayat'
        }
      },
      {
        $unwind: '$panchayat'
      },
      {
        $project: {
          name: '$panchayat.name',
          count: 1
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: 5
      }
    ]);

    // 7. Employee Performance (Assignments vs Resolved)
    const employees = await User.find({ role: 'employee' }).select('name email');
    const employeePerfPromises = employees.map(async emp => {
      const assigned = await Issue.countDocuments({ assignedEmployeeId: emp._id });
      const resolved = await Issue.countDocuments({ assignedEmployeeId: emp._id, status: 'resolved' });
      return {
        id: emp._id,
        name: emp.name,
        email: emp.email,
        assigned,
        resolved,
        performanceScore: assigned > 0 ? Math.round((resolved / assigned) * 100) : 0
      };
    });
    const employeePerformance = await Promise.all(employeePerfPromises);

    res.json({
      success: true,
      stats: {
        totalReports,
        pendingVerification,
        verifiedReports,
        resolvedReports,
        activeEmployeesCount,
        resolutionRate,
        districtBreakdown,
        categoryBreakdown,
        panchayatBreakdown,
        employeePerformance
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
