const express = require('express');
const { body, validationResult } = require('express-validator');
const Class = require('../models/Class');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Validation middleware
const validateClass = [
  body('name').trim().isLength({ min: 2 }).withMessage('Class name must be at least 2 characters long'),
  body('subject').trim().notEmpty().withMessage('Subject is required'),
  body('teacher').trim().notEmpty().withMessage('Teacher name is required')
];

// Get all classes
router.get('/', async (req, res) => {
  try {
    const classes = await Class.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: classes,
      count: classes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching classes',
      error: error.message
    });
  }
});

// Get class by ID
router.get('/:id', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }
    res.json({
      success: true,
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching class',
      error: error.message
    });
  }
});

// Create new class
router.post('/', validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if class with same name and subject already exists
    const existingClass = await Class.findOne({
      name: req.body.name,
      subject: req.body.subject
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name and subject already exists'
      });
    }

    const classData = new Class(req.body);
    await classData.save();

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating class',
      error: error.message
    });
  }
});

// Update class
router.put('/:id', validateClass, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if class with same name and subject already exists for other classes
    const existingClass = await Class.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        { name: req.body.name, subject: req.body.subject }
      ]
    });

    if (existingClass) {
      return res.status(400).json({
        success: false,
        message: 'Class with this name and subject already exists'
      });
    }

    const classData = await Class.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: classData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating class',
      error: error.message
    });
  }
});

// Delete class
router.delete('/:id', async (req, res) => {
  try {
    // Check if class has attendance records
    const attendanceCount = await Attendance.countDocuments({ classId: req.params.id });
    
    if (attendanceCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete class with existing attendance records'
      });
    }

    const classData = await Class.findByIdAndDelete(req.params.id);
    
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting class',
      error: error.message
    });
  }
});

// Get class attendance summary
router.get('/:id/attendance-summary', async (req, res) => {
  try {
    const classData = await Class.findById(req.params.id);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const attendance = await Attendance.find({ classId: req.params.id })
      .populate('studentId', 'name rollNumber')
      .sort({ date: -1 });

    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const absentCount = attendance.filter(a => a.status === 'Absent').length;
    const lateCount = attendance.filter(a => a.status === 'Late').length;

    const attendancePercentage = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(2) : 0;

    // Group by date for daily summary
    const dailySummary = {};
    attendance.forEach(record => {
      const dateKey = record.date.toISOString().split('T')[0];
      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = { present: 0, absent: 0, late: 0, total: 0 };
      }
      dailySummary[dateKey][record.status.toLowerCase()]++;
      dailySummary[dateKey].total++;
    });

    res.json({
      success: true,
      data: {
        class: classData,
        attendance,
        summary: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          percentage: parseFloat(attendancePercentage)
        },
        dailySummary
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance summary',
      error: error.message
    });
  }
});

module.exports = router;
