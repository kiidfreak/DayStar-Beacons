# Database Migration Instructions

## Adding Device Binding to Your Database

To enable real device binding security, you need to add the required columns to your database.

### Option 1: Manual Migration (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Run the Migration SQL**
   - Copy and paste the contents of `database_migration.sql` into the SQL Editor
   - Click "Run" to execute the migration

3. **Verify the Changes**
   - Go to Table Editor
   - Check that the `users` table now has:
     - `device_id` column (VARCHAR, UNIQUE)
     - `device_info` column (JSONB)
     - `device_registered_at` column (TIMESTAMP)
   - Check that a new `device_change_requests` table was created

### Option 2: Using the Migration Script

1. **Install Dependencies**
   ```bash
   npm install dotenv
   ```

2. **Set Environment Variables**
   - Add your Supabase service role key to `.env`:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
   ```

3. **Run the Migration**
   ```bash
   node scripts/run-migration.js
   ```

### What the Migration Adds

#### Users Table Changes:
- `device_id` - Unique identifier for each device
- `device_info` - JSON object with device details (name, model, platform)
- `device_registered_at` - When the device was first registered

#### New Device Change Requests Table:
- Tracks requests to change devices
- Requires admin approval
- Includes reason and status tracking

#### Security Features:
- Row Level Security (RLS) policies
- Indexes for performance
- Foreign key constraints

### After Migration

Once the migration is complete:

1. **Test Device Binding**
   - Log in to the app
   - The device should be automatically registered
   - Try logging in from a different device (should be blocked)

2. **Test Device Change Requests**
   - Go to Settings > Device Binding
   - Try requesting a device change
   - Check the `device_change_requests` table

3. **Admin Features**
   - Admins can view and approve device change requests
   - Admins can see all device registrations

### Troubleshooting

If you encounter errors:

1. **Check Permissions**
   - Ensure you have admin access to the database
   - Verify the service role key has proper permissions

2. **Check Existing Data**
   - The migration is safe to run multiple times
   - It won't overwrite existing data

3. **Verify RLS Policies**
   - Check that RLS is enabled on the new table
   - Verify policies are working correctly

### Rollback (If Needed)

If you need to rollback the changes:

```sql
-- Remove device binding columns
ALTER TABLE public.users 
DROP COLUMN IF EXISTS device_id,
DROP COLUMN IF EXISTS device_info,
DROP COLUMN IF EXISTS device_registered_at;

-- Drop the device change requests table
DROP TABLE IF EXISTS public.device_change_requests;

-- Drop indexes
DROP INDEX IF EXISTS idx_users_device_id;
DROP INDEX IF EXISTS idx_device_change_requests_user_id;
DROP INDEX IF EXISTS idx_device_change_requests_status;
```

### Security Benefits

After this migration:

✅ **Device Binding** - Each user can only use their registered device  
✅ **Cross-Device Prevention** - Students can't use other students' phones  
✅ **Admin Oversight** - Device changes require admin approval  
✅ **Audit Trail** - All device registrations are logged  
✅ **Secure Attendance** - Attendance can only be recorded from authorized devices  

The device binding system will now work with real database storage and provide comprehensive security for your attendance system. 