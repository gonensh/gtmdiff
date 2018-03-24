// DevTools panel
// Create a connection to the background page
var backgroundPageConnection = chrome.runtime.connect();

backgroundPageConnection.onMessage.addListener(function (message) {
	// Ignore messages form other sources
	if(typeof message.source != 'string' || message.source != 'gtmdiff') {
		return;
	}
	console.log(message);
	// Handle responses from the background page
	if(message.master) {
		document.getElementById('diff-master').innerText = message.master;
	}
	if(message.change) {
		document.getElementById('diff-change').innerText = message.change;
	}
});

// Relay the tab ID to the background page
backgroundPageConnection.postMessage({
	name: 'init',
	tabId: chrome.devtools.inspectedWindow.tabId
});

document.getElementById('btn-update').addEventListener('click',fetchDiffCode);
fetchDiffCode();

function fetchDiffCode(){
	chrome.devtools.inspectedWindow.eval(`
		// Fetch diff code
		var gtmdiffOutput = {master:(function(){var s='';
				document.querySelectorAll('.diff-side .CodeMirror-line span[role="presentation"]:not([class])')
				.forEach(function(e){
					s+="\\n"+e.textContent;
				});
				return s;})(),change:(function(){var s='';
				document.querySelectorAll('.main-side .CodeMirror-line span[role="presentation"]:not([class])')
				.forEach(function(e){
					s+="\\n"+e.textContent;
				});
				return s;})()};
				gtmdiffOutput;
		`, (result, isException) => {
			if(typeof isException !== 'undefined' && isException.isException){
				console.error('Error in content script: ' + isException);
			}
			if(typeof result === 'object'){
				if(typeof result.master === 'string'){
					document.getElementById('diff-master').innerText = result.master;
				}
				if(typeof result.change === 'string'){
					document.getElementById('diff-change').innerText = result.change;
				}
			}
	});
}


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
	// All runtime messages
});


var injectContentScript = function() {
  // load injected script
  var xhr = new XMLHttpRequest();
  xhr.open('GET', chrome.extension.getURL('/content-script.js'), false);
  xhr.send();
  var script = xhr.responseText;

  // inject into inspectedWindow
  chrome.devtools.inspectedWindow.eval(script);
};

injectContentScript();