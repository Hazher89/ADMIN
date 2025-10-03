#!/usr/bin/env node

/**
 * DriftPro Logo Export Script
 * Converts SVG logos to PNG for different platforms
 */

const fs = require('fs');
const path = require('path');

// Create export directory
const exportDir = path.join(__dirname, 'exported-logos');
if (!fs.existsSync(exportDir)) {
  fs.mkdirSync(exportDir, { recursive: true });
}

console.log('🎨 DriftPro Logo Export Script');
console.log('==============================');

// Logo files to export
const logos = [
  {
    name: 'app-icon-ios',
    sizes: [
      { size: 1024, filename: 'app-icon-ios-1024.png' },
      { size: 180, filename: 'app-icon-ios-180.png' },
      { size: 167, filename: 'app-icon-ios-167.png' },
      { size: 152, filename: 'app-icon-ios-152.png' },
      { size: 120, filename: 'app-icon-ios-120.png' },
      { size: 87, filename: 'app-icon-ios-87.png' },
      { size: 80, filename: 'app-icon-ios-80.png' },
      { size: 76, filename: 'app-icon-ios-76.png' },
      { size: 60, filename: 'app-icon-ios-60.png' },
      { size: 40, filename: 'app-icon-ios-40.png' },
      { size: 29, filename: 'app-icon-ios-29.png' },
      { size: 20, filename: 'app-icon-ios-20.png' }
    ]
  },
  {
    name: 'app-icon-android',
    sizes: [
      { size: 512, filename: 'app-icon-android-512.png' },
      { size: 192, filename: 'app-icon-android-192.png' },
      { size: 144, filename: 'app-icon-android-144.png' },
      { size: 96, filename: 'app-icon-android-96.png' },
      { size: 72, filename: 'app-icon-android-72.png' },
      { size: 48, filename: 'app-icon-android-48.png' },
      { size: 36, filename: 'app-icon-android-36.png' },
      { size: 24, filename: 'app-icon-android-24.png' }
    ]
  },
  {
    name: 'logo',
    sizes: [
      { size: 400, filename: 'logo-400.png' },
      { size: 300, filename: 'logo-300.png' },
      { size: 200, filename: 'logo-200.png' },
      { size: 150, filename: 'logo-150.png' },
      { size: 100, filename: 'logo-100.png' }
    ]
  },
  {
    name: 'logo-white',
    sizes: [
      { size: 400, filename: 'logo-white-400.png' },
      { size: 300, filename: 'logo-white-300.png' },
      { size: 200, filename: 'logo-white-200.png' },
      { size: 150, filename: 'logo-white-150.png' },
      { size: 100, filename: 'logo-white-100.png' }
    ]
  },
  {
    name: 'logo-black',
    sizes: [
      { size: 400, filename: 'logo-black-400.png' },
      { size: 300, filename: 'logo-black-300.png' },
      { size: 200, filename: 'logo-black-200.png' },
      { size: 150, filename: 'logo-black-150.png' },
      { size: 100, filename: 'logo-black-100.png' }
    ]
  },
  {
    name: 'favicon',
    sizes: [
      { size: 32, filename: 'favicon-32.png' },
      { size: 16, filename: 'favicon-16.png' }
    ]
  }
];

console.log('\n📁 Exporting logos...');

