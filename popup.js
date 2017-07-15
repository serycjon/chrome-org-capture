function get_current_url(callback) {
    var queryInfo = {
	active: true,
	lastFocusedWindow: true
    };

    chrome.tabs.query(queryInfo, function(tabs) {
	var tab = tabs[0];
	var url = tab.url;

	callback(url);
    });
}

function render_status(url, title, selection) {
    document.getElementById('status').textContent = 'url: ' + url + "; " +
	"title: " + title + "; " + "selection: " + selection;
}

function add_buttons(templates, contents, new_style) {
    var container = document.getElementById("container");

    for (var i = 0; i < templates.length; i++) {
	var template = templates[i];
	var button = document.createElement("button");
	var text = template.name + ' [key: ' + template.key + ']';
	button.appendChild(document.createTextNode(text));

	// damn javascript closure weird stuff
	button.onclick = function(template, new_style) {
	    return function() {
		capture(template, contents, new_style);
	    };
	}(template, new_style);

	container.appendChild(button);
    }
}

function capture(template, contents, new_style) {
    var uri = '';
    if (new_style) {
	uri += 'org-protocol://capture?';
	uri += 'template=' + template.key;
	uri += '&url=' + encodeURIComponent(contents.url);
	uri += '&title=' + encodeURIComponent(contents.title);
	uri += '&body=' + encodeURIComponent(contents.selection);
    } else {
	uri += 'org-protocol://capture:/';
	uri += template.key + '/';
	uri += encodeURIComponent(contents.url) + '/';
	uri += encodeURIComponent(contents.title) + '/';
	uri += encodeURIComponent(contents.selection);
    }
    console.log('capturing ' + uri);
    chrome.tabs.update(null, {url: uri});
    window.close();
}

function add_key_listener(templates, contents, new_style) {
    var keys = {};
    for (var i = 0; i < templates.length; i++) {
	keys[templates[i].key] = templates[i];
    }

    document.onkeydown = function(evt) {
	evt = evt || window.event;
	if (evt.keyCode != 16) { // shift key
	    var c = String.fromCharCode(evt.keyCode);
	    if (!(evt.shiftKey)) {
		c = c.toLowerCase(c);
	    }

	    if (c in keys) {
		capture(keys[c], contents, new_style);
	    }
	}
    };
}

document.addEventListener('DOMContentLoaded', function() {
    get_current_url(function(url) {
	// does this really have to be so ugly?
	chrome.tabs.executeScript( {
	    code: "var x = [document.title, window.getSelection().toString()]; x"
	}, function(info) {
	    var title = info[0][0];
	    var selection = info[0][1];

	    render_status(url, title, selection);

	    var contents = {url: url,
			    title: title,
			    selection: selection};

	    chrome.storage.sync.get({
		template_list: [{key: 'L', name: 'simple link'}],
		new_style: true
	    }, function(settings) {
		var templates = settings.template_list;
		add_buttons(templates, contents, settings.new_style);
		add_key_listener(templates, contents, settings.new_style);
	    });
	});
    });
});
