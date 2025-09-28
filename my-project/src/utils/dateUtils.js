// Utility functions for date and time formatting
export const formatDateHeader = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

export const formatTime = (date) => {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(date);
};

// Utility function to format datetime for API calls
export const formatDateTimeForAPI = (dateTime) => {
  let dateTimeValue = dateTime;
  if (dateTimeValue instanceof Date) {
    dateTimeValue = dateTimeValue.toISOString();
  } else if (typeof dateTimeValue === 'string') {
    // Make sure it's a valid date string
    const testDate = new Date(dateTimeValue);
    if (isNaN(testDate.getTime())) {
      throw new Error('Invalid date format');
    }
    dateTimeValue = testDate.toISOString();
  }
  return dateTimeValue;
};
