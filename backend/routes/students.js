const express = require('express');
const { body, validationResult } = require('express-validator');
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');

const router = express.Router();

// Validation middleware
const validateStudent = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters long'),
  body('rollNumber').trim().notEmpty().withMessage('Roll number is required'),
  body('class').trim().notEmpty().withMessage('Class is required'),
  body('email').isEmail().normalizeEmail().withMessage('Please enter a valid email')
];

// Get all students
router.get('/', async (req, res) => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      data: students,
      count: students.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching students',
      error: error.message
    });
  }
});

// Get student by ID
router.get('/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }
    res.json({
      success: true,
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching student',
      error: error.message
    });
  }
});

// Create new student
router.post('/', validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if roll number or email already exists
    const existingStudent = await Student.findOne({
      $or: [
        { rollNumber: req.body.rollNumber },
        { email: req.body.email }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number or email already exists'
      });
    }

    const student = new Student(req.body);
    await student.save();

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number or email already exists'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error creating student',
      error: error.message
    });
  }
});

// Update student
router.put('/:id', validateStudent, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if roll number or email already exists for other students
    const existingStudent = await Student.findOne({
      $and: [
        { _id: { $ne: req.params.id } },
        {
          $or: [
            { rollNumber: req.body.rollNumber },
            { email: req.body.email }
          ]
        }
      ]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student with this roll number or email already exists'
      });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: student
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating student',
      error: error.message
    });
  }
});

// Delete student
router.delete('/:id', async (req, res) => {
  try {
    // Check if student has attendance records
    const attendanceCount = await Attendance.countDocuments({ studentId: req.params.id });
    
    if (attendanceCount > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete student with existing attendance records'
      });
    }

    const student = await Student.findByIdAndDelete(req.params.id);
    
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting student',
      error: error.message
    });
  }
});

// Get student attendance statistics
router.get('/:id/attendance', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const attendance = await Attendance.find({ studentId: req.params.id })
      .populate('classId', 'name subject')
      .sort({ date: -1 });

    const totalRecords = attendance.length;
    const presentCount = attendance.filter(a => a.status === 'Present').length;
    const absentCount = attendance.filter(a => a.status === 'Absent').length;
    const lateCount = attendance.filter(a => a.status === 'Late').length;

    const attendancePercentage = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        student,
        attendance,
        statistics: {
          total: totalRecords,
          present: presentCount,
          absent: absentCount,
          late: lateCount,
          percentage: parseFloat(attendancePercentage)
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance statistics',
      error: error.message
    });
  }
});

module.exports = router;
