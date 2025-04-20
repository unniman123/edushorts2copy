#!/bin/bash

# Make script executable: chmod +x ./scripts/test-branch-links.sh
# Run: ./scripts/test-branch-links.sh [android|ios]

# Default to android if no platform specified
PLATFORM=${1:-android}


# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test article ID
TEST_ARTICLE_ID="test-article-123"

echo -e "${BLUE}Branch.io Deep Link Testing Script${NC}\n"

check_requirements() {
    if [ "$PLATFORM" = "android" ]; then
        # Check for ADB
        if ! command -v adb &> /dev/null; then
            echo -e "${RED}Error: ADB is not installed or not in PATH${NC}"
            exit 1
        fi

        # Check if Android device is connected
        if ! adb devices | grep -q "device$"; then
            echo -e "${RED}Error: No Android device connected${NC}"
            echo "Please connect a device or start an emulator"
            exit 1
        fi
    elif [ "$PLATFORM" = "ios" ]; then
        # Check for xcrun
        if ! command -v xcrun &> /dev/null; then
            echo -e "${RED}Error: xcrun is not installed${NC}"
            exit 1
        fi
        
        # Check if iOS simulator is running
        if ! xcrun simctl list devices | grep -q "Booted"; then
            echo -e "${RED}Error: No iOS simulator is running${NC}"
            echo "Please start an iOS simulator"
            exit 1
        fi
    else
        echo -e "${RED}Error: Invalid platform. Use 'android' or 'ios'${NC}"
        exit 1
    fi
}

# Check requirements before starting
check_requirements

# Function to test a deep link
test_link() {
    local url=$1
    local description=$2
    
    echo -e "\n${YELLOW}Testing: ${description}${NC}"
    echo "URL: ${url}"
    
    if [ "$PLATFORM" = "android" ]; then
        adb shell am start -W -a android.intent.action.VIEW -d "$url" || {
            echo -e "${RED}Failed to open URL${NC}"
            return 1
        }
    else
        xcrun simctl openurl booted "$url" || {
            echo -e "${RED}Failed to open URL${NC}"
            return 1
        }
    fi
    
    echo -e "${GREEN}Link opened successfully${NC}"
    sleep 2 # Wait for app to respond
}

echo -e "${BLUE}Starting deep link tests...${NC}\n"

# Test 1: Branch.io link
test_link "https://lh1wg.app.link/article/$TEST_ARTICLE_ID" "Branch.io direct link"

# Test 2: Branch.io alternate link
test_link "https://lh1wg-alternate.app.link/article/$TEST_ARTICLE_ID" "Branch.io alternate link"

# Test 3: Custom scheme
test_link "edushort://article/$TEST_ARTICLE_ID" "Custom scheme link"

# Test 4: Branch.io link with additional parameters
test_link "https://lh1wg.app.link/article/$TEST_ARTICLE_ID?utm_source=test&utm_medium=script" "Branch.io link with UTM parameters"

echo -e "\n${BLUE}Testing deferred deep linking...${NC}"
echo "1. Uninstall the app (if installed)"
echo "2. Click a Branch link"
echo "3. Install the app from Play Store"
echo "4. Verify the app opens to the correct article"

read -p "Press enter to continue with deferred deep linking test..."

# Handle app uninstallation for deferred deep linking test
if [ "$PLATFORM" = "android" ]; then
    adb shell pm list packages | grep -q "com.ajilkojilgokulravi.unniman" && {
        echo "Uninstalling existing app..."
        adb uninstall com.ajilkojilgokulravi.unniman
    }
else
    xcrun simctl uninstall booted com.ajilkojilgokulravi.unniman 2>/dev/null
fi

# Open Branch link
test_link "https://lh1wg.app.link/article/$TEST_ARTICLE_ID" "Deferred deep linking test"

echo -e "\n${GREEN}Test script completed${NC}"
echo -e "${YELLOW}Please manually verify that:${NC}"
echo "✓ Links open the app"
echo "✓ App navigates to correct article"
echo "✓ Deferred deep linking works"
echo "✓ UTM parameters are tracked in Branch dashboard"
