const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Notification = require('../models/Notification');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect, authorize } = require('../middleware/auth');

// Apply employee protection middleware
router.use(protect);
router.use(authorize('employee', 'admin')); // Admins can access employee routes for troubleshooting

// @desc    Get assigned issues for the logged-in employee
// @route   GET /api/employee/assigned
// @access  Private (Employee)
router.get('/assigned', async (req, res) => {
  try {
    const issues = await Issue.find({ assignedEmployeeId: req.user.id })
      .populate('districtId', 'name')
      .populate('constituencyId', 'name')
      .populate('panchayatId', 'name')
      .populate('wardId', 'name')
      .sort({ updatedAt: -1 });

    res.json({ success: true, count: issues.length, issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Update progress/status of an assigned issue
// @route   PUT /api/employee/issue/:id
// @access  Private (Employee)
router.put('/issue/:id', upload.single('image'), async (req, res) => {
  try {
    const { status, note } = req.body;
    
    if (!status || !note) {
      return res.status(400).json({ success: false, message: 'Please enter status and progress remark' });
    }

    if (!['in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status update for employee. Select "In Progress" or "Resolved".' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Verify assignment (unless current user is an admin bypassing)
    if (req.user.role !== 'admin' && (!issue.assignedEmployeeId || issue.assignedEmployeeId.toString() !== req.user.id.toString())) {
      return res.status(403).json({ success: false, message: 'Not authorized: You are not assigned to this report' });
    }

    const photoUrl = req.file ? `/uploads/${req.file.filename}` : '';

    // Append to progress timeline
    issue.status = status;
    issue.progressNotes.push({
      note,
      photoUrl,
      status,
      updatedBy: req.user.id,
      updatedAt: Date.now()
    });

    await issue.save();

    // Trigger Notification for the reporter (if exists)
    if (issue.userId) {
      const statusText = status === 'in_progress' ? 'is now In Progress' : 'has been RESOLVED';
      await Notification.create({
        userId: issue.userId,
        title: `Report status updated: ${status.toUpperCase()}`,
        message: `Your report titled "${issue.title}" ${statusText}. Remarks: "${note.substring(0, 40)}..."`,
        type: 'report_status',
        issueId: issue._id
      });
      
      // Award reputation points to the citizen on successful resolution
      if (status === 'resolved') {
        await User.findByIdAndUpdate(issue.userId, { 
          $inc: { reputation: 10 },
          $addToSet: { badges: 'Active Citizen' } // Auto-badge if not exists
        });
      }
    }

    // Trigger Notification for all followers
    const followPromises = issue.followers
      .filter(fId => fId.toString() !== (issue.userId ? issue.userId.toString() : ''))
      .map(followerId => Notification.create({
        userId: followerId,
        title: `Followed report updated: ${status.toUpperCase()}`,
        message: `The report you follow: "${issue.title}" is now ${status.replace('_', ' ')}.`,
        type: 'report_status',
        issueId: issue._id
      }));

    await Promise.all(followPromises);

    res.json({
      success: true,
      message: `Report updated to ${status} successfully!`,
      issue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
