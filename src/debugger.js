;(function (window, document) {

chrome.devtools.network.onRequestFinished.addListener(function (request) {
    if (/^(.+\/[^.?]+)(?:\?.+)?$/.test(request.request.url) && !!getApiLocation(request.request.url)) {
        loadRequest(request);
    }
});

// ---

var logger = {};

logger.sendMessage = function (type) {
    chrome.extension.sendMessage({
        tabId   : chrome.devtools.inspectedWindow.tabId,
        command : "console",
        type    : type,
        args    : Array.prototype.slice.call(arguments, 1)    // remove "type" params
    });
};

['log', 'warn', 'error', 'info', 'groupCollapsed', 'groupEnd'].forEach(function (type) {
    logger[type] = logger.sendMessage.bind(logger, type);
});

// ---

// **** Add new regex here!
function getApiLocation (url) {
    if (/api\.ovh\.com\/\d+\.\d+/.test(url)) {
        // console
        return url.match(/api\.ovh\.com\/\d+\.\d+(.+)$/)[1];
    } else if (/\/api\/(?:\d+\.\d+\/)?/.test(url)) {
        // v6, webapps, console RunAbove
        return url.match(/\/api(?:\/\d+\.\d+)?(.+)$/)[1];
    }
    return false;
}

function formatTime (time) {
    if (time >= 1000) {
        return (time / 1000).toFixed(3) + "s";
    }

    return time.toFixed(3) + "ms";
}
function formatSize (size) {
    if (size >= 1000) {
        return (size / 1000) + "KB";
    }

    return size + "B";
}

// CSS
var def = 'line-height: 20px; font-family: "Helvetica Neue",Helvetica,Arial,sans-serif; font-size: 12px; font-weight: normal;';
var css = {
    method: function (method) {
        var label = 'border-radius: 3px; font-weight: 700; color: #fff; padding: 1px 8px 2px; font-size: 10px;';
        switch (method) {
        case 'GET':
            return def + label + 'background-color: #3a87ad;';
        case 'POST':
            return def + label + 'background-color: #468847;';
        case 'PUT':
            return def + label + 'background-color: #f89406;';
        case 'DELETE':
            return def + label + 'background-color: #b94a48;';
        default:
            return def;
        }
    },
    location: function () {
        return def + 'font-weight: 700; font-size: 13px;';
    },
    infos: function () {
        return def + 'color: #999; font-size: 10px;';
    },
    status: function (status) {
        if (status < 300) {
            return def + 'color: #27ae60; font-size: 10px;';
        } else if (status < 400) {
            return def + 'color: #f39c12; font-size: 10px;';
        } else {
            return def + 'color: #e74c3c; font-size: 10px; font-weight: 700;';
        }
    }
};

// ---

function loadRequest (request) {

    request.getContent(function (content, encoding) {

        var header =
            "%c" + request.request.method + "%c " +
            getApiLocation(request.request.url.split('?')[0]) + " %c (" +
            "%c" + (request.response.status + " " + request.response.statusText) + "%c - " +
            formatTime(request.time) + " - " +
            formatSize(request.response.bodySize + request.response.headersSize) +
            ")";

        logger.groupCollapsed(header, css.method(request.request.method), css.location(), css.infos(), css.status(request.response.status), css.infos());

        // URL params
        if (request.request.queryString && request.request.queryString.length) {
            logger.log('%cParams  :', 'font-weight: 700', request.request.queryString);
        }

        // Body
        if (request.request.postData && request.request.postData.text) {
            var data;
            try {
                data = JSON.parse(request.request.postData.text);
            } catch (e) {
                data = request.request.postData.text.substring(0, 140) + ((request.request.postData.text.length > 140) ? "..." : "");
            }
            logger.log('%cData    :', 'font-weight: 700', data);
        }

        // Response
        var response = null;
        if (content) {
            try {
                response = JSON.parse(content);
            } catch (e) {
                response = content.substring(0, 140) + ((content.length > 140) ? "..." : "");
            }
        }

        logger.log("%cResponse:", 'font-weight: 700', response);

        logger.groupEnd();
    });
}

})(window, document, undefined);
