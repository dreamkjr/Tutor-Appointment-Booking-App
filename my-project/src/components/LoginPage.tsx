// Beautiful login page with student selection
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { Student } from '../types/auth';

const LoginPage: React.FC = () => {
  const { login, students, isLoading, error } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showStudentList, setShowStudentList] = useState(false);

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    setShowStudentList(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    const success = await login({ studentId: selectedStudent.id });
    if (!success) {
      // Error is handled by context
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full flex items-center justify-center mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Tutor Scheduling
          </h1>
          <p className="text-gray-600">
            Select your student profile to continue
          </p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Student Selection */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Student Profile
              </label>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStudentList(!showStudentList)}
                  className="w-full bg-gray-50 border border-gray-300 rounded-xl px-4 py-3 text-left focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 hover:bg-gray-100"
                >
                  {selectedStudent ? (
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{selectedStudent.avatar}</span>
                      <div>
                        <div className="font-medium text-gray-900">
                          {selectedStudent.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {selectedStudent.major} • {selectedStudent.year}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-500">
                      Choose your student profile...
                    </span>
                  )}
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </button>

                {/* Student Dropdown */}
                {showStudentList && (
                  <div className="absolute z-10 mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
                    {isLoading ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
                        Loading students...
                      </div>
                    ) : students.length === 0 ? (
                      <div className="px-4 py-3 text-center text-gray-500">
                        No students found
                      </div>
                    ) : (
                      students.map((student) => (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() => handleStudentSelect(student)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center space-x-3 border-b border-gray-100 last:border-b-0 transition-colors duration-150"
                        >
                          <span className="text-2xl">{student.avatar}</span>
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {student.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.major} • {student.year}
                            </div>
                            <div className="text-xs text-gray-400">
                              ID: {student.id}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="text-red-800 text-sm">{error}</div>
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={!selectedStudent || isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-blue-700 hover:to-indigo-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Signing in...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>Sign In to Tutor Scheduling</span>
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </div>
              )}
            </button>
          </form>

          {/* Demo Info */}
          <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200">
            <div className="text-sm text-blue-800">
              <div className="font-medium mb-1">📝 Demo Information:</div>
              <ul className="text-xs space-y-1 text-blue-700">
                <li>• Alice Johnson (ID: 1) has 2 appointments</li>
                <li>• Bob Chen (ID: 2) has no appointments</li>
                <li>• Carol Davis (ID: 3) has 2 appointments</li>
                <li>• Select any profile to explore the system</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8 text-gray-500 text-sm">
          <p>University Tutor Scheduling System</p>
          <p className="mt-1">Made with ❤️ for students</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
