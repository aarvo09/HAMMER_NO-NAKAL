document.addEventListener('DOMContentLoaded', () => {
    const statusText = document.getElementById('status');
    const violationCountSpan = document.getElementById('violationCount');
    const maxViolationsSpan = document.getElementById('maxViolations');
    const startButton = document.getElementById('startExamButton');
    const examCodeInput = document.getElementById('examCode');
    const userIDInput = document.getElementById('userID');
    const refreshButton = document.getElementById('refreshButton'); // New element reference

    function updateStatus(count, max, isActive = false) {
        violationCountSpan.textContent = count;
        maxViolationsSpan.textContent = max;

        // Reset button style for safety
        startButton.style.backgroundColor = '#4CAF50';
        startButton.style.color = 'white'; 
        
        if (isActive) {
            statusText.textContent = 'Active';
            statusText.style.color = '#4CAF50';
            startButton.textContent = "END Proctoring Session";
            startButton.style.backgroundColor = '#ff4d4d';
            startButton.disabled = false;
        } else if (count > 0) {
            statusText.textContent = 'Ready (Session Completed)';
            statusText.style.color = '#ffb366';
            startButton.textContent = "Start Proctoring";
            startButton.disabled = false;
        } else {
            statusText.textContent = 'Ready';
            statusText.style.color = '#4CAF50';
            startButton.textContent = "Start Proctoring";
            startButton.disabled = false;
        }
    }

    // New: Listener for the Refresh button
    refreshButton.addEventListener('click', () => {
        chrome.runtime.sendMessage({ action: "CLEAR_SESSION_DATA" }, (response) => {
            if (response && response.status === "Data cleared") {
                // Reset UI elements immediately
                examCodeInput.value = '';
                userIDInput.value = '';
                updateStatus(0, 99999, false); 
                alert("Session data cleared successfully. Ready for a new exam.");
            }
        });
    });

    // Get initial status from the background script
    chrome.runtime.sendMessage({ action: "GET_VIOLATION_COUNT" }, (response) => {
        if (response) {
            updateStatus(response.count, response.max, response.isActive);
            if (response.examCode) {
                examCodeInput.value = response.examCode;
                userIDInput.value = response.userID;
            }
        }
    });

    // Listener for the "Start/End Proctoring" button click (Code remains the same as previous step)
    startButton.addEventListener('click', () => {
        const examCode = examCodeInput.value.trim();
        const userID = userIDInput.value.trim();

        if (startButton.textContent.startsWith("END")) {
            // END PROCTORING LOGIC
            chrome.runtime.sendMessage({ action: "END_PROCTORING" }, (response) => {
                if (response && response.status === "Proctoring ended") {
                    alert(
                        "Proctoring Session Ended.\n\n" + 
                        "Please submit this summary code:\n" + 
                        `Code: ${response.summaryCode}`
                    );
                    
                    updateStatus(0, 99999, false);
                    
                    // Tell content script to release media
                    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
                        if (tabs.length > 0) {
                            chrome.tabs.sendMessage(tabs[0].id, { action: "RELEASE_MEDIA" });
                        }
                    });
                }
            });
            return;
        }
        
        // START PROCTORING LOGIC
        if (!examCode || !userID) {
            alert("Please enter both the Exam Code and the User ID.");
            return;
        }
        
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            const activeTab = tabs[0];
            const url = activeTab.url;
            
            if (url.startsWith('chrome://') || url.startsWith('about:') || url.startsWith('moz-extension://')) {
                alert("Proctoring cannot be started on browser settings or extension pages. Please navigate to the exam website first.");
                return;
            }
            
            chrome.tabs.sendMessage(activeTab.id, { action: "REQUEST_MEDIA_ACCESS" }, (response) => {
                if (chrome.runtime.lastError) {
                    console.error("Popup communication error:", chrome.runtime.lastError.message);
                    alert("Failed to communicate with the exam page. Please reload the page or ensure the extension is enabled for this site.");
                    return;
                }
                
                if (response && response.status === "Media_Success") {
                    chrome.runtime.sendMessage({ 
                        action: "START_PROCTORING", 
                        examCode: examCode, 
                        userID: userID 
                    }, () => {
                        updateStatus(0, 99999, true);
                    });
                } else if (response && response.status === "Media_Denied") {
                    alert("Media access denied. Cannot start proctoring without camera and mic.");
                }
            });
        });
    });
});