-- Supabase Schema and RLS Policy Backup for public.profiles
-- Generated on: 2025-04-01T00:07:40+05:30

-- ============================================================================
-- Table Schema Details: public.profiles
-- Retrieved via Supabase MCP get_table_schema tool
-- ============================================================================

/*
[
  {
    "rows": [
      {
        "column_name": "id",
        "data_type": "uuid",
        "is_nullable": "NO",
        "column_default": null,
        "ordinal_position": 1,
        "foreign_table_name": "users",
        "foreign_column_name": "id",
        "column_description": null,
        "is_primary_key": true
      },
      {
        "column_name": "username",
        "data_type": "text",
        "is_nullable": "YES",
        "column_default": null,
        "ordinal_position": 2,
        "foreign_table_name": null,
        "foreign_column_name": null,
        "column_description": null,
        "is_primary_key": false
      },
      {
        "column_name": "avatar_url",
        "data_type": "text",
        "is_nullable": "YES",
        "column_default": null,
        "ordinal_position": 3,
        "foreign_table_name": null,
        "foreign_column_name": null,
        "column_description": null,
        "is_primary_key": false
      },
      {
        "column_name": "notification_preferences",
        "data_type": "jsonb",
        "is_nullable": "YES",
        "column_default": "'{\"push\": true, \"email\": false}'::jsonb",
        "ordinal_position": 4,
        "foreign_table_name": null,
        "foreign_column_name": null,
        "column_description": null,
        "is_primary_key": false
      },
      {
        "column_name": "created_at",
        "data_type": "timestamp with time zone",
        "is_nullable": "NO",
        "column_default": "now()",
        "ordinal_position": 5,
        "foreign_table_name": null,
        "foreign_column_name": null,
        "column_description": null,
        "is_primary_key": false
      },
      {
        "column_name": "updated_at",
        "data_type": "timestamp with time zone",
        "is_nullable": "NO",
        "column_default": "now()",
        "ordinal_position": 6,
        "foreign_table_name": null,
        "foreign_column_name": null,
        "column_description": null,
        "is_primary_key": false
      }
    ]
  }
]
*/

-- Note: For the exact CREATE TABLE statement including constraints and indexes,
-- refer to the Supabase Dashboard (Database -> Tables -> profiles -> Definition)
-- or use a dedicated schema migration tool.

-- ============================================================================
-- Row Level Security (RLS) Policies: public.profiles
-- Retrieved via Supabase MCP execute_postgresql tool
-- Query: SELECT policyname AS policy_name, schemaname AS schema_name, tablename AS table_name, cmd AS command_type, permissive, roles, qual AS using_expression, with_check AS check_expression FROM pg_catalog.pg_policies WHERE schemaname = 'public' AND tablename = 'profiles';
-- ============================================================================

/*
[
  {
    "rows": [
      {
        "policy_name": "Users can insert their own profile",
        "schema_name": "public",
        "table_name": "profiles",
        "command_type": "INSERT",
        "permissive": "PERMISSIVE",
        "roles": [
          "public"
        ],
        "using_expression": null,
        "check_expression": "(auth.uid() = id)"
      },
      {
        "policy_name": "Users can read their own profile",
        "schema_name": "public",
        "table_name": "profiles",
        "command_type": "SELECT",
        "permissive": "PERMISSIVE",
        "roles": [
          "public"
        ],
        "using_expression": "((auth.uid() = id) OR is_admin(auth.uid()))",
        "check_expression": null
      },
      {
        "policy_name": "Users can update their own profile",
        "schema_name": "public",
        "table_name": "profiles",
        "command_type": "UPDATE",
        "permissive": "PERMISSIVE",
        "roles": [
          "public"
        ],
        "using_expression": "(auth.uid() = id)",
        "check_expression": null
      }
    ]
  }
]
*/

-- Example Reconstruction (for reference only, verify against actual definitions):

-- POLICY "Users can insert their own profile" ON public.profiles FOR INSERT TO public WITH CHECK (auth.uid() = id);
-- POLICY "Users can read their own profile" ON public.profiles FOR SELECT TO public USING (((auth.uid() = id) OR is_admin(auth.uid())));
-- POLICY "Users can update their own profile" ON public.profiles FOR UPDATE TO public USING (auth.uid() = id);

-- End of Backup --
