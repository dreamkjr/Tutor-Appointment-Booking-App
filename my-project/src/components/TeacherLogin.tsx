// Teacher login page component
import React, { useState } from 'react';
import { UserIcon, CheckCircleIcon } from './ui/Icons';

interface TeacherLoginProps {
  onLogin: (teacherId: number, teacherName: string) => void;
}

const TeacherLogin: React.FC<TeacherLoginProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Mock teachers for demo - in real app, this would come from API
  const mockTeachers = [
    {
      id: 1,
      name: 'John Smith',
      email: 'john.math@example.com',
      subject: 'Mathematics',
    },
    {
      id: 4,
      name: 'Sarah Wilson',
      email: 'sarah.english@example.com',
      subject: 'English',
    },
  ];

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const teacher = mockTeachers.find(
        (t) => t.email.toLowerCase() === email.toLowerCase()
      );

      if (teacher) {
        onLogin(teacher.id, teacher.name);
      } else {
        setError('Teacher not found. Please check your email address.');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100">
            <UserIcon className="h-8 w-8 text-blue-600" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Teacher Portal
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sign in to manage your schedule and subjects
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Email address"
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">
                  Demo Accounts
                </span>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {mockTeachers.map((teacher) => (
                <div
                  key={teacher.id}
                  onClick={() => setEmail(teacher.email)}
                  className="cursor-pointer p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-4 w-4 text-blue-600 mr-2" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {teacher.name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {teacher.email}
                      </div>
                      <div className="text-xs text-blue-600">
                        {teacher.subject} Teacher
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeacherLogin;
