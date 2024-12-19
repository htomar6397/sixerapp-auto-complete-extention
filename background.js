chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookie") {
    chrome.cookies.get(
      { url: "https://sixerapp.com", name: "_banana_session" },
      (cookie) => {
        if (cookie) {
          sendResponse({ cookie: "_banana_session=" +cookie.value });
        } else {
          sendResponse({ cookie: null });
        }
      }
    );
    return true; // Keep the message channel open for sendResponse
  }
});
