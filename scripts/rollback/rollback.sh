#!/bin/bash

# Function to display error messages
error() {
    echo "ERROR: $1" >&2
    exit 1
}

# Function to display success messages
success() {
    echo "SUCCESS: $1"
}

# Function to log actions
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Rollback app.config.js
rollback_app_config() {
    log "Rolling back app.config.js..."
    if cp scripts/rollback/backup-app.config.js app.config.js; then
        success "Successfully rolled back app.config.js"
    else
        error "Failed to rollback app.config.js"
    fi
}

# Log start of rollback
log "Starting rollback process..."

# Check if backup exists
if [ ! -f "scripts/rollback/backup-app.config.js" ]; then
    error "Backup file not found!"
fi

# Display confirmation prompt
echo "Are you sure you want to rollback the changes? (y/N)"
read -r response

if [[ "$response" =~ ^[Yy]$ ]]; then
    # Perform rollbacks
    rollback_app_config
    
    # Reminder about Supabase settings
    echo "Note: To rollback Supabase settings, use the Supabase MCP server with:"
    echo "send_management_api_request to revert auth configuration"
else
    log "Rollback cancelled by user"
    exit 0
fi

log "Rollback process completed"
