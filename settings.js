function delete_onclick(event) {
    var delete_button = event.target;
    var parent_div = delete_button.parentNode;

    parent_div.remove();
}

function new_onclick() {
    var form = create_template_form({});
    document.getElementById("inputs").appendChild(form);
}

function remove_children(elem) {
    var first_child = elem.firstChild;

    while (first_child) {
	elem.removeChild(first_child);
	first_child = elem.firstChild;
    }
}

function write_status(text, timeout=NaN) {
    var status_div = document.getElementById("status");

    remove_children(status_div);

    status_div.appendChild(document.createTextNode(text));

    if (isFinite(timeout)) {
	setTimeout(function () {
	    remove_children(status_div);
	}, timeout);
    }
}

function create_template_form(settings) {
    var template_div = document.createElement("div");
    template_div.className = "template";

    var key_input = document.createElement("input");
    if (settings.key) {
	key_input.value = settings.key;
    }
    key_input.className = "key-input";
    key_input.placeholder = "key";
    template_div.appendChild(key_input);

    var name_input = document.createElement("input");
    if (settings.name) {
	name_input.value = settings.name;
    }
    name_input.placeholder = "template name";
    name_input.className = "name-input";
    template_div.appendChild(name_input);

    var delete_button = document.createElement("button");
    delete_button.appendChild(document.createTextNode("X"));
    delete_button.onclick = delete_onclick;
    template_div.appendChild(delete_button);

    return template_div;
}

function factory_defaults() {
    var ok = confirm("Really reset all templates?");
    if (ok == false) {
	return;
    }

    chrome.storage.sync.clear();
    var container = document.getElementById("inputs");
    var children = container.childNodes;
    for (var i = 0; i < children.length; i++) {
	var child = children[i];
	if (child.className != "template") {
	    continue;
	}
	child.remove();
    }

    restore_options();
}

function get_form_values() {
    var container = document.getElementById("inputs");

    var templates = [];
    var children = container.childNodes;
    for (var i=0; i < children.length; i++) {
	var child = children[i];
	var template = {};

	var inputs = child.childNodes;
	for (var j = 0; j < inputs.length; j++) {
	    var input = inputs[j];
	    if (input.className == "key-input") {
		template["key"] = input.value;
	    } else if (input.className == "name-input") {
		template["name"] = input.value;
	    }
	}
	if (('key' in template) || ('name' in template)) {
	    templates.push(template);
	}
    }
    return templates;
}

function get_key_error(key) {
    if (key.length > 1) {
	return "Incorrect key: " + key + ". ";
    }
    if (key.length < 1) {
	return "Incorrect empty key!" ;
    }
    return "";
}
    
function get_options_errors() {
    var templates = get_form_values();
    var keys = {};
    var status = "";
    for (var i = 0; i < templates.length; i++) {
	var template = templates[i];	

	var error = get_key_error(template.key);
	if (error) {
	    status += error;
	    return status;
	}

	if (template.key in keys) {
	    status += "Duplicate key: " + template.key + ". ";
	} else {
	    keys[template.key] = true;
	}
    }
    return status;
}

function save_options() {
    var templates = get_form_values();
    var errors = get_options_errors(templates);
    if (errors) {
	write_status(errors + "Not saved!");
	return;
    }
    chrome.storage.sync.set({
	template_list: templates
    }, function() {
	write_status("options saved!", 5000);
    });
}

function restore_options() {
    var container = document.getElementById("inputs");

    chrome.storage.sync.get({
	template_list: [{key: 'L', name: 'simple link'}]
    }, function(settings) {
	var xs = settings.template_list;
	for (var i = 0; i < xs.length; i++) {
	    container.appendChild(create_template_form(xs[i]));
	}
    });

    document.getElementById("new-button").onclick = new_onclick;
    document.getElementById("save-button").onclick = save_options;
    document.getElementById("reset-button").onclick = factory_defaults;
}

document.addEventListener('DOMContentLoaded', restore_options);
