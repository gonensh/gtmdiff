// content-script.js
var gtmdiffExtensionId = 'eappjeaglbbbnhekookimaobfkdmolah';

window.extensionsLoaded = window.extensionsLoaded || {};
if (typeof window.extensionsLoaded[gtmdiffExtensionId] === 'undefined') {

	window.addEventListener('message', function (event) {
		// Only accept messages from the same frame
		if (event.source !== window) {
			return;
		}

		var message = event.data;

		// Only accept messages that we know are ours
		if (typeof message !== 'object' || message === null ||
			message.source !== 'gtmdiff') {
			return;
		}
	});

	window.extensionsLoaded[gtmdiffExtensionId] = true;
}