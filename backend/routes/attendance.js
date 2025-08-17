const express = require('express');
const { body, validationResult } = require('express-validator');
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Class = require('../models/Class');

const router = express.Router();

// Validation middleware
const validateAttendance = [
  body('studentId').isMongoId().withMessage('Valid student ID is required'),
  body('classId').isMongoId().withMessage('Valid class ID is required'),
  body('date').isISO8601().withMessage('Valid date is required'),
  body('status').isIn(['Present', 'Absent', 'Late']).withMessage('Status must be Present, Absent, or Late')
];

// Get all attendance records
router.get('/', async (req, res) => {
  try {
    const { studentId, classId, date, status } = req.query;
    let filter = {};

    if (studentId) filter.studentId = studentId;
    if (classId) filter.classId = classId;
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
      filter.date = { $gte: startDate, $lt: endDate };
    }
    if (status) filter.status = status;

    const attendance = await Attendance.find(filter)
      .populate('studentId', 'name rollNumber class')
      .populate('classId', 'name subject teacher')
      .sort({ date: -1, createdAt: -1 });

    res.json({
      success: true,
      data: attendance,
      count: attendance.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance records',
      error: error.message
    });
  }
});

// Get attendance by ID
router.get('/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findById(req.params.id)
      .populate('studentId', 'name rollNumber class')
      .populate('classId', 'name subject teacher');

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching attendance record',
      error: error.message
    });
  }
});

// Mark attendance
router.post('/', validateAttendance, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if student exists
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if class exists
    const classData = await Class.findById(req.body.classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if attendance already exists for this student, class, and date
    const existingAttendance = await Attendance.findOne({
      studentId: req.body.studentId,
      classId: req.body.classId,
      date: {
        $gte: new Date(req.body.date),
        $lt: new Date(new Date(req.body.date).getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student, class, and date'
      });
    }

    const attendance = new Attendance(req.body);
    await attendance.save();

    // Populate the saved record for response
    await attendance.populate([
      { path: 'studentId', select: 'name rollNumber class' },
      { path: 'classId', select: 'name subject teacher' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Attendance marked successfully',
      data: attendance
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student, class, and date'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error marking attendance',
      error: error.message
    });
  }
});

// Update attendance
router.put('/:id', validateAttendance, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    // Check if student exists
    const student = await Student.findById(req.body.studentId);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if class exists
    const classData = await Class.findById(req.body.classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if attendance already exists for this student, class, and date (excluding current record)
    const existingAttendance = await Attendance.findOne({
      _id: { $ne: req.params.id },
      studentId: req.body.studentId,
      classId: req.body.classId,
      date: {
        $gte: new Date(req.body.date),
        $lt: new Date(new Date(req.body.date).getTime() + 24 * 60 * 60 * 1000)
      }
    });

    if (existingAttendance) {
      return res.status(400).json({
        success: false,
        message: 'Attendance already marked for this student, class, and date'
      });
    }

    const attendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate([
      { path: 'studentId', select: 'name rollNumber class' },
      { path: 'classId', select: 'name subject teacher' }
    ]);

    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance updated successfully',
      data: attendance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating attendance',
      error: error.message
    });
  }
});

// Delete attendance
router.delete('/:id', async (req, res) => {
  try {
    const attendance = await Attendance.findByIdAndDelete(req.params.id);
    
    if (!attendance) {
      return res.status(404).json({
        success: false,
        message: 'Attendance record not found'
      });
    }

    res.json({
      success: true,
      message: 'Attendance record deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting attendance record',
      error: error.message
    });
  }
});

// Bulk mark attendance for a class
router.post('/bulk', async (req, res) => {
  try {
    const { classId, date, attendanceData } = req.body;

    if (!classId || !date || !attendanceData || !Array.isArray(attendanceData)) {
      return res.status(400).json({
        success: false,
        message: 'classId, date, and attendanceData array are required'
      });
    }

    // Check if class exists
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Validate attendance data
    for (const record of attendanceData) {
      if (!record.studentId || !record.status) {
        return res.status(400).json({
          success: false,
          message: 'Each attendance record must have studentId and status'
        });
      }
      if (!['Present', 'Absent', 'Late'].includes(record.status)) {
        return res.status(400).json({
          success: false,
          message: 'Status must be Present, Absent, or Late'
        });
      }
    }

    const results = [];
    const errors = [];

    for (const record of attendanceData) {
      try {
        // Check if attendance already exists
        const existingAttendance = await Attendance.findOne({
          studentId: record.studentId,
          classId: classId,
          date: {
            $gte: new Date(date),
            $lt: new Date(new Date(date).getTime() + 24 * 60 * 60 * 1000)
          }
        });

        if (existingAttendance) {
          // Update existing record
          const updated = await Attendance.findByIdAndUpdate(
            existingAttendance._id,
            { status: record.status },
            { new: true }
          ).populate([
            { path: 'studentId', select: 'name rollNumber class' },
            { path: 'classId', select: 'name subject teacher' }
          ]);
          results.push(updated);
        } else {
          // Create new record
          const newAttendance = new Attendance({
            studentId: record.studentId,
            classId: classId,
            date: date,
            status: record.status
          });
          await newAttendance.save();
          await newAttendance.populate([
            { path: 'studentId', select: 'name rollNumber class' },
            { path: 'classId', select: 'name subject teacher' }
          ]);
          results.push(newAttendance);
        }
      } catch (error) {
        errors.push({
          studentId: record.studentId,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      message: `Bulk attendance marked successfully. ${results.length} records processed.`,
      data: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error processing bulk attendance',
      error: error.message
    });
  }
});

// Get attendance statistics
router.get('/stats/overview', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let dateFilter = {};

    if (startDate && endDate) {
      dateFilter = {
        date: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      };
    }

    const totalRecords = await Attendance.countDocuments(dateFilter);
    const presentCount = await Attendance.countDocuments({ ...dateFilter, status: 'Present' });
    const absentCount = await Attendance.countDocuments({ ...dateFilter, status: 'Absent' });
    const lateCount = await Attendance.countDocuments({ ...dateFilter, status: 'Late' });

    const attendancePercentage = totalRecords > 0 ? ((presentCount + lateCount) / totalRecords * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        total: totalRecords,
        present: presentCount,
        absent: absentCount,
        late: lateCount,
        percentage: parseFloat(attendancePercentage)
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
