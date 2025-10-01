# 🚀 Cloud Deployment Guide for Google Cloud Workstations

This guide explains how to deploy your Tutor Appointment Booking App to Google Cloud Workstations with proper URL handling and CORS configuration.

## 📋 What's Been Fixed

### ✅ Dynamic URL Detection

- Frontend automatically detects if running in Google Cloud Workstations
- Constructs proper backend URLs based on environment
- No more hardcoded localhost URLs!

### ✅ CORS Configuration

- Backend accepts requests from any `*.cloudworkstations.dev` domain
- Proper preflight request handling
- Credentials support for cloud authentication

### ✅ Environment Aware

- Works seamlessly in both local development and cloud deployment
- Automatic configuration switching
- Debug logging for troubleshooting

## 🌐 URL Structure

### Local Development

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- API: `http://localhost:5000/api/v1`

### Google Cloud Workstations

- Frontend: `https://3000-firebase-tutor-appointment-[id].cluster-[region].cloudworkstations.dev`
- Backend: `https://5000-firebase-tutor-appointment-[id].cluster-[region].cloudworkstations.dev`
- API: `https://5000-firebase-tutor-appointment-[id].cluster-[region].cloudworkstations.dev/api/v1`

## 🚀 Deployment Steps

### 1. Start Backend (Port 5000)

```bash
cd backend
npm start
```

### 2. Start Frontend (Port 3000)

```bash
cd my-project  # or frontend directory
npm start
```

### 3. Verify URLs

The frontend will automatically log the detected environment:

```
🌍 Environment Configuration: {
  apiUrl: "https://5000-firebase-tutor-appointment-xxx.cloudworkstations.dev/api/v1",
  isCloudWorkstation: true,
  frontendUrl: "https://3000-firebase-tutor-appointment-xxx.cloudworkstations.dev",
  backendUrl: "https://5000-firebase-tutor-appointment-xxx.cloudworkstations.dev"
}
```

## 🔧 Troubleshooting

### CORS Errors

If you still see CORS errors:

1. **Check Backend Logs**: Look for "CORS blocked origin" messages
2. **Verify URLs**: Ensure both services are running on correct ports
3. **Clear Browser Cache**: Hard refresh (Ctrl+Shift+R)

### Database Connection

For cloud deployment, you have several options:

1. **Use Supabase** (recommended for cloud):

   - Already configured in your `.env`
   - Works from any location

2. **Cloud SQL** (for Google Cloud):

   - Set up a PostgreSQL instance
   - Update `DATABASE_URL` in `.env`

3. **Local Database** (development only):
   - Run PostgreSQL container locally
   - Use the provided scripts

### Authentication Issues

If you see authentication redirects:

1. **Check Credentials**: Ensure `credentials: 'include'` is working
2. **Verify Domains**: Both frontend and backend must be on same base domain
3. **Clear Cookies**: Browser might have stale authentication data

## 📊 Monitoring

### Health Check

Visit: `https://5000-[your-domain]/health`

Should return:

```json
{
  "status": "ok",
  "timestamp": "2025-10-01T...",
  "database": "connected",
  "environment": "development"
}
```

### API Test

Visit: `https://5000-[your-domain]/api/v1/students`

Should return student data (if database is connected).

## 🔒 Security Notes

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **CORS Origins**: In production, specify exact domains instead of wildcards
3. **Rate Limiting**: Adjust limits in `.env` for production traffic
4. **HTTPS**: Always use HTTPS in production (automatic in Cloud Workstations)

## 🎯 Expected Behavior

After deployment:

1. ✅ Frontend loads without errors
2. ✅ API calls succeed (check Network tab)
3. ✅ Student list loads correctly
4. ✅ Booking functionality works
5. ✅ "My Bookings" shows appointments

## 🆘 Getting Help

If you encounter issues:

1. **Check Browser Console**: Look for network errors
2. **Check Backend Logs**: See CORS and database messages
3. **Verify Environment**: Check the logged configuration
4. **Test Health Endpoint**: Ensure backend is accessible

The system now automatically handles both local and cloud deployments! 🎉
