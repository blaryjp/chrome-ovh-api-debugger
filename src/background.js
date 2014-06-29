// onMessage, if from console, eval function to call the right console fct with args
chrome.extension.onMessage.addListener(function (request) {
	if (request.command === 'console') {
        chrome.tabs.executeScript(request.tabId, {
            code: "(function (type, args) { " +
                      "console[type].apply(console, JSON.parse(decodeURI(args))); " +
                  "})('" + request.type + "','" + encodeURI(JSON.stringify(request.args)) + "');"
        });
    }
});
