// Utility functions for date and time formatting with TypeScript type safety

/**
 * Formats a date to display format like "Monday, Sep 29"
 */
export const formatDateHeader = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Formats a date to time format like "10:00 AM"
 */
export const formatTime = (date: Date | string): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
  }).format(dateObj);
};

/**
 * Formats datetime for API calls, ensuring ISO string format
 */
export const formatDateTimeForAPI = (dateTime: Date | string): string => {
  let dateTimeValue: string;
  
  if (dateTime instanceof Date) {
    dateTimeValue = dateTime.toISOString();
  } else if (typeof dateTime === 'string') {
    // Validate the date string
    const testDate = new Date(dateTime);
    if (isNaN(testDate.getTime())) {
      throw new Error('Invalid date format');
    }
    dateTimeValue = testDate.toISOString();
  } else {
    throw new Error('DateTime must be a Date object or valid date string');
  }
  
  return dateTimeValue;
};

/**
 * Validates if a date is valid
 */
export const isValidDate = (date: any): date is Date => {
  return date instanceof Date && !isNaN(date.getTime());
};

/**
 * Validates if a date string can be parsed into a valid date
 */
export const isValidDateString = (dateString: string): boolean => {
  const date = new Date(dateString);
  return isValidDate(date);
};
