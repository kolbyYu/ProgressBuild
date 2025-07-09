#!/bin/bash

echo "🔍 Testing Clock Error Handling Improvements..."
echo "=================================================="

# Check if the ClockInScreen.tsx file contains the improved error handling
echo "✅ Checking ClockInScreen.tsx error handling..."
if grep -q "const errorMessage = res.message || res.error || 'Failed to clock in/out';" src/screens/ClockInScreen.tsx; then
    echo "✅ ClockInScreen.tsx: Improved error message handling found"
else
    echo "❌ ClockInScreen.tsx: Improved error message handling not found"
fi

if grep -q "🚨 Clock attendance failed:" src/screens/ClockInScreen.tsx; then
    echo "✅ ClockInScreen.tsx: Enhanced error logging found"
else
    echo "❌ ClockInScreen.tsx: Enhanced error logging not found"
fi

if grep -q "errorTitle = 'Network Error';" src/screens/ClockInScreen.tsx; then
    echo "✅ ClockInScreen.tsx: Network error handling found"
else
    echo "❌ ClockInScreen.tsx: Network error handling not found"
fi

# Check if the API service has improved error handling
echo ""
echo "✅ Checking API service error handling..."
if grep -q "// For HTTP error codes, return the error data instead of throwing" src/services/api.ts; then
    echo "✅ API service: HTTP error handling improved"
else
    echo "❌ API service: HTTP error handling not improved"
fi

if grep -q "message: data.message || 'Request failed'," src/services/api.ts; then
    echo "✅ API service: Error message extraction improved"
else
    echo "❌ API service: Error message extraction not improved"
fi

echo ""
echo "🎯 Expected Behavior:"
echo "- When API returns 400 status with message 'No active projects found for your company'"
echo "- The ClockInScreen should show Alert with exact message from API"
echo "- No generic 'Failed to clock in/out' message should appear"
echo "- Network errors should be handled separately from API errors"

echo ""
echo "📱 Testing Instructions:"
echo "1. Open app in development mode"
echo "2. Try to clock in/out when no active projects are available"
echo "3. Verify the error message shows: 'No active projects found for your company'"
echo "4. Check console logs for detailed error information"

echo ""
echo "🔧 Files Modified:"
echo "- src/screens/ClockInScreen.tsx: Enhanced error handling and logging"
echo "- src/services/api.ts: Fixed HTTP error response handling" 