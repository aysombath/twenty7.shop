import { neon } from '@neondatabase/serverless';

/**
 * Architectural Database Connection
 * Precision Atelier HQ - 2026 Index
 * 
 * Securely uses the DATABASE_URL to establish a serverless pooled connection.
 */
if (!process.env.DATABASE_URL) {
  console.warn("Neon DATABASE_URL is not set in environments. Please configure your .env file with appropriate credentials.");
}

export const sql = neon(process.env.DATABASE_URL || "");
