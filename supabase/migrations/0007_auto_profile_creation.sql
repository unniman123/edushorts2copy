  -- Begin transaction
  BEGIN;

  -- Temporarily modify the profiles table to handle password_hash
  ALTER TABLE public.profiles ALTER COLUMN password_hash DROP NOT NULL;

  -- Create trigger function for auto-creating profiles and preferences
  CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Create profile with a default hashed value for password_hash
    INSERT INTO public.profiles (
      id,
      email,
      password_hash,
      full_name,
      is_admin,
      created_at
    ) VALUES (
      NEW.id,
      NEW.email,
      'HANDLED_BY_SUPABASE_AUTH',
      COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
      COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false),
      NOW()
    );
    
    -- Create user preferences with defaults (if table exists)
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
      INSERT INTO public.user_preferences (
        user_id,
        notifications_enabled,
        dark_mode_enabled
      ) VALUES (
        NEW.id,
        true,
        false
      );
    END IF;
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql SECURITY DEFINER;

  -- Create trigger
  DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();

  -- Insert your profile if it doesn't exist
  INSERT INTO public.profiles (
    id,
    email,
    password_hash,
    full_name,
    is_admin,
    created_at
  ) VALUES (
    '9949bd40-3067-40c4-8fad-177995bb65c5',
    'gokulravindran08@gmail.com',
    'HANDLED_BY_SUPABASE_AUTH',
    'Gokul Ravindran',
    true,
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    is_admin = true,
    updated_at = NOW();

  -- Create preferences if they don't exist (and if table exists)
  DO $$
  BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
      INSERT INTO public.user_preferences (
        user_id,
        notifications_enabled,
        dark_mode_enabled
      ) VALUES (
        '9949bd40-3067-40c4-8fad-177995bb65c5',
        true,
        false
      ) ON CONFLICT (user_id) DO UPDATE SET
        notifications_enabled = EXCLUDED.notifications_enabled,
        updated_at = NOW();
    END IF;
  END $$;

  -- Re-enable NOT NULL constraint with the default value
  ALTER TABLE public.profiles ALTER COLUMN password_hash SET DEFAULT 'HANDLED_BY_SUPABASE_AUTH';
  ALTER TABLE public.profiles ALTER COLUMN password_hash SET NOT NULL;

  -- Update any NULL password_hash values to the default
  UPDATE public.profiles 
  SET password_hash = 'HANDLED_BY_SUPABASE_AUTH' 
  WHERE password_hash IS NULL;

  COMMIT;
