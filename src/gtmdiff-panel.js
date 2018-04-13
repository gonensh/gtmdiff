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
document.getElementById('diff-by-word').addEventListener('click',fetchDiffCode);
document.getElementById('diff-by-line').addEventListener('click',fetchDiffCode);
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
					diffUsingJSlib(masterDiv.innerText.trim(), changeDiv.innerText.trim());
				}
			}
	});
}

function diffUsingJSlib(master, change) {
	var diffType = document.getElementById('diff-by-word').checked ? 'diffWords' : 'diffLines';
	var diff = JsDiff[diffType](master, change),
	diffoutput = document.getElementById("diffoutput"),
	fragment = document.createDocumentFragment();
	for (var i = 0; i < diff.length; i++) {

		if (diff[i].added && diff[i + 1] && diff[i + 1].removed) {
			var swap = diff[i];
			diff[i] = diff[i + 1];
			diff[i + 1] = swap;
		}

		var node;
		if (diff[i].removed) {
			node = document.createElement('del');
			node.appendChild(document.createTextNode(diff[i].value));
		} else if (diff[i].added) {
			node = document.createElement('ins');
			node.appendChild(document.createTextNode(diff[i].value));
		} else {
			node = document.createTextNode(diff[i].value);
		}
		fragment.appendChild(node);
	}

	diffoutput.textContent = '';
	diffoutput.appendChild(fragment);
}
