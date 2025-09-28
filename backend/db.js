import postgres from 'postgres';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Configure PostgreSQL connection with optimal settings for Supabase
const sql = postgres(connectionString, {
  // Connection pool settings
  max: 20, // Maximum number of connections in pool
  idle_timeout: 20, // Close idle connections after 20 seconds
  connect_timeout: 10, // Timeout for connection attempt in seconds

  // Supabase-specific optimizations
  prepare: false, // Disable prepared statements for transaction pooler

  // Error handling
  onnotice: (notice) => {
    console.log('PostgreSQL Notice:', notice);
  },

  // Debug mode for development
  debug:
    process.env.NODE_ENV === 'development'
      ? (connection, query, parameters) => {
          console.log('SQL Query:', query);
          if (parameters?.length) console.log('Parameters:', parameters);
        }
      : false,

  // Transform column names from snake_case to camelCase
  transform: postgres.camel,

  // Connection retry settings
  connection: {
    application_name: 'tutor-booking-app',
  },
});

// Test the connection
export const testConnection = async () => {
  try {
    await sql`SELECT 1 as test`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await sql.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 Shutting down gracefully...');
  await sql.end();
  process.exit(0);
});

export default sql;
