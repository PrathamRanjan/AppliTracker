chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    console.log("Background script received message:", request);
    if (request.action === 'updateSheet') {
      handleOAuthToken(request.row, sendResponse);
      return true;  // Keep the message channel open for sendResponse
    }
  });
  
  function handleOAuthToken(row, sendResponse) {
    chrome.identity.getAuthToken({ interactive: true }, token => {
      if (chrome.runtime.lastError || !token) {
        console.error("Error getting OAuth token:", chrome.runtime.lastError.message);
        console.error(chrome.runtime.lastError);
        sendResponse({ success: false });
        return;
      }
  
      console.log("OAuth token retrieved:", token);
      updateGoogleSheet(token, row, sendResponse);
    });
  }
  
  function updateGoogleSheet(token, row, sendResponse) {
    chrome.storage.sync.get('spreadsheetId', ({ spreadsheetId }) => {
      if (!spreadsheetId) {
        console.error('Spreadsheet ID not found.');
        sendResponse({ success: false });
        return;
      }
  
      console.log("Updating Google Sheet with ID:", spreadsheetId);
      fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:append?valueInputOption=USER_ENTERED`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          values: [row]
        })
      })
      .then(response => response.json())
      .then(data => {
        console.log('Row added:', data);
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Error adding row:', error);
        sendResponse({ success: false });
      });
    });
  }
  