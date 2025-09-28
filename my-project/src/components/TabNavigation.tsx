// Navigation tabs component
import React from 'react';
import type { TabType } from '../types/index';

interface TabNavigationProps {
  activeTab: TabType;
  onTabChange: (tabId: TabType) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs: Array<{ id: TabType; label: string }> = [
    { id: 'booking', label: 'Booking' },
    { id: 'mybookings', label: 'My Bookings' },
  ];

  return (
    <div className="flex justify-center mb-8">
      <div className="inline-flex rounded-lg bg-gray-100 p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabNavigation;
