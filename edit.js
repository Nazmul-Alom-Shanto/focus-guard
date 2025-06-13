
let TR = []; // Time Ranges

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



function init() {
    chrome.storage.sync.get("timeRanges", (result) => {
        if(!result.timeRanges){
            chrome.storage.sync.set({timeRanges: []}, () => {
                if(chrome.runtime.lastError){
                    console.warn("Failed to Initialize the Time Ranges, Please, Reload the page: ", chrome.runtime.lastError.message);
                }
            });
        } else {
            TR = result.timeRanges;
            console.log("data inside init ", TR);
        }
        console.log("data outside init 2", TR);    
        
        if(TR.length > 0) {
            // TimeRanges = TR;
            // console.log("Time Ranges: ", TimeRanges);

        TR.forEach((range, index) => {
            const timeRange = document.createElement('div');
            timeRange.classList.add('time-range');
            timeRange.id = `time-range-${index}`;
         //   const timeRangeId = index;
            let expiredTime;
            if(!range.expire){
                expiredTime = new Date(-10).getTime();
            } else {
                expiredTime = range.expire;
            }

            timeRange.innerHTML = `
                <div class="title">
                    <div class="title-details">
                        <h1>${range.title}</h1>
                        <p> <span class="start-time">${range.start}</span> to <span class="end-time">${range.end}</span></p>
                    </div>
                    <div class="range-delete-container">
                        <span class="count-down"></span>
                        <button class="delete-time-range" id="delete-time-range-${index}"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </div>
                <div class="urls">
                    <h1>Blocked URLs</h1>
                    <ul class="urls-${index}">
                        ${range.urls.map((url, urlIndex) => `<li class="url-item" id="${index}-${urlIndex}" ><span class="url">${url}</span> 
                            <div class="li-end">
                                <button class="edit-url"><i class="fa-solid fa-pen"></i></button>
                                <button class="delete-url"><i class="fa-solid fa-trash"></i></button>
                            </div>
                            </li>`).join('')}
                    </ul>
                    <button class="add-url">Add URL</button>
                </div>
            `;
            const countDown = timeRange.querySelector(".count-down");
            const r = () => {
                const now = Date.now();
                if(now > expiredTime){
                countDown.remove();
                } else {
                    let diff = Math.abs(expiredTime - now);
                    const days = Math.floor(diff / (1000 * 3600 * 24));
                    diff %= (1000 * 3600 * 24);
                    const hours = Math.floor(diff / (1000 * 3600));
                    diff %= (1000 * 3600);
                    const mins = Math.floor(diff / (1000 * 60));
                    diff %= 60000;
                    const secs = Math.floor(diff / 1000);
                    countDown.innerHTML = `${days}d ${hours}h ${mins}m ${secs}s`;
                }
            }
           
            if(Date.now() < expiredTime){
                timeRange.querySelectorAll("button").forEach(btn => {
                    btn.disabled = true;    
                })
                setInterval(r, 1000);
            } 
            document.querySelector('.time-ranges').appendChild(timeRange);
            const addUrl = timeRange.querySelector('.add-url');
            addUrl.addEventListener('click', () => {
                const ul = timeRange.querySelector(`.urls-${index}`);
                const li = document.createElement('li');
                li.classList.add('url-item');
                li.id = `${index}-${ul.children.length}`;
                li.innerHTML = `
                    <span contenteditable="true" class="url">www.</span> 
                    <div class="li-end">
                        <button class="edit-url"><i class="fa-solid fa-floppy-disk"></i></button>
                        <button class="delete-url"><i class="fa-solid fa-trash"></i></button>
                    </div>
                `;
                ul.appendChild(li);
                UpdateUrlEditPanelListener();
              
            })
            
        })
        }

        document.querySelectorAll('.time-range').forEach(range => {
            const title = range.querySelector('.title');
            const urls = range.querySelector('.urls');
        
            title.addEventListener('click', () => {
              urls.classList.toggle('expanded');
              console.log("expanded clicked"); 
            });
          });

          document.querySelectorAll(".delete-time-range").forEach((button,index) => {
              button.addEventListener('click', () => {
                console.log("delete time range button clicked");
                //document.querySelector(`.time-range-${index}`).remove();
                DeleteTimeRangeFromStorage(index);
                location.reload();
            })
          })
          
         

        UpdateUrlEditPanelListener();
    })

}



function UpdateURLToStorage(timeRangeId, urlId, newUrl) {
    chrome.storage.sync.get("timeRanges", (result) => {
        const timeRanges = result.timeRanges || [];
        const timeRange = timeRanges[timeRangeId];
        const urls = timeRange.urls || [];
        if(urlId > urls.length - 1){
            urls.push(newUrl);
        } else {
            urls[urlId] = newUrl;
        }
        urls[urlId] = newUrl;
        timeRange.urls = urls;
        timeRanges[timeRangeId] = timeRange;
        chrome.storage.sync.set({ timeRanges }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to update URL: ", chrome.runtime.lastError.message);
            }
        });

    });
}

function DeleteURLFromStorage(timeRangeId, urlId) {
    chrome.storage.sync.get("timeRanges", (result) => {
        const timeRanges = result.timeRanges || [];
        const timeRange = timeRanges[timeRangeId];
        const urls = timeRange.urls || [];
        urls[urlId] = null;
        timeRange.urls = urls;
        timeRanges[timeRangeId] = timeRange;
        chrome.storage.sync.set({ timeRanges }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to delete URL: ", chrome.runtime.lastError.message);
            }
        });
    });
}


