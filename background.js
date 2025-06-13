

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if(changeInfo.url) {
        
        function getCurrentTime(){
            const now = new Date();
            const hour = String(now.getHours()).padStart(2, '0');
            const minute = String(now.getMinutes()).padStart(2, '0');
            return `${hour}:${minute}`  
        }
        function blockedScreen(){
            chrome.tabs.update(tabId, {
                url : chrome.runtime.getURL("blocked.html")
            })
        }
        function BlockedTime(startTime, endTime){
            if(getCurrentTime() >= startTime && getCurrentTime() <= endTime){
                return true;
        } else {
            return false;
        }
        }
        const currentUrl = changeInfo.url;
        const currentDomain = new URL(currentUrl).hostname;
        let TR = [];
        chrome.storage.sync.get("timeRanges", (result) => {
            TR = result.timeRanges || [];
            for(let i = 0; i < TR.length; i++){
                for(let j = 0; j < TR[i].urls.length; j++){
                    if(currentUrl.includes(TR[i].urls[j]) && BlockedTime(TR[i].start, TR[i].end)){
                        blockedScreen();
                    }
                }
            }

        })
    }
})





function FilterTheStorage() {
    chrome.storage.sync.get({ timeRanges: [] }, (result) => {
        const cleanedTimeRanges = result.timeRanges
            // First sanitize each range's URLs
            .map(range => {
                if (!range || !Array.isArray(range.urls)) return null;

                range.urls = range.urls.filter(url => {
                    return url && 
                           url !== 'www.' && 
                           url !== 'http://' && 
                           url !== 'https://' && 
                           url !== 'undefined' && 
                           url !== 'null';
                });

                return range;
            })
            // Then filter out ranges with no valid URLs or null entries
            .filter(range => range && range.urls.length > 0);

        // Save cleaned data back to storage
        chrome.storage.sync.set({ timeRanges: cleanedTimeRanges }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to filter the Time Ranges:", chrome.runtime.lastError.message);
            } else {
                console.log("Time Ranges cleaned successfully.");
            }
        });
    });
}




chrome.runtime.onStartup.addListener(() => {
    console.log('Extension started on browser launch');
    
    FilterTheStorage()
  });
  