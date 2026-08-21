# NeoSketch AI — Web Showcase & Android APK Distribution

Welcome to the official **NeoSketch AI** showcase repository.

## 🚀 About NeoSketch AI
NeoSketch is an offline-first creative studio for Android combining high-performance raster & vector drawing, an infinite layer canvas, and on-device ONNX neural networks.

### ✨ Features
- **Infinite Layer Studio**: Full layer blending, transparency locks, alpha clipping, and custom dimensions.
- **On-Device Neural AI**: Offline Depth estimation, realistic pencil sketch generation, background removal, and 4x Swin2SR super-resolution.
- **Zero-Cloud Latency**: 100% of image processing and inference runs locally on your mobile GPU/NPU.
- **Privacy-First**: No account registrations or cloud image uploads required.

---

## 🎮 Interactive AI QuickDraw Web Game
Test your drawing skills directly in your browser with our built-in HTML5 Canvas game:
- **30-Second Timed Challenges**: Sketch dynamic AI prompts before time runs out.
- **Neon Brush & Particle Engine**: Real-time particle trails, hue cycling, and audio effects.
- **AI Stroke Evaluator**: Live scoring based on brush density, speed, and accuracy.

---

## 📲 Direct APK Download
- **Release Package**: `NeoSketch-Production.apk`
- **Application ID**: `com.neosketch.ai`
- **Supported Architecture**: `arm64-v8a`, `armeabi-v7a`, `x86_64`
- **Minimum Android Version**: Android 8.0 Oreo (API 26) or newer

---

## 💻 Local Web Server
To run the showcase and game locally:
```bash
# Python 3
python -m http.server 8080

# Or Node.js
npx serve .
```
Visit `http://localhost:8080` in your web browser.
