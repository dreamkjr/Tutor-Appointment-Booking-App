// Application styles and global CSS constants with TypeScript type safety

export const GLOBAL_STYLES: string = `
  @keyframes fade-in { 
    0% { opacity: 0; } 
    100% { opacity: 1; } 
  }
  .animate-fade-in { 
    animation: fade-in 0.5s ease-in-out; 
  }
  @keyframes fade-in-up { 
    0% { opacity: 0; transform: translateY(20px); } 
    100% { opacity: 1; transform: translateY(0); } 
  }
  .animate-fade-in-up { 
    animation: fade-in-up 0.3s ease-out; 
  }
`;

export const ERROR_MESSAGES = {
  LOAD_BOOKINGS: 'Failed to load your appointments. Please try again.',
  LOAD_SLOTS: 'Failed to load available slots. Please try again.',
  BOOK_APPOINTMENT: 'Failed to book appointment. Please try again.',
  UPDATE_APPOINTMENT: 'Failed to update appointment. Please try again.',
  CANCEL_APPOINTMENT: 'Failed to cancel appointment. Please try again.',
} as const;

export const API_ENDPOINTS = {
  APPOINTMENTS: '/appointments',
  AVAILABLE_SLOTS: '/appointments/available-slots',
  HEALTH: '/health',
} as const;

export const DEFAULT_STUDENT_ID: number = 1;

export const TIME_SLOTS = {
  START_HOUR: 9,
  END_HOUR: 17,
  SLOT_DURATION_MINUTES: 60,
} as const;
