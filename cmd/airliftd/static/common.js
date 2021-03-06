var messageTimeout;

function $(sel, root) {
	return (root || document).querySelector(sel);
}

function $$(sel, root) {
	return (root || document).querySelectorAll(sel);
}

Node.prototype.sacrificeChildren = function() {
	while (this.hasChildNodes()) this.removeChild(this.firstChild);
};

function chain(f) {
    return {
        i: 0,
        funcs: f != null ? [f] : [],
        err: null,
        catcher: null,
        then: function(g) {
            this.funcs = this.funcs || [];
            this.funcs.push(g);
            return this;
        },
        pass: function() {
            if (this.i < this.funcs.length) {
                var args = [this.pass.bind(this), this.fail.bind(this)];
                if (arguments != null) {
                    args = args.concat(Array.prototype.slice.call(arguments));
                }
                this.funcs[this.i++].apply(this, args);
            }
            return this;
        },
        fail: function(err) {
            if (this.catcher != null) {
                this.catcher(err);
            }
            return this;
        },
        catch: function(g) {
            this.catcher = g;
            return this;
        }
    };
}

function makesvg(elem) {
	return document.createElementNS("http://www.w3.org/2000/svg", elem);
}

function showMessage(msg, classname) {
	if (messageTimeout != null) {
		window.clearTimeout(messageTimeout);
	}

	var box = $('#message-box');
	box.innerText = msg;
	box.classList.add(classname);
	box.classList.add('active')
	messageTimeout = window.setTimeout(hideMessage, 5000);
}

function hideMessage() {
	$('#message-box').classList.remove('active');
}

function errorMessage(resp) {
	var err = resp.Err || resp;
	if (err != null) {
		showMessage('Error: ' + err, 'bad');
	} else {
		console.error('errorMessage: malformed error object');
		console.log(resp);
		showMessage('An unknown error occurred (status ' + code + ')', 'bad');
	}
}

// method string
// url    string
// data   Object - post form data or null
// cb     function(code int, resp Object) - callback
// mutate function(x XMLHttpRequest, afteropen Boolean) [opt] -
//  callback to mutate xhr before request
function json(method, url, data, cb, mutate) {
	var x = new XMLHttpRequest();
	var h = function(x) {
		var resp = {};
		if (x.response != '') {
			try {
				resp = JSON.parse(x.response);
			} catch (err) {
				console.error(err);
				showMessage('Something\'s wrong with the server (status ' + code + ')', 'bad');
				return false;
			}
		}
		return cb(x.status, resp);
	};

	x.addEventListener('load', function(e) { h(e.target); }, false);

	if (mutate != null) {
		mutate(x, false);
	}

	x.open(method, url, true);

	if (mutate != null) {
		mutate(x, true);
	}

	x.send(data);
}

function reloadSection(endpoint, target, cb) {
	var x = new XMLHttpRequest();
	x.addEventListener('load', function(e) {
		var section    = $(target);
		var newSection = $(target, e.target.response);
		section.parentNode.replaceChild(newSection, section);
		if (cb != null) {
			cb();
		}
	}, false);
	x.open('GET', endpoint, true);
	x.responseType = 'document';
	x.setRequestHeader('X-Ajax-Partial', 1);
	x.send();
}

function redirectLogin(returnPath) {
	returnPath = returnPath || window.location.pathname;
	window.location = '/-/login?return=' + encodeURIComponent(returnPath);
}
