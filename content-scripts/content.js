// content-scripts/content.js

// Removed: TWO_FACE_WARNING and SCAN_TERMINATE_MESSAGE
let currentStream = null; 
let isMonitoringActive = false;
let monitoringInterval = null; 

// --- ML DEPENDENCIES (Setup remains the same for future use) ---
let modelsLoaded = false;
let detectionOptions = null;

async function loadModels() {
    if (modelsLoaded) return true;

    try {
        const modelPath = chrome.runtime.getURL('monitoring/models');

        await faceapi.nets.tinyFaceDetector.loadFromUri(modelPath);
        await faceapi.nets.faceLandmark68TinyNet.loadFromUri(modelPath);

        detectionOptions = new faceapi.TinyFaceDetectorOptions({
            inputSize: 160,
            scoreThreshold: 0.5 
        });
        
        modelsLoaded = true;
        return true;
    } catch (e) {
        console.error("Failed to load face detection models. Using simple mock.", e);
        // Fail gracefully for now, relying on manual violation triggers
        return false;
    }
}
// --- END ML DEPENDENCIES ---


// --- REAL FACE DETECTION CLASS (Reverted to simplified logic) ---
class FaceDetector {
    constructor(videoElement, onViolation) {
        this.video = videoElement;
        this.onViolation = onViolation;
    }

    async startMonitoring() {
        this.stopMonitoring();
        
        // Use a simple check interval (e.g., 500ms)
        monitoringInterval = setInterval(async () => {
            if (isMonitoringActive) {
                
                // --- REAL ML LOGIC WOULD GO HERE ---
                // For now, we simulate a gaze/noise violation if models aren't loaded (FaceCount=0/Error)
                const isViolation = Math.random() < 0.1; // Placeholder: 10% chance of random violation every 500ms
                
                if (isViolation) {
                    this.onViolation('GAZE');
                }
                
                // --- END ML LOGIC ---
            }
        }, 500); 
    }

    stopMonitoring() {
        if (monitoringInterval) {
            clearInterval(monitoringInterval);
            monitoringInterval = null;
        }
    }
}
let detector = null; 
// --- END REAL FACE DETECTION CLASS ---


// --- UTILITY FUNCTIONS ---

// Renamed and simplified the enforceFreeze function to only handle fatal termination if needed
function enforceFreeze(message) {
    let blocker = document.getElementById('no-nakal-blocker');
    if (!blocker) {
        blocker = document.createElement('div');
        blocker.id = 'no-nakal-blocker';
        document.body.appendChild(blocker);
    }
    blocker.textContent = message;
    blocker.classList.add('active'); 
    blocker.style.backgroundColor = 'rgba(179, 0, 0, 0.9)'; // Red termination style
    blocker.style.fontSize = '2em';
    blocker.style.pointerEvents = 'all'; 
}

function clearFreeze() {
    let blocker = document.getElementById('no-nakal-blocker');
    if (blocker) {
        blocker.classList.remove('active');
        blocker.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        blocker.style.pointerEvents = 'none';
    }
}

function triggerVisualViolation() {
    const videoElement = document.getElementById('no-nakal-video');
    if (videoElement) {
        videoElement.classList.add('violation');
        setTimeout(() => {
            videoElement.classList.remove('violation');
        }, 3000); 
    }
}

function stopProctoring() {
    if (detector) detector.stopMonitoring();
    isMonitoringActive = false;
    
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    let videoElement = document.getElementById('no-nakal-video');
    let blocker = document.getElementById('no-nakal-blocker');
    if (videoElement) videoElement.remove();
    if (blocker) blocker.remove(); 
}


// --- MAIN VIOLATION HANDLER ---
function handleViolation(type) {
    if (!isMonitoringActive) return;
    
    // Log violation and provide visual feedback
    if (type === 'GAZE' || type === 'TAB_SWITCH') {
        triggerVisualViolation(); 
        chrome.runtime.sendMessage({ action: "VIOLATION_DETECTED" });
    }
    // All critical termination logic has been removed
}


// Function to handle the camera and audio request
async function requestMediaAccess() {
    stopProctoring(); 
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                width: { ideal: 160 },
                height: { ideal: 120 }
            },
            audio: true
        });
        currentStream = stream; 
        
        const audioTracks = stream.getAudioTracks();
        if (audioTracks.length > 0) {
            audioTracks[0].enabled = false; 
        }
        
        let videoElement = document.getElementById('no-nakal-video');
        if (!videoElement) {
            videoElement = document.createElement('video');
            videoElement.id = 'no-nakal-video';
            document.body.appendChild(videoElement);
        }
        
        videoElement.srcObject = stream;
        videoElement.play();

        isMonitoringActive = true;
        detector = new FaceDetector(videoElement, handleViolation);
        detector.startMonitoring();
        
        return { status: "Media_Success" };
    } catch (err) {
        console.error("Media access error:", err);
        return { status: "Media_Denied", error: err.name };
    }
}


// --- EVENT LISTENERS ---

document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        handleViolation('TAB_SWITCH');
    }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "REQUEST_MEDIA_ACCESS") {
        // Load ML libs on start, but the mock will run regardless if loading fails
        loadModels(); 
        requestMediaAccess().then(sendResponse);
        return true; 
    }
    
    if (request.action === "RELEASE_MEDIA") {
        stopProctoring();
    }
});

window.addEventListener('beforeunload', stopProctoring);