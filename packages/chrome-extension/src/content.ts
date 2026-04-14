console.log('Content script loaded')

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === 'getLocalStorage') {
    const token = localStorage.getItem('token')
    sendResponse({ token })
  }
  return true
})
