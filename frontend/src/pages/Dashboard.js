import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { studentsAPI, classesAPI, attendanceAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    attendance: 0,
    attendancePercentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [studentsRes, classesRes, attendanceStatsRes] = await Promise.all([
        studentsAPI.getAll(),
        classesAPI.getAll(),
        attendanceAPI.getStats()
      ]);

      setStats({
        students: studentsRes.data.count || 0,
        classes: classesRes.data.count || 0,
        attendance: attendanceStatsRes.data.data.total || 0,
        attendancePercentage: attendanceStatsRes.data.data.percentage || 0
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon, color, link }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 ${link ? 'cursor-pointer hover:shadow-lg transition-shadow' : ''}`}>
      {link ? (
        <Link to={link} className="block">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{title}</p>
              <p className="text-3xl font-bold text-gray-900">{value}</p>
            </div>
            <div className={`p-3 rounded-full ${color}`}>
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        </Link>
      ) : (
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-3xl font-bold text-gray-900">{value}</p>
          </div>
          <div className={`p-3 rounded-full ${color}`}>
            <span className="text-2xl">{icon}</span>
          </div>
        </div>
      )}
    </div>
  );

  const QuickActionCard = ({ title, description, icon, link, color }) => (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-all duration-200 hover:-translate-y-1">
        <div className={`inline-flex p-3 rounded-lg ${color} mb-4`}>
          <span className="text-2xl">{icon}</span>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
      </div>
    </Link>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Welcome to Student Attendance System
        </h1>
        <p className="text-xl text-gray-600">
          Manage students, classes, and track attendance efficiently
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Students"
          value={stats.students}
          icon="👥"
          color="bg-blue-100 text-blue-600"
          link="/students"
        />
        <StatCard
          title="Total Classes"
          value={stats.classes}
          icon="📚"
          color="bg-green-100 text-green-600"
          link="/classes"
        />
        <StatCard
          title="Attendance Records"
          value={stats.attendance}
          icon="✅"
          color="bg-purple-100 text-purple-600"
          link="/attendance"
        />
        <StatCard
          title="Attendance Rate"
          value={`${stats.attendancePercentage}%`}
          icon="📊"
          color="bg-orange-100 text-orange-600"
        />
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <QuickActionCard
            title="Add New Student"
            description="Register a new student in the system"
            icon="👤"
            link="/students"
            color="bg-blue-100 text-blue-600"
          />
          <QuickActionCard
            title="Create New Class"
            description="Set up a new class with subject and teacher"
            icon="📖"
            link="/classes"
            color="bg-green-100 text-green-600"
          />
          <QuickActionCard
            title="Mark Attendance"
            description="Record attendance for students"
            icon="✏️"
            link="/attendance"
            color="bg-purple-100 text-purple-600"
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-blue-100 rounded-full">
              <span className="text-blue-600">📊</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">System Overview</p>
              <p className="text-sm text-gray-600">
                {stats.students} students enrolled in {stats.classes} classes
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="p-2 bg-green-100 rounded-full">
              <span className="text-green-600">✅</span>
            </div>
            <div>
              <p className="font-medium text-gray-900">Attendance Tracking</p>
              <p className="text-sm text-gray-600">
                {stats.attendance} attendance records with {stats.attendancePercentage}% attendance rate
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
