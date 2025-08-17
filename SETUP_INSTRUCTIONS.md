# 🚀 Quick Setup Guide

## Prerequisites
- Node.js (v14+) installed
- MongoDB running locally or MongoDB Atlas account

## 🎯 Quick Start (Windows)

### Option 1: Use the batch file (Recommended)
1. Double-click `start.bat`
2. Wait for both servers to start
3. Open http://localhost:3000 in your browser

### Option 2: Manual start
1. Open PowerShell in the project directory
2. Run: `npm run dev`

## 🎯 Quick Start (Mac/Linux)
1. Open terminal in the project directory
2. Run: `npm run dev`

## 🔧 Configuration
1. Update `backend/config.env` with your MongoDB connection string
2. Default: `mongodb://localhost:27017/student_attendance`

## 📱 Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Health Check**: http://localhost:5000/api/health

## 🧪 Test Backend
```bash
node test-backend.js
```

## 🚨 Troubleshooting
- **Backend won't start**: Check if MongoDB is running
- **Frontend won't start**: Check if backend is running on port 5000
- **CORS errors**: Backend has CORS enabled by default
- **Database connection**: Verify MongoDB URI in config.env

## 📚 What's Included
✅ Complete MERN stack application  
✅ Student management (CRUD)  
✅ Class management (CRUD)  
✅ Attendance tracking  
✅ Responsive UI with TailwindCSS  
✅ Toast notifications  
✅ Error handling  
✅ Data validation  
✅ MongoDB with Mongoose  
✅ RESTful API endpoints  

## 🎉 You're Ready!
The system includes everything needed for a production-ready student attendance system.
