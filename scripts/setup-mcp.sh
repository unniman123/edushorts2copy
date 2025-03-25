#!/bin/bash

# Install supabase-mcp-server globally
npm install -g @alexander-zuev/supabase-mcp-server

# Create directory for MCP settings if it doesn't exist
mkdir -p "C:\Users\gokul\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings"

# Update MCP settings
cat > "C:\Users\gokul\AppData\Roaming\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json" << EOL
{
  "mcpServers": {
    "github.com/alexander-zuev/supabase-mcp-server": {
      "command": "npx",
      "args": [
        "-y",
        "@alexander-zuev/supabase-mcp-server"
      ],
      "env": {
        "SUPABASE_PROJECT_REF": "zsnofjypqabqzbfmhvnx",
        "SUPABASE_ACCESS_TOKEN": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzbm9manlwcWFicXpiZm1odm54Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTkzODc2NSwiZXhwIjoyMDU3NTE0NzY1fQ.tOdhscyAsJ9LeGDh-KYGPVN6XW-TZQ-tBk6qftFAeXc",
        "SUPABASE_URL": "https://zsnofjypqabqzbfmhvnx.supabase.co",
        "SUPABASE_ANON_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inpzbm9manlwcWFicXpiZm1odm54Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE5Mzg3NjUsImV4cCI6MjA1NzUxNDc2NX0.bxuCEEEbzdy7WuyA6g73MIbhANsjhl6aGEJ4Dx5iAOA"
      },
      "disabled": false,
      "autoApprove": [
        "get_tables",
        "execute_postgresql",
        "get_table_schema",
        "get_schemas",
        "live_dangerously",
        "confirm_destructive_postgresql",
        "send_management_api_request",
        "update_config"
      ]
    }
  }
}
EOL

# Make the script executable
chmod +x setup-mcp.sh
