// DevTools panel

document.getElementById('show-code').addEventListener('click',toggleShowCode);
document.getElementById('show-diff').addEventListener('click',toggleShowCode);

function toggleShowCode(){
	var masterDiv = document.getElementById('diff-master'),
		changeDiv = document.getElementById('diff-change'),
		outputDiv = document.getElementById('diff-output');
		debugger;
	if(document.getElementById('show-diff').checked) {
		masterDiv.classList.add('hidden');
		changeDiv.classList.add('hidden');
		outputDiv.classList.remove('hidden');
	}
	else {
		masterDiv.classList.remove('hidden');
		changeDiv.classList.remove('hidden');
		outputDiv.classList.add('hidden');
	}
}

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
	diffoutput = document.getElementById("diff-output"),
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


this.addEventListener('focus', function(){
	fetchDiffCode();
});