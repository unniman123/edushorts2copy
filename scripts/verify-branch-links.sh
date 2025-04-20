#!/bin/bash

# Basic test script to verify Branch.io deep linking functionality

TEST_ARTICLE_ID="test_article_123"
BRANCH_LINK="https://lh1wg.app.link/article/$TEST_ARTICLE_ID"

echo "Branch.io Deep Link Testing"
echo "=========================="
echo ""

# Test 1: App in foreground
echo "Test 1: App in foreground"
echo "Opening link: $BRANCH_LINK"
adb shell am start -W -a android.intent.action.VIEW -d "$BRANCH_LINK"
sleep 2

# Test 2: App in background
echo -e "\nTest 2: App in background"
echo "1. Press home button to put app in background"
echo "2. Press Enter to continue test"
read -p ""
adb shell am start -W -a android.intent.action.VIEW -d "$BRANCH_LINK"
sleep 2

# Test 3: Cold start (app not running)
echo -e "\nTest 3: Cold start"
echo "1. Force stopping app..."
adb shell am force-stop com.ajilkojilgokulravi.unniman
sleep 1
echo "2. Opening link..."
adb shell am start -W -a android.intent.action.VIEW -d "$BRANCH_LINK"
sleep 2

# Test 4: Deferred deep linking
echo -e "\nTest 4: Deferred deep linking"
echo "1. Uninstalling app..."
adb uninstall com.ajilkojilgokulravi.unniman
sleep 1
echo "2. Opening link (should redirect to Play Store)..."
adb shell am start -W -a android.intent.action.VIEW -d "$BRANCH_LINK"

echo -e "\nTesting complete!"
echo "Please verify that:"
echo "✓ Link opened article in foreground"
echo "✓ Link opened article from background"
echo "✓ Link opened article from cold start"
echo "✓ Link redirected to store when app not installed"
