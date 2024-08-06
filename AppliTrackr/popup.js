document.addEventListener('DOMContentLoaded', () => {
    console.log("Popup loaded");
  
    chrome.storage.sync.get(['spreadsheetLink'], data => {
      if (data.spreadsheetLink) {
        document.getElementById('spreadsheetLink').value = data.spreadsheetLink;
      }
    });
  
    document.getElementById('scan').addEventListener('click', async () => {
      let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: scrapeJobDetails,
      }, (injectionResults) => {
        for (const frameResult of injectionResults) {
          let data = frameResult.result;
          document.getElementById('company').value = data.company || '';
          document.getElementById('role').value = data.role || '';
          document.getElementById('date').value = data.date || '';
          document.getElementById('status').innerText = 'Scanned successfully!';
        }
      });
    });
  
    document.getElementById('update').addEventListener('click', () => {
      const company = document.getElementById('company').value;
      const role = document.getElementById('role').value;
      const date = document.getElementById('date').value;
      const spreadsheetLink = document.getElementById('spreadsheetLink').value;
  
      if (!spreadsheetLink) {
        alert('Please enter your Google Sheet link.');
        return;
      }
  
      const spreadsheetId = extractSheetIdFromLink(spreadsheetLink);
  
      if (!spreadsheetId) {
        alert('Invalid Google Sheet link.');
        return;
      }
  
      const row = [company, role, date];
      chrome.storage.sync.set({ spreadsheetLink, spreadsheetId }, () => {
        console.log("Sending updateSheet message to background script");
        chrome.runtime.sendMessage(chrome.runtime.id, { action: 'updateSheet', row }, response => {
          if (chrome.runtime.lastError) {
            document.getElementById('status').innerText = 'Update failed!';
            return;
          }
  
          if (response && response.success) {
            document.getElementById('status').innerText = 'Updated successfully!';
          } else {
            document.getElementById('status').innerText = 'Update failed!';
          }
        });
      });
    });
  });
  
  function scrapeJobDetails() {
    let role = document.querySelector('h1.t-24.t-bold.inline')?.innerText ||
               document.querySelector('meta[property="og:title"]')?.content ||
               document.querySelector('meta[name="og:title"]')?.content ||
               document.querySelector('.job-title')?.innerText ||
               document.title ||
               '';
  
    let company = document.querySelector('div[class*="jobs-unified-top-card__company-name"] a.app-aware-link')?.innerText ||
                  document.querySelector('a[data-test-app-aware-link]')?.innerText ||
                  document.querySelector('meta[property="og:site_name"]')?.content ||
                  document.querySelector('meta[name="og:site_name"]')?.content ||
                  document.querySelector('.company-name')?.innerText ||
                  '';
  
    let date = new Date().toISOString().split('T')[0];
  
    return { company, role, date };
  }
  
  function extractSheetIdFromLink(link) {
    const match = link.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  }
  