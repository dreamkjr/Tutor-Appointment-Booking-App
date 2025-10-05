// Enhanced App component with teacher portal support
import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import StudentApp from './StudentApp';
import TeacherPortal from './components/TeacherPortal';
import { GLOBAL_STYLES } from './constants';

type UserType = 'student' | 'teacher' | null;

const App: React.FC = () => {
  const [userType, setUserType] = useState<UserType>(null);

  const selectUserType = (type: UserType) => {
    setUserType(type);
  };

  const resetUserType = () => {
    setUserType(null);
  };

  // Landing page for user type selection
  if (!userType) {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
          <div className="max-w-md w-full">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Tutor Booking System
              </h1>
              <p className="text-gray-600">
                Choose how you'd like to access the platform
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => selectUserType('student')}
                className="w-full bg-white p-6 rounded-lg shadow-md hover:shadow-lg border border-gray-200 hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a Student</h3>
                    <p className="text-gray-600 text-sm">Book tutoring sessions with teachers</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => selectUserType('teacher')}
                className="w-full bg-white p-6 rounded-lg shadow-md hover:shadow-lg border border-gray-200 hover:border-blue-300 transition-all text-left"
              >
                <div className="flex items-center">
                  <div className="bg-green-100 p-3 rounded-full mr-4">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">I'm a Teacher</h3>
                    <p className="text-gray-600 text-sm">Manage schedule and subjects</p>
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Demo application for tutoring appointment management
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render based on selected user type
  if (userType === 'teacher') {
    return (
      <div>
        <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
        <TeacherPortal />
        <button
          onClick={resetUserType}
          className="fixed bottom-4 right-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
        >
          Switch User Type
        </button>
      </div>
    );
  }

  // Student app with AuthProvider
  return (
    <div>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_STYLES }} />
      <AuthProvider>
        <StudentApp />
        <button
          onClick={resetUserType}
          className="fixed bottom-4 right-4 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm"
        >
          Switch User Type
        </button>
      </AuthProvider>
    </div>
  );
};

export default App;