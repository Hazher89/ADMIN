# DriftPro Logo Export Instructions

## 📱 iOS App Icons
Place these files in your iOS project:

```
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
```

## 🤖 Android App Icons
Place these files in your Android project:

```
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
```

## 🌐 Web Usage
Use these files for web applications:

```
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
```

## 🖨️ Print Usage
Use these files for print materials:

```
print/
├── logo-400.png (High resolution)
├── logo-300.png (Medium resolution)
└── logo-200.png (Standard resolution)
```

## 🔧 Export Commands

### Using svgexport (recommended)
```bash
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
```

### Using Inkscape
```bash
# Example for iOS 1024x1024
inkscape public/app-icon-ios.svg --export-filename=exported-logos/ios/app-icon-ios-1024.png --export-width=1024 --export-height=1024
```

### Using ImageMagick
```bash
# Example for iOS 1024x1024
convert public/app-icon-ios.svg -resize 1024x1024 exported-logos/ios/app-icon-ios-1024.png
```

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
