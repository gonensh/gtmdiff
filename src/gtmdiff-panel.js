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
document.getElementById('inline-true').addEventListener('click',fetchDiffCode);
document.getElementById('inline-false').addEventListener('click',fetchDiffCode);
fetchDiffCode();

function fetchDiffCode(){
	chrome.devtools.inspectedWindow.eval(`
		// Fetch diff code
		var gtmdiffOutput = {master:(function(){var s='';
				document.querySelectorAll('.diff-side .CodeMirror-line span[role="presentation"]:not([class])')
				.forEach(function(e){
					s+="\\r\\n"+e.textContent;
				});
				return s;})(),change:(function(){var s='';
				document.querySelectorAll('.main-side .CodeMirror-line span[role="presentation"]:not([class])')
				.forEach(function(e){
					s+="\\r\\n"+e.textContent;
				});
				return s;})()};
				gtmdiffOutput;
		`, (result, isException) => {
			if(typeof isException !== 'undefined' && isException.isException){
				console.error('Error in content script: ' + isException);
			}
			var masterDiv = document.getElementById('diff-master'),
			changeDiv = document.getElementById('diff-change');
			if(typeof result === 'object'){
				if(typeof result.master === 'string'){
					masterDiv.innerText = result.master;
				}
				if(typeof result.change === 'string'){
					changeDiv.innerText = result.change;
				}

				if(masterDiv.innerText.length > 0 && changeDiv.innerText.length > 0){
					diffUsingJS(masterDiv.innerText.trim(), changeDiv.innerText.trim());
				}
			}
	});
}

function diffUsingJS(base, newtxt) {
	"use strict";
		var sm = new difflib.SequenceMatcher(base, newtxt),
		opcodes = sm.get_opcodes(),
		diffoutputdiv = document.getElementById("diffoutput"),
		contextSize = 7,
		viewType = document.getElementById('inline-true').checked ? 1 : 0;

	diffoutputdiv.innerHTML = "";
	contextSize = contextSize || null;

	diffoutputdiv.appendChild(diffview.buildView({
		baseTextLines: difflib.stringAsLines(base),
		newTextLines: difflib.stringAsLines(newtxt),
		opcodes: opcodes,
		baseTextName: "Base",
		newTextName: "Change",
		contextSize: contextSize,
		viewType: viewType
	}));
}

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