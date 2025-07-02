// Environment configuration
export const config = {
    supabase: {
      url: process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nluuvtwlkmlctyptujtk.supabase.co',
      anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5sdXV2dHdsa21sY3R5cHR1anRrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3Mzk0NjQsImV4cCI6MjA2NjMxNTQ2NH0.AsY3yMEi-Gv6Dg57kZmlV-BdhH3orwhhtj-p8c7micY',
    },
    app: {
      name: 'UniConnect',
      version: '1.0.0',
    },
  } as const;
  
  // Type definitions for environment variables
  declare global {
    namespace NodeJS {
      interface ProcessEnv {
        EXPO_PUBLIC_SUPABASE_URL: string;
        EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
      }
    }
  } 