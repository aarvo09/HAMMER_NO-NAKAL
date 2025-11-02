# HAMMER - Online Exam Proctoring System

Browser extension for monitoring online exams with plagiarism detection, face tracking, and activity monitoring.

## 🎯 Features

- ✅ **Plagiarism Detection** - Blocks submission if ≥10% similarity to Wikipedia  
- 👤 **Face Tracking** - Monitors student presence via camera  
- 📋 **Activity Logging** - Tracks copy/paste, tab switches, visibility changes  
- 📝 **10 Questions** - 2 essays (plagiarism checked) + 8 multiple choice

## 🚀 Quick Start

### Test Exam Page (No Extension)
```powershell
start TEST.HTML
```
Open browser console (F12) to see plagiarism logs.

### Install Chrome Extension
1. Go to `chrome://extensions/`
2. Enable "Developer mode"
3. Click "Load unpacked" → Select this folder
4. Extension installed!

## 📝 Testing Plagiarism

**Original content (PASS):**
```
Learning requires dedication and effort to understand concepts through honest work.
```
Result: ✓ 5-12% → Submitted

**Wikipedia content (FAIL):**
```
Academic integrity is the moral code of academia including avoidance of cheating and plagiarism.
```
Result: ❌ 60-85% → Blocked

## 🔧 Configuration

Change plagiarism threshold in `TEST.HTML` (line ~410):
```javascript
if (percent >= 10) {  // Change 10 to 5, 15, 20, etc.
```

## 📊 How Plagiarism Works

1. Extracts keywords from student text
2. Searches Wikipedia for related articles
3. Counts matching words: `(matched / total) × 100`
4. Blocks if ≥ 10%

## 🐛 Troubleshooting

| Issue | Fix |
|-------|-----|
| Always shows 0% | Text too short or no Wikipedia matches |
| Shows "Error" | Check internet connection |
| Extension not working | Reload at `chrome://extensions/` |

## � Key Files

- `TEST.HTML` - Main exam page
- `manifest.json` - Extension config
- `monitoring/face-detection.js` - Camera monitoring
- `plagarism/plagiarism_checker.js` - Node.js AI checker (optional)

## 🤖 Advanced: AI Plagiarism Checker

For semantic analysis (more accurate):
```powershell
cd plagarism
npm install
npm start
```

---

**Version:** 1.0 | **Status:** ✅ Working

