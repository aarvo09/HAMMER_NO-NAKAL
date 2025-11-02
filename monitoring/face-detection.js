// monitoring/face-detection.js 

let faceModel = null; 

async function loadModel() {
    // 1. Load the models from your extension directory
    await faceapi.nets.tinyFaceDetector.loadFromUri(chrome.runtime.getURL('/monitoring/models'));
    faceModel = new faceapi.TinyFaceDetectorOptions();
}

// Function to analyze a single frame
async function detectFaces(videoElement) {
    if (!faceModel) return 0;
    
    const detections = await faceapi.detectAllFaces(videoElement, faceModel);
    return detections.length;
}


class FaceDetector {
    // ... constructor remains the same ...

    async startMonitoring() {
        this.stopMonitoring();
        
        // Ensure model is loaded first time
        if (!faceModel) await loadModel(); 
        
        monitoringInterval = setInterval(async () => {
            if (this.video.readyState === 4) { // Check if video stream is ready
                const faceCount = await detectFaces(this.video);
                
                if (isCriticalScanActive) {
                    // Critical termination logic
                    if (faceCount > 1) {
                        this.onViolation('CRITICAL_FACE');
                    }
                } else if (faceCount > 1) {
                    // Non-critical pause (Two-face detected)
                    this.onViolation('TWO_FACE');
                }
            }
        }, 300); // Run detection every 300ms (approx 3 FPS)
    }

    
}