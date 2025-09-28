# Frontend Architecture - React Best Practices

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # Base UI components (Modal, Icons)
│   ├── BookingTab.jsx   # Booking interface component
│   ├── MyBookingsTab.jsx # User bookings management
│   ├── ModalContent.jsx # Modal content components
│   ├── TabNavigation.jsx # Tab switching component
│   ├── TimeSlotPicker.jsx # Time slot selection component
│   └── index.js         # Barrel exports for cleaner imports
├── hooks/               # Custom React hooks for business logic
│   ├── useAppointments.js # Appointment data management
│   └── useModal.js      # Modal state management
├── utils/               # Utility functions
│   └── dateUtils.js     # Date/time formatting utilities
├── constants/           # Application constants
│   └── index.js         # Global constants and styles
├── services/            # API communication
│   └── apiService.js    # Backend API interface
└── App.jsx             # Main application component
```

## 🏗️ Architecture Benefits

### 1. **Separation of Concerns**

- **Components**: Handle UI rendering and user interactions
- **Hooks**: Manage business logic and state
- **Utils**: Provide reusable utility functions
- **Services**: Handle external API communication

### 2. **Reusability**

- Components can be easily reused across different parts of the app
- Custom hooks can be shared between components
- Utilities can be used anywhere in the application

### 3. **Maintainability**

- Each file has a single responsibility
- Easy to locate and fix bugs
- Changes to one component don't affect others

### 4. **Scalability**

- Easy to add new components and features
- Clear structure for team collaboration
- Simple to extend functionality

### 5. **Testing**

- Individual components can be tested in isolation
- Business logic in hooks can be tested separately
- Utilities can have comprehensive unit tests

## 🎯 Component Responsibilities

### **App.jsx** (Main Container)

- Manages global application state
- Orchestrates component interactions
- Handles routing between tabs

### **Custom Hooks**

- `useAppointments`: Manages appointment CRUD operations
- `useModal`: Handles modal state and transitions

### **UI Components**

- `TimeSlotPicker`: Displays and handles slot selection
- `BookingTab`: Booking interface with available slots
- `MyBookingsTab`: User's current appointments management
- `ModalContent`: Various modal dialogs for confirmations

### **Utility Functions**

- `dateUtils`: Date/time formatting for consistent display
- `constants`: Global application constants and styles

## 🔄 Data Flow

1. **App.jsx** uses custom hooks for state management
2. **Hooks** communicate with API services
3. **Components** receive data and callbacks from App.jsx
4. **User interactions** trigger callbacks that update state through hooks
5. **State changes** re-render affected components

## 🚀 Best Practices Implemented

1. **Single Responsibility Principle**: Each file has one clear purpose
2. **Custom Hooks**: Business logic separated from UI components
3. **Prop Drilling Minimization**: State managed at appropriate levels
4. **Consistent Naming**: Clear, descriptive component and function names
5. **Error Handling**: Centralized error management in hooks
6. **Loading States**: Proper loading indicators for async operations
7. **Type Safety**: Consistent prop passing and validation

## 🔧 How to Extend

### Adding a New Component

1. Create file in appropriate `/components` subdirectory
2. Export from `/components/index.js` for clean imports
3. Import and use in parent components

### Adding Business Logic

1. Create custom hook in `/hooks` directory
2. Implement state management and API calls
3. Return state and action functions
4. Use in components that need the functionality

### Adding Utilities

1. Add function to appropriate file in `/utils`
2. Export from the utility file
3. Import where needed

This architecture follows React best practices and makes the codebase maintainable, testable, and scalable.