// Create directories
const directories = ['ios', 'android', 'web', 'print'];
directories.forEach(dir => {
  const dirPath = path.join(exportDir, dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Generate export instructions
let exportInstructions = `# DriftPro Logo Export Instructions

## 📱 iOS App Icons
Place these files in your iOS project:

\`\`\`
ios/
├── AppIcon.appiconset/
│   ├── app-icon-ios-1024.png (App Store)
│   ├── app-icon-ios-180.png (iPhone 6 Plus)
│   ├── app-icon-ios-167.png (iPad Pro)
│   ├── app-icon-ios-152.png (iPad)
│   ├── app-icon-ios-120.png (iPhone 6)
│   ├── app-icon-ios-87.png (iPhone 6 Plus Settings)
│   ├── app-icon-ios-80.png (Spotlight)
│   ├── app-icon-ios-76.png (iPad Settings)
│   ├── app-icon-ios-60.png (iPhone Settings)
│   ├── app-icon-ios-40.png (Spotlight)
│   ├── app-icon-ios-29.png (Settings)
│   └── app-icon-ios-20.png (Notifications)
\`\`\`

## 🤖 Android App Icons
Place these files in your Android project:

\`\`\`
android/app/src/main/res/
├── mipmap-hdpi/
│   └── app-icon-android-72.png
├── mipmap-mdpi/
│   └── app-icon-android-48.png
├── mipmap-xhdpi/
│   └── app-icon-android-96.png
├── mipmap-xxhdpi/
│   └── app-icon-android-144.png
├── mipmap-xxxhdpi/
│   └── app-icon-android-192.png
└── play-store/
    └── app-icon-android-512.png
\`\`\`

## 🌐 Web Usage
Use these files for web applications:

\`\`\`
web/
├── logo-400.png (Large displays)
├── logo-300.png (Medium displays)
├── logo-200.png (Small displays)
├── logo-150.png (Mobile)
├── logo-100.png (Very small)
├── logo-white-400.png (Dark backgrounds)
├── logo-black-400.png (Light backgrounds)
├── favicon-32.png (Browser tabs)
└── favicon-16.png (Small favicon)
\`\`\`

## 🖨️ Print Usage
Use these files for print materials:

\`\`\`
print/
├── logo-400.png (High resolution)
├── logo-300.png (Medium resolution)
└── logo-200.png (Standard resolution)
\`\`\`

## 🔧 Export Commands

### Using svgexport (recommended)
\`\`\`bash
npm install -g svgexport

# iOS icons
svgexport public/app-icon-ios.svg exported-logos/ios/app-icon-ios-1024.png 1024:1024
svgexport public/app-icon-ios.svg exported-logos/ios/app-icon-ios-180.png 180:180
# ... repeat for all sizes

# Android icons
svgexport public/app-icon-android.svg exported-logos/android/app-icon-android-512.png 512:512
svgexport public/app-icon-android.svg exported-logos/android/app-icon-android-192.png 192:192
# ... repeat for all sizes

# Web logos
svgexport public/logo.svg exported-logos/web/logo-400.png 400:120
svgexport public/logo-white.svg exported-logos/web/logo-white-400.png 400:120
# ... repeat for all sizes
\`\`\`

### Using Inkscape
\`\`\`bash
# Example for iOS 1024x1024
inkscape public/app-icon-ios.svg --export-filename=exported-logos/ios/app-icon-ios-1024.png --export-width=1024 --export-height=1024
\`\`\`

### Using ImageMagick
\`\`\`bash
# Example for iOS 1024x1024
convert public/app-icon-ios.svg -resize 1024x1024 exported-logos/ios/app-icon-ios-1024.png
\`\`\`

## 📋 Checklist

### iOS App Store
- [ ] app-icon-ios-1024.png (App Store)
- [ ] app-icon-ios-180.png (iPhone 6 Plus)
- [ ] app-icon-ios-167.png (iPad Pro)
- [ ] app-icon-ios-152.png (iPad)
- [ ] app-icon-ios-120.png (iPhone 6)
- [ ] app-icon-ios-87.png (iPhone 6 Plus Settings)
- [ ] app-icon-ios-80.png (Spotlight)
- [ ] app-icon-ios-76.png (iPad Settings)
- [ ] app-icon-ios-60.png (iPhone Settings)
- [ ] app-icon-ios-40.png (Spotlight)
- [ ] app-icon-ios-29.png (Settings)
- [ ] app-icon-ios-20.png (Notifications)

### Android Play Store
- [ ] app-icon-android-512.png (Play Store)
- [ ] app-icon-android-192.png (mipmap-xxxhdpi)
- [ ] app-icon-android-144.png (mipmap-xxhdpi)
- [ ] app-icon-android-96.png (mipmap-xhdpi)
- [ ] app-icon-android-72.png (mipmap-hdpi)
- [ ] app-icon-android-48.png (mipmap-mdpi)
- [ ] app-icon-android-36.png (mipmap-ldpi)
- [ ] app-icon-android-24.png (notifications)

### Web Application
- [ ] logo-400.png (Large displays)
- [ ] logo-300.png (Medium displays)
- [ ] logo-200.png (Small displays)
- [ ] logo-150.png (Mobile)
- [ ] logo-100.png (Very small)
- [ ] logo-white-400.png (Dark backgrounds)
- [ ] logo-black-400.png (Light backgrounds)
- [ ] favicon-32.png (Browser tabs)
- [ ] favicon-16.png (Small favicon)

## 🎨 Design Notes

- **Primary Color:** #1F2937 (Dark gray)
- **Secondary Color:** #374151 (Medium gray)
- **White:** #FFFFFF (Pure white)
- **Font:** Poppins, Montserrat, Raleway (system fallbacks)
- **Design:** Modern operations gear with rounded square background

## 📞 Support
For logo-related questions: support@driftpro.no
`;

// Write export instructions
fs.writeFileSync(path.join(exportDir, 'EXPORT_INSTRUCTIONS.md'), exportInstructions);

console.log('✅ Export instructions created!');
console.log(`📁 Files will be exported to: ${exportDir}`);
console.log('\n📋 Next steps:');
console.log('1. Install svgexport: npm install -g svgexport');
console.log('2. Run export commands from EXPORT_INSTRUCTIONS.md');
console.log('3. Copy PNG files to your iOS/Android projects');
console.log('\n🎯 Logo package ready for use!');
