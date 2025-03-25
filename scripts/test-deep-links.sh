#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Function to display section headers
header() {
    echo -e "\n${BOLD}${GREEN}=== $1 ===${NC}\n"
}

# Function to display test steps
step() {
    echo -e "${YELLOW}➜ $1${NC}"
}

# Function to display errors
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to display success messages
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# Check if required tools are installed
check_requirements() {
    header "Checking Requirements"
    
    if ! command -v expo &> /dev/null; then
        error "expo-cli is not installed. Please install it using: npm install -g expo-cli"
        exit 1
    fi
    success "expo-cli is installed"

    if ! command -v adb &> /dev/null; then
        step "adb not found. Android testing may not be available"
    else
        success "adb is installed"
    fi

    if ! command -v xcrun &> /dev/null; then
        step "xcrun not found. iOS testing may not be available"
    else
        success "xcrun is installed"
    fi
}

# Test email confirmation deep link
test_email_confirmation() {
    header "Testing Email Confirmation Deep Link"
    
    # Test development URL
    step "Testing development URL..."
    expo url "exp://localhost:19000/--/auth/confirm?token=test-token"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        step "Testing iOS Simulator..."
        xcrun simctl openurl booted "exp://localhost:19000/--/auth/confirm?token=test-token"
    fi

    if command -v adb &> /dev/null; then
        step "Testing Android Emulator..."
        adb shell am start -W -a android.intent.action.VIEW \
            -d "exp://localhost:19000/--/auth/confirm?token=test-token"
    fi
}

# Test password reset deep link
test_password_reset() {
    header "Testing Password Reset Deep Link"
    
    # Test development URL
    step "Testing development URL..."
    expo url "exp://localhost:19000/--/auth/reset-password?token=test-token"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        step "Testing iOS Simulator..."
        xcrun simctl openurl booted "exp://localhost:19000/--/auth/reset-password?token=test-token"
    fi

    if command -v adb &> /dev/null; then
        step "Testing Android Emulator..."
        adb shell am start -W -a android.intent.action.VIEW \
            -d "exp://localhost:19000/--/auth/reset-password?token=test-token"
    fi
}

# Test production URLs
test_production_urls() {
    header "Testing Production Deep Links"
    
    step "Testing email confirmation..."
    expo url "edushorts://auth/confirm?token=test-token"
    
    step "Testing password reset..."
    expo url "edushorts://auth/reset-password?token=test-token"
}

# Main execution
header "Deep Linking Test Script"
echo "This script will test various deep linking scenarios."

# Check requirements first
check_requirements

# Ensure Expo development server is running
header "Checking Expo Server"
if ! curl -s http://localhost:19000 > /dev/null; then
    error "Expo development server is not running!"
    step "Please start the server with 'expo start' and try again"
    exit 1
fi
success "Expo development server is running"

# Run tests
test_email_confirmation
test_password_reset
test_production_urls

header "Test Complete"
echo -e "Remember to check the app's response to each deep link."
echo -e "For manual testing URLs:"
echo -e "${YELLOW}Development:${NC}"
echo "  exp://localhost:19000/--/auth/confirm?token=test-token"
echo "  exp://localhost:19000/--/auth/reset-password?token=test-token"
echo -e "${YELLOW}Production:${NC}"
echo "  edushorts://auth/confirm?token=test-token"
echo "  edushorts://auth/reset-password?token=test-token"
