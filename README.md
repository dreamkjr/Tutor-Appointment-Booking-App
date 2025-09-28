# Tutor Appointment Booking System

A full-stack application for booking tutoring appointments with a React frontend and Express.js backend using PostgreSQL (Supabase).

## 🏗️ Architecture

- **Frontend**: React.js with TailwindCSS
- **Backend**: Express.js with RESTful API
- **Database**: PostgreSQL (Supabase)
- **Connection**: Transaction Pooler for optimal performance

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## 🚀 Setup Instructions

### 1. Clone and Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/dreamkjr/Tutor-Appointment-Booking-App.git
   cd Tutor-Appointment-Booking-App
   ```

### 2. Backend Setup

1. **Navigate to the backend directory:**

   ```bash
   cd backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Set up environment variables:**

   - Copy `.env.example` to `.env`
   - Update the `DATABASE_URL` with your Supabase credentials:

   ```env
   DATABASE_URL=postgresql://postgres.watcahjucutswvyfytjs:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
   ```

   - Replace `[YOUR-PASSWORD]` with your actual Supabase database password

4. **Set up the database:**

   ```bash
   npm run setup-db
   ```

5. **Start the backend server:**

   ```bash
   npm run dev
   ```

   The backend will be running on `http://localhost:5000`

### 3. Frontend Setup

1. **Navigate to the frontend directory:**

   ```bash
   cd my-project
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Start the frontend development server:**

   ```bash
   npm start
   ```

   The frontend will be running on `http://localhost:3000`

## 🗄️ Database Schema

The system uses the following main tables:

### Users Table

- `id` (Primary Key)
- `email` (Unique)
- `name`
- `role` ('tutor' or 'student')
- `phone`
- `created_at`, `updated_at`

### Tutors Table

- `id` (Primary Key)
- `user_id` (Foreign Key to Users)
- `subject`
- `experience_years`
- `hourly_rate`
- `bio`
- `availability_start`, `availability_end`
- `is_active`
- `created_at`, `updated_at`

### Appointments Table

- `id` (Primary Key)
- `student_id` (Foreign Key to Users)
- `tutor_id` (Foreign Key to Tutors)
- `appointment_date`
- `start_time`, `end_time`
- `status` ('scheduled', 'completed', 'cancelled', 'rescheduled')
- `notes`
- `created_at`, `updated_at`

## 🔌 API Endpoints

### Appointments

- `GET /api/v1/appointments` - Get all appointments for a student
- `GET /api/v1/appointments/available-slots` - Get available time slots
- `POST /api/v1/appointments` - Book a new appointment
- `PUT /api/v1/appointments/:id` - Update an existing appointment
- `DELETE /api/v1/appointments/:id` - Cancel an appointment

### Health Check

- `GET /health` - API health status

## 🔧 Configuration Options

### Supabase Connection Types

**Transaction Pooler (Recommended)**

```env
DATABASE_URL=postgresql://postgres.watcahjucutswvyfytjs:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres
```

**Direct Connection**

```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.watcahjucutswvyfytjs.supabase.co:5432/postgres
```

**Session Pooler**

```env
DATABASE_URL=postgresql://postgres.watcahjucutswvyfytjs:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

## 🔍 Testing the Setup

1. **Check backend health:**

   ```bash
   curl http://localhost:5000/health
   ```

2. **Test API endpoints:**

   ```bash
   # Get available slots
   curl http://localhost:5000/api/v1/appointments/available-slots

   # Get appointments
   curl http://localhost:5000/api/v1/appointments
   ```

3. **Frontend should display:**
   - Available time slots in the Booking tab
   - Existing appointments in the My Bookings tab
   - Ability to book, edit, and cancel appointments

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Uses nodemon for auto-restart
```

### Frontend Development

```bash
cd my-project
npm start  # React development server
```

### Database Management

```bash
cd backend
npm run setup-db  # Recreate database schema and sample data
```

## � Security Notes

⚠️ **IMPORTANT**: Never commit your `.env` file to GitHub!

- The `.env` file contains your database password and other sensitive information
- Always use `.env.example` as a template for others to set up their environment
- The `.gitignore` file is configured to exclude `.env` files from being committed
- For production deployment, set environment variables directly in your hosting platform

## �📦 Production Deployment

1. Set environment variables for production
2. Update CORS origins in `backend/server.js`
3. Build the frontend: `npm run build`
4. Deploy backend and frontend to your hosting platform
5. Update the API URL in the frontend environment variables

## 🚨 Troubleshooting

### Database Connection Issues

1. Verify your Supabase password
2. Check if your IP is whitelisted in Supabase
3. Try using the transaction pooler connection string
4. Ensure the database exists and is accessible

### API Not Loading

1. Check if backend server is running on port 5000
2. Verify CORS configuration allows frontend origin
3. Check browser developer tools for network errors

### Frontend Errors

1. Ensure backend is running before starting frontend
2. Check if API service URLs are correct
3. Verify network connectivity between frontend and backend

## 📝 Sample Data

The setup script creates sample data including:

- 2 tutors (John Smith - Mathematics, Sarah Wilson - English)
- 2 students (Jane Doe, Mike Johnson)
- 3 sample appointments for the next few days

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.
