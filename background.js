const MAX_VIOLATIONS = 99999; 

function resetSessionData() {
    return {
        violationCount: 0,
        isProctoringActive: false,
        startTime: null,
        examCode: '',
        userID: '',
        isCriticalScanActive: false 
    };
}

chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set(resetSessionData());
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {

    
    if (request.action === "SET_CRITICAL_SCAN_STATE") {
        chrome.storage.local.set({ isCriticalScanActive: request.state }, () => {
            sendResponse({ status: `Critical scan set to ${request.state}` });
        });
        return true;
    }

    if (request.action === "VIOLATION_DETECTED") {
        chrome.storage.local.get(['violationCount', 'isProctoringActive'], (data) => {
            if (data.isProctoringActive) {
                let newCount = data.violationCount + 1;
                chrome.storage.local.set({ violationCount: newCount }, () => {
                    sendResponse({ status: "Violation recorded", count: newCount, max: MAX_VIOLATIONS });
                });
            } else {
                sendResponse({ status: "Inactive", count: data.violationCount || 0, max: MAX_VIOLATIONS });
            }
        });
        return true; 
    } 
    
    else if (request.action === "START_PROCTORING") {
        chrome.storage.local.set({ 
            violationCount: 0, 
            isProctoringActive: true, 
            startTime: Date.now(), 
            examCode: request.examCode,
            userID: request.userID,
            isCriticalScanActive: false
        }, () => {
            sendResponse({ status: "Proctoring started" });
        });
        return true;
    } 
    
    else if (request.action === "END_PROCTORING") { 
        chrome.storage.local.get(['violationCount', 'startTime', 'examCode', 'userID'], (data) => {
            const durationSeconds = data.startTime ? Math.round((Date.now() - data.startTime) / 1000) : 0;
            
            const summaryCode = 
                `${data.userID}_${data.examCode}_${data.violationCount}_${durationSeconds}s`;
            
            chrome.storage.local.set(resetSessionData(), () => {
                sendResponse({ status: "Proctoring ended", summaryCode: summaryCode });
            });
        });
        return true;
    }
    
    else if (request.action === "GET_VIOLATION_COUNT") {
        chrome.storage.local.get(['violationCount', 'isProctoringActive', 'examCode', 'userID'], (data) => {
            sendResponse({ 
                count: data.violationCount || 0, 
                max: MAX_VIOLATIONS, 
                isActive: data.isProctoringActive || false,
                examCode: data.examCode || '',
                userID: data.userID || ''
            });
        });
        return true;
    }
    
    else if (request.action === "CLEAR_SESSION_DATA") {
        chrome.storage.local.set(resetSessionData(), () => {
            sendResponse({ status: "Data cleared" });
        });
        return true;
    }
});