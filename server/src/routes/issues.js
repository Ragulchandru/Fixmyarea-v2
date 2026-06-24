const express = require('express');
const router = express.Router();
const Issue = require('../models/Issue');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const User = require('../models/User');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');

// Helper to notify all admins
const notifyAdmins = async (title, message, type, issueId) => {
  try {
    const admins = await User.find({ role: 'admin' });
    const notifications = admins.map(admin => ({
      userId: admin._id,
      title,
      message,
      type,
      issueId
    }));
    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }
  } catch (error) {
    console.error('Failed to notify admins:', error);
  }
};

// @desc    Submit a new issue report
// @route   POST /api/issues
// @access  Public / Optional Auth
router.post('/', upload.single('image'), async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      lat,
      lng,
      address,
      districtId,
      constituencyId,
      panchayatId,
      wardId,
      severity,
      isAnonymous,
      isEmergency
    } = req.body;

    if (!title || !description || !category || !lat || !lng || !districtId || !constituencyId || !panchayatId || !wardId) {
      return res.status(400).json({ success: false, message: 'Please enter all required fields' });
    }

    // Determine user ID if authenticated
    let userId = null;
    let authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer')) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FixMyAreaSecretKey2026SecureHashTokenJWT');
        userId = decoded.id;
      } catch (e) {
        // Continue as anonymous
      }
    }

    const imageUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const newIssue = await Issue.create({
      title,
      description,
      category,
      imageUrl,
      location: {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        address: address || ''
      },
      districtId,
      constituencyId,
      panchayatId,
      wardId,
      severity: severity || 'medium',
      status: 'submitted', // Starts as submitted (visible only to admins)
      userId: isAnonymous === 'true' ? null : userId,
      isAnonymous: isAnonymous === 'true',
      isEmergency: isEmergency === 'true'
    });

    // Notify admins of new report
    const emergencyTag = isEmergency === 'true' ? '[EMERGENCY] ' : '';
    await notifyAdmins(
      `${emergencyTag}New Report: ${title}`,
      `A new report has been submitted under ${category} category in Tamil Nadu.`,
      isEmergency === 'true' ? 'emergency' : 'report_status',
      newIssue._id
    );

    res.status(201).json({
      success: true,
      message: 'Issue report submitted successfully! It is pending admin verification.',
      issue: newIssue
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get verified issues (Public feed and maps)
// @route   GET /api/issues/verified
// @access  Public
router.get('/verified', async (req, res) => {
  try {
    const { category, status, districtId, search, sort } = req.query;
    
    // Base query: Only show verified, assigned, in_progress, and resolved reports
    const query = {
      status: { $in: ['verified', 'assigned', 'in_progress', 'resolved'] }
    };

    if (category) query.category = category;
    if (status) query.status = status;
    if (districtId) query.districtId = districtId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let apiQuery = Issue.find(query)
      .populate('districtId', 'name')
      .populate('constituencyId', 'name')
      .populate('panchayatId', 'name')
      .populate('wardId', 'name');

    // Sorting
    if (sort === 'upvotes') {
      // Handled after fetching because it relies on length of array, or we can use aggregation pipeline.
      // For mongoose sorting, we can sort by latest date as default and then sort in memory.
      apiQuery = apiQuery.sort({ createdAt: -1 });
    } else {
      apiQuery = apiQuery.sort({ createdAt: -1 }); // default: latest
    }

    let issues = await apiQuery;

    if (sort === 'upvotes') {
      issues = issues.sort((a, b) => b.upvotes.length - a.upvotes.length);
    }

    res.json({ success: true, count: issues.length, issues });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get citizen's own reports (Authenticated)
// @route   GET /api/issues/my-reports
// @access  Private
router.get('/my-reports', protect, async (req, res) => {
  try {
    const reports = await Issue.find({ userId: req.user.id })
      .populate('districtId', 'name')
      .populate('panchayatId', 'name')
      .sort({ createdAt: -1 });

    res.json({ success: true, count: reports.length, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get detailed report by ID
// @route   GET /api/issues/:id
// @access  Public (Only if verified or if request user is reporter or Admin/Employee)
router.get('/detail/:id', async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('districtId', 'name')
      .populate('constituencyId', 'name')
      .populate('panchayatId', 'name')
      .populate('wardId', 'name')
      .populate('assignedEmployeeId', 'name email')
      .populate('userId', 'name email');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Security Check: If unverified (submitted/pending/rejected/duplicate/spam), only allow Admin, Employee, or the Reporter to view
    const isPublicStatus = ['verified', 'assigned', 'in_progress', 'resolved'].includes(issue.status);
    if (!isPublicStatus) {
      let isAuthorized = false;
      let authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer')) {
        try {
          const token = authHeader.split(' ')[1];
          const jwt = require('jsonwebtoken');
          const decoded = jwt.verify(token, process.env.JWT_SECRET || 'FixMyAreaSecretKey2026SecureHashTokenJWT');
          const user = await User.findById(decoded.id);
          
          if (user) {
            const isAdmin = user.role === 'admin';
            const isAssignedEmployee = user.role === 'employee' && issue.assignedEmployeeId && issue.assignedEmployeeId._id.toString() === user._id.toString();
            const isReporter = issue.userId && issue.userId._id.toString() === user._id.toString();
            
            if (isAdmin || isAssignedEmployee || isReporter) {
              isAuthorized = true;
            }
          }
        } catch (e) {
          // Token verification failed
        }
      }

      if (!isAuthorized) {
        return res.status(403).json({ success: false, message: 'Not authorized to view this report details.' });
      }
    }

    // Get comments for this issue
    const comments = await Comment.find({ issueId: issue._id })
      .populate('userId', 'name role reputation')
      .sort({ createdAt: 1 });

    res.json({ success: true, issue, comments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Upvote/Downvote issue report
// @route   POST /api/issues/upvote/:id
// @access  Private
router.post('/upvote/:id', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const upvoteIndex = issue.upvotes.indexOf(req.user.id);
    let message = '';
    
    if (upvoteIndex === -1) {
      // Upvote
      issue.upvotes.push(req.user.id);
      message = 'Report upvoted successfully!';
      
      // Award reputation points to the original reporter if exists
      if (issue.userId && issue.userId.toString() !== req.user.id.toString()) {
        await User.findByIdAndUpdate(issue.userId, { $inc: { reputation: 2 } });
      }
    } else {
      // Remove Upvote (Downvote)
      issue.upvotes.splice(upvoteIndex, 1);
      message = 'Upvote removed.';
      
      if (issue.userId && issue.userId.toString() !== req.user.id.toString()) {
        await User.findByIdAndUpdate(issue.userId, { $inc: { reputation: -2 } });
      }
    }

    await issue.save();
    res.json({ success: true, message, upvotes: issue.upvotes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Follow/Unfollow issue updates
// @route   POST /api/issues/follow/:id
// @access  Private
router.post('/follow/:id', protect, async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const followIndex = issue.followers.indexOf(req.user.id);
    let message = '';
    
    if (followIndex === -1) {
      issue.followers.push(req.user.id);
      message = 'You are now following this report updates.';
    } else {
      issue.followers.splice(followIndex, 1);
      message = 'You stopped following this report.';
    }

    await issue.save();
    res.json({ success: true, message, followers: issue.followers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Post a comment
// @route   POST /api/issues/comment/:id
// @access  Private
router.post('/comment/:id', protect, async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({ success: false, message: 'Comment content is required' });
    }

    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    const newComment = await Comment.create({
      issueId: issue._id,
      userId: req.user.id,
      content
    });

    // Notify original reporter (if not the commenter and registered)
    if (issue.userId && issue.userId.toString() !== req.user.id.toString()) {
      await Notification.create({
        userId: issue.userId,
        title: `New Comment on your report`,
        message: `${req.user.name} commented: "${content.substring(0, 30)}..."`,
        type: 'comment',
        issueId: issue._id
      });
    }

    // Notify other followers (excluding reporter and commenter)
    const notificationPromises = issue.followers
      .filter(fId => fId.toString() !== req.user.id.toString() && fId.toString() !== (issue.userId ? issue.userId.toString() : ''))
      .map(followerId => Notification.create({
        userId: followerId,
        title: `Update on followed report`,
        message: `${req.user.name} commented on a report you follow.`,
        type: 'comment',
        issueId: issue._id
      }));

    await Promise.all(notificationPromises);

    const populatedComment = await Comment.findById(newComment._id).populate('userId', 'name role reputation');

    res.status(201).json({ success: true, comment: populatedComment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get user notifications
// @route   GET /api/issues/notifications
// @access  Private
router.get('/notifications', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Mark notification as read
// @route   PUT /api/issues/notifications/:id/read
// @access  Private
router.put('/notifications/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.json({ success: true, notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Edit report (Only if status is still 'submitted' or 'pending_verification')
// @route   PUT /api/issues/:id
// @access  Private
router.put('/:id', protect, upload.single('image'), async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (issue.userId.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this report' });
    }

    if (issue.status !== 'submitted' && issue.status !== 'pending_verification') {
      return res.status(400).json({ success: false, message: 'Cannot edit report after it has been verified/processed' });
    }

    const { title, description, category, lat, lng, address, districtId, constituencyId, panchayatId, wardId, severity } = req.body;

    issue.title = title || issue.title;
    issue.description = description || issue.description;
    issue.category = category || issue.category;
    issue.location = {
      lat: lat ? parseFloat(lat) : issue.location.lat,
      lng: lng ? parseFloat(lng) : issue.location.lng,
      address: address || issue.location.address
    };
    issue.districtId = districtId || issue.districtId;
    issue.constituencyId = constituencyId || issue.constituencyId;
    issue.panchayatId = panchayatId || issue.panchayatId;
    issue.wardId = wardId || issue.wardId;
    issue.severity = severity || issue.severity;

    if (req.file) {
      issue.imageUrl = `/uploads/${req.file.filename}`;
    }

    await issue.save();
    res.json({ success: true, message: 'Report edited successfully!', issue });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// @desc    Get public statistics
// @route   GET /api/issues/stats
// @access  Public
router.get('/stats', async (req, res) => {
  try {
    const total = await Issue.countDocuments();
    const resolved = await Issue.countDocuments({ status: 'resolved' });
    const active = await Issue.countDocuments({ status: { $in: ['verified', 'assigned', 'in_progress'] } });
    
    const { District } = require('../models/Geography');
    const districtCount = await District.countDocuments();
    
    res.json({
      success: true,
      stats: {
        total,
        resolved,
        active,
        districts: districtCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;


