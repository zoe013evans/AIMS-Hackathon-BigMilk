document.addEventListener('DOMContentLoaded', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) return;

  const tabData = await chrome.storage.session.get(tab.id.toString());
  const siteInfo = tabData[tab.id.toString()];

  const container = document.getElementById('container');
  const icon = document.getElementById('canary-icon');
  
  // Clear any previous state classes
  container.className = '';

  if (siteInfo && siteInfo.status === 'good') {
    // --- CASE 1: GOOD & MONITORED (e.g., Vegemite) ---
    container.classList.add('status-good');
    icon.src = 'icons/canary-singing-128.png';
    populatePopup(siteInfo);

  } else if (siteInfo && siteInfo.status === 'flagged') {
    // --- CASE 2: FLAGGED & MONITORED (e.g., Blundstone) ---
    container.classList.add('status-flagged');
    icon.src = 'icons/canary-dead-128.png';
    populatePopup(siteInfo);

  } else if (siteInfo && siteInfo.status === 'neutral') {
    // --- CASE 3: NEUTRAL & MONITORED (e.g., Qantas) ---
    container.classList.add('status-neutral');
    icon.src = 'icons/canary-normal-128.png';
    populatePopup(siteInfo);

  } else {
    // --- CASE 4: NEUTRAL & UNMONITORED (e.g., Google) ---
    icon.src = 'icons/canary-normal-128.png';
    document.getElementById('site-title').textContent = "Canary is Watching";
    document.getElementById('short-explanation').textContent = "This site is not on our monitored list. No specific data is available.";
  }
});

function populatePopup(data) {
  document.getElementById('site-title').textContent = data.title;
  document.getElementById('short-explanation').textContent = data.shortExplanation;
  document.getElementById('transparency-status').textContent = data.details.transparency;
  document.getElementById('compliance-score').textContent = data.details.compliance;
  document.getElementById('ngo-warning').textContent = data.details.ngoWarning;

  const linksList = document.getElementById('links-list');
  linksList.innerHTML = ''; // Clear old links
  if (data.links && data.links.length > 0) {
    data.links.forEach(link => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = link.url;
      a.textContent = link.text;
      a.target = '_blank'; // Open links in a new tab
      li.appendChild(a);
      linksList.appendChild(li);
    });
  }
}