#!/bin/bash
set -e

cd "$(dirname "$0")/mobile"

echo "→ Generating native iOS project..."
npx expo prebuild --platform ios

echo "→ Building and uploading to TestFlight..."
fastlane beta

echo "Done! Build is processing in TestFlight."