function DeleteTimeRangeFromStorage(timeRangeId) {
    chrome.storage.sync.get("timeRanges", (result) => {
        const timeRanges = result.timeRanges || [];
        timeRanges[timeRangeId] = null;
        chrome.storage.sync.set({ timeRanges }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to delete time range: ", chrome.runtime.lastError.message);
            }
        });
    });
}

 
function AddTimeRangeToStorage(timeRange) {
    chrome.storage.sync.get("timeRanges", (result) => {
        const timeRanges = result.timeRanges || [];
        timeRanges.push(timeRange);
        chrome.storage.sync.set({"timeRanges" : timeRanges} , () => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to add time range: ", chrome.runtime.lastError.message);
            }
        });
    });
}
 /*
function AddTimeRangeToStorage(title, start, end, urls) {
    chrome.storage.sync.get({ timeRanges: [] }, (result) => {
        const timeRanges = result.timeRanges;
        
        timeRanges.push({
            title: title,
            start: start,
            end: end,
            urls: urls
        });

        chrome.storage.sync.set({ timeRanges }, () => {
            if (chrome.runtime.lastError) {
                console.warn("Failed to add time range:", chrome.runtime.lastError.message);
            } else {
                console.log("Time range added successfully.");
            }
        });
    });
}
*/


function reLoad() {
    chrome.runtime.reload();
}
function timeConvert(time) {
    const [hours, minutes] = time.split(':');
    return Number(hours) + Number(minutes) / 60;
}



// part one

FilterTheStorage();
init();
console.log("Data After Init", TR);



// part 2, add time range wizard

addTimeRangeWizard = document.querySelector('.add-time-range-wizard');
const addTimeRange = document.querySelector('.add-time-range');

addTimeRange.addEventListener('click', () => {
    addTimeRangeWizard.style.display = 'flex';
})
const addTimeRangeAddUrl = document.getElementById('add-time-range-add-url');
    addTimeRangeAddUrl.addEventListener('click', () => {
        const ul = document.querySelector(`.add-time-range-urls`);
        const li = document.createElement('li');
        li.classList.add('url-item');

        li.innerHTML = `
            <span contenteditable="true" class="url">www.</span> 
            <div class="li-end">
                <button class="edit-url"><i class="fa-solid fa-floppy-disk"></i></button>
                <button class="delete-url"><i class="fa-solid fa-trash"></i></button>
            </div>
        `;
        ul.appendChild(li);
        UpdateUrlEditPanelListener();
    })
const addTimeRangeSave = document.querySelector('.add');
addTimeRangeSave.addEventListener('click', () => {
    const title = document.querySelector('.add-time-range-title').value;
    const start = document.querySelector('.start-time-input').value;
    const end = document.querySelector('.end-time-input').value;
    const urls = Array.from(document.querySelectorAll('.add-time-range-urls .url')).map(url => url.innerText);
    const now = new Date();
    const days = Number(document.querySelector(".expired input").value) || 0;
    const expired = new Date(now.getTime() + days * 24 * 3600 * 1000).getTime();
    const timeRange = {
        expire : expired,
        title : title,
        start : start,
        end : end, 
        urls : urls
    }
    if(start && end){
        if(timeConvert(start) > timeConvert(end)){
            alert('Start time cannot be greater than end time');
            return;
        }
    }
    if(title.length < 3 || !start || !end || urls.length < 1){
        alert('All fields are required');
        return;
    }
    console.log(timeRange);
    AddTimeRangeToStorage(timeRange);
    addTimeRangeWizard.style.display = 'none';
    window.location.reload();
})


// part 3, 


function UpdateUrlEditPanelListener() {
    document.querySelectorAll('.url-item').forEach(li => {
      const [timeRangeId, urlId] = li.id.split('-');
      const delBtn = li.querySelector('.delete-url');
      const editUrl = li.querySelector('.edit-url');
      
      delBtn.addEventListener('click', () => {
          console.log(" timeRangeID: ", timeRangeId," urlId: ", urlId);
          DeleteURLFromStorage(timeRangeId, urlId);
          li.remove();
      });
      editUrl.addEventListener('click', () => {
          const url = li.querySelector('.url');
          const isEditing = url.contentEditable === "true"; 
          const icon = editUrl.querySelector('i');
          if (isEditing) {
              url.contentEditable = false;
              icon.classList.remove('fa-floppy-disk');
              icon.classList.add('fa-pen');
              UpdateURLToStorage(timeRangeId, urlId, url.innerText); // be carefull
              console.log(" timeRangeID: ", timeRangeId," urlId: ", urlId, "URL: ", url.innerText);
              
          } else {
              url.contentEditable = true;
              url.focus();
              icon.classList.remove('fa-pen');
              icon.classList.add('fa-floppy-disk');

          }
          
      })
      
  })

  }
  
  UpdateUrlEditPanelListener();

  /**
   * document.querySelectorAll('.delete-time-range').forEach(button => {
    button.addEventListener('click', () => {
      button.closest('.time-range').remove();
    });
  });
   */

  // part 4

  document.querySelectorAll('.time-range').forEach(range => {
    const title = range.querySelector('.title');
    const urls = range.querySelector('.urls');

    title.addEventListener('click', () => {
      urls.classList.toggle('expanded');
    });
  });

  // mood switcher
  const moodSwitcher = document.querySelector('.mood');
  const moodSwitcherIcon = moodSwitcher.querySelector('i');
  const body = document.querySelector('body');
  moodSwitcher.addEventListener('click', () => {
      body.classList.toggle('light-mode');
      if(body.classList.contains('light-mode')){
          moodSwitcherIcon.classList.remove('fa-sun');
          moodSwitcherIcon.classList.add('fa-moon');
      } else {
          moodSwitcherIcon.classList.remove('fa-moon');
          moodSwitcherIcon.classList.add('fa-sun');
      }
    }
  )