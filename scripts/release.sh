#!/bin/bash
set -e

# Configuration
VERSION="${1:-1.0.0}"
APP_NAME="MathEdit"
SCHEME="MathEdit"
PROJECT_DIR="MathEdit"
BUILD_DIR="build"
DMG_NAME="${APP_NAME}-${VERSION}.dmg"
APPCAST_FILE="appcast.xml"

# Sparkle tools
SPARKLE_VERSION="2.6.4"
SPARKLE_DIR="/tmp/sparkle-tools"

echo "Building ${APP_NAME} v${VERSION}"

# Step 0: Download Sparkle tools if needed
if [ ! -d "${SPARKLE_DIR}/bin" ]; then
    echo "Downloading Sparkle tools..."
    mkdir -p "${SPARKLE_DIR}"
    curl -L -o "/tmp/sparkle.tar.xz" \
        "https://github.com/sparkle-project/Sparkle/releases/download/${SPARKLE_VERSION}/Sparkle-${SPARKLE_VERSION}.tar.xz"
    tar -xf "/tmp/sparkle.tar.xz" -C "${SPARKLE_DIR}"
    rm -f "/tmp/sparkle.tar.xz"
fi
SPARKLE_BIN="${SPARKLE_DIR}/bin"

# Step 1: Build web assets
echo "Building web assets..."
pnpm install
pnpm build:native

# Step 2: Build macOS app
echo "Building macOS app..."
mkdir -p "${BUILD_DIR}"

xcodebuild -project "${PROJECT_DIR}/${APP_NAME}.xcodeproj" \
    -scheme "${SCHEME}" \
    -configuration Release \
    -archivePath "${BUILD_DIR}/${APP_NAME}.xcarchive" \
    archive

# Step 3: Export app
echo "Exporting app..."
xcodebuild -exportArchive \
    -archivePath "${BUILD_DIR}/${APP_NAME}.xcarchive" \
    -exportPath "${BUILD_DIR}/export" \
    -exportOptionsPlist "scripts/ExportOptions.plist"

# Step 4: Create DMG
echo "Creating DMG..."
DMG_TEMP="/tmp/dmg-contents"
rm -rf "${DMG_TEMP}"
mkdir -p "${DMG_TEMP}"

cp -R "${BUILD_DIR}/export/${APP_NAME}.app" "${DMG_TEMP}/"
ln -s /Applications "${DMG_TEMP}/Applications"

hdiutil create -volname "${APP_NAME}" \
    -srcfolder "${DMG_TEMP}" \
    -ov -format UDZO \
    "${BUILD_DIR}/${DMG_NAME}"

rm -rf "${DMG_TEMP}"

echo "Build complete: ${BUILD_DIR}/${DMG_NAME}"

# Step 5: Sign DMG with Sparkle EdDSA
echo "Signing DMG with Sparkle EdDSA..."
SIGN_OUTPUT=$("${SPARKLE_BIN}/sign_update" "${BUILD_DIR}/${DMG_NAME}" 2>&1)
SIGNATURE=$(echo "${SIGN_OUTPUT}" | grep "sparkle:edSignature" | sed 's/.*sparkle:edSignature="\([^"]*\)".*/\1/')

if [ -z "${SIGNATURE}" ]; then
    echo "Warning: Could not extract EdDSA signature. Make sure you have generated keys."
    echo "Run: ${SPARKLE_BIN}/generate_keys"
    SIGNATURE="SIGNATURE_PLACEHOLDER"
fi

DMG_SIZE=$(stat -f%z "${BUILD_DIR}/${DMG_NAME}")
DOWNLOAD_URL="https://github.com/mu373/mathedit/releases/download/mac-v${VERSION}/${DMG_NAME}"

echo "EdDSA Signature: ${SIGNATURE}"
echo "DMG Size: ${DMG_SIZE}"

# Step 6: Generate appcast.xml
echo "Generating appcast.xml..."
cat > "${BUILD_DIR}/${APPCAST_FILE}" << EOF
<?xml version="1.0" encoding="utf-8"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle" xmlns:dc="http://purl.org/dc/elements/1.1/">
  <channel>
    <title>MathEdit Updates</title>
    <link>https://github.com/mu373/mathedit</link>
    <description>Most recent updates for MathEdit.</description>
    <language>en</language>
    <item>
      <title>Version ${VERSION}</title>
      <pubDate>$(date -R)</pubDate>
      <sparkle:version>${VERSION}</sparkle:version>
      <sparkle:shortVersionString>${VERSION}</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>15.0</sparkle:minimumSystemVersion>
      <enclosure
        url="${DOWNLOAD_URL}"
        sparkle:edSignature="${SIGNATURE}"
        length="${DMG_SIZE}"
        type="application/octet-stream"/>
    </item>
  </channel>
</rss>
EOF

echo "Appcast generated: ${BUILD_DIR}/${APPCAST_FILE}"

# Step 7: Create GitHub release (optional)
if command -v gh &> /dev/null && [ "${2}" = "--release" ]; then
    echo "Creating GitHub release..."

    # Create tag if it doesn't exist
    TAG_NAME="mac-v${VERSION}"
    if ! git rev-parse "${TAG_NAME}" >/dev/null 2>&1; then
        git tag "${TAG_NAME}"
    fi
    git push origin "${TAG_NAME}" --force

    # Get tag message if available (strip PGP signature if present)
    TAG_MESSAGE=$(git tag -l --format='%(contents)' "${TAG_NAME}" 2>/dev/null | sed '/-----BEGIN PGP SIGNATURE-----/,$d' | head -20)

    # Build release notes
    RELEASE_NOTES="## Installation

1. Download \`${DMG_NAME}\`
2. Open the DMG and drag ${APP_NAME} to Applications
3. **First launch:** Right-click the app → Open → Click \"Open\"

> **Note:** The app is not notarized by Apple. When opened with double-click, macOS will show a security warning. Use right-click → Open to bypass this.

## Requirements
- macOS 15.0 or later"

    # Append tag message if available
    if [ -n "${TAG_MESSAGE}" ]; then
        RELEASE_NOTES="${TAG_MESSAGE}

${RELEASE_NOTES}"
    fi

    gh release create "${TAG_NAME}" \
        "${BUILD_DIR}/${DMG_NAME}" \
        "${BUILD_DIR}/${APPCAST_FILE}" \
        --title "v${VERSION} (macOS)" \
        --notes "${RELEASE_NOTES}"

    echo "Release published with DMG and appcast.xml!"
fi
