// Header component with user profile and logout functionality
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    setShowDropdown(false);
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto max-w-4xl px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">🎓</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                Tutor Scheduling
              </h1>
            </div>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center space-x-3 px-3 py-2 rounded-xl hover:bg-gray-50 transition-colors duration-200 border border-gray-200"
            >
              <span className="text-2xl">{user.avatar}</span>
              <div className="text-left hidden sm:block">
                <div className="text-sm font-medium text-gray-900">
                  {user.name}
                </div>
                <div className="text-xs text-gray-500">{user.major}</div>
              </div>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                  showDropdown ? 'transform rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <>
                {/* Backdrop */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />

                {/* Dropdown Content */}
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-200 z-20">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-100">
                    <div className="flex items-center space-x-3">
                      <span className="text-3xl">{user.avatar}</span>
                      <div className="flex-1">
                        <div className="font-semibold text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          {user.email}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {user.major} • {user.year} • ID: {user.id}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="py-2">
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-3 text-left hover:bg-red-50 flex items-center space-x-3 text-red-600 transition-colors duration-150"
                    >
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
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      <div>
                        <div className="font-medium">Sign Out</div>
                        <div className="text-xs text-red-500">
                          Switch to different student
                        </div>
                      </div>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
