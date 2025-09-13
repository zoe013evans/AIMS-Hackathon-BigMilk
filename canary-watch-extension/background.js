let sitesData = {};
let dataLoadingPromise = null;

// This function now manages a promise to ensure data is loaded only once.
function loadData() {
  // If we are already loading or have loaded the data, return the existing promise.
  if (dataLoadingPromise) {
    return dataLoadingPromise;
  }

  // Start loading the data and store the promise.
  dataLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch(chrome.runtime.getURL('data/sites-data.json'));
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`);
      }
      const data = await response.json();
      sitesData = data;
      console.log("Canary Watch: Data loaded successfully.");
      resolve(sitesData);
    } catch (error) {
      console.error("Canary Watch: Failed to load sites data.", error);
      reject(error);
    }
  });

  return dataLoadingPromise;
}

// The update function is now async and waits for the data to be loaded.
async function updateState(tabId, url) {
  if (!url || !url.startsWith('http')) {
      return; // Ignore invalid or non-http URLs
  }

  try {
    // CRITICAL FIX: Wait here until the data is guaranteed to be loaded.
    await loadData(); 

    // ROBUSTNESS FIX: Remove 'www.' for more reliable matching.
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    const siteInfo = sitesData[hostname];
    
    // Store data for the popup. Default to 'unmonitored'.
    chrome.storage.session.set({ [tabId]: siteInfo || { status: 'unmonitored' } });

    let iconPaths;
    if (siteInfo && siteInfo.status === 'good') {
      iconPaths = { "16": "icons/canary-singing-16.png", "48": "icons/canary-singing-48.png", "128": "icons/canary-singing-128.png" };
    } else if (siteInfo && siteInfo.status === 'flagged') {
      iconPaths = { "16": "icons/canary-dead-16.png", "48": "icons/canary-dead-48.png", "128": "icons/canary-dead-128.png" };
    } else {
      iconPaths = { "16": "icons/canary-normal-16.png", "48": "icons/canary-normal-48.png", "128": "icons/canary-normal-128.png" };
    }
    
    chrome.action.setIcon({ path: iconPaths, tabId: tabId });

  } catch (error) {
    console.error(`Canary Watch: Could not process URL: ${url}`, error);
  }
}

// Initiate data loading as soon as the extension starts.
loadData();

// Listeners now call the async updateState function.
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    updateState(tabId, tab.url);
  }
});

chrome.tabs.onActivated.addListener(activeInfo => {
  chrome.tabs.get(activeInfo.tabId, (tab) => {
    if (tab && tab.url) {
      updateState(tab.id, tab.url);
    }
  });
});