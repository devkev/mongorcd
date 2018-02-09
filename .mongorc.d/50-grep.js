shellHelper.grep = (function () {

var parser = function (s) {
	var res = {
		options: [],
		pattern: "",
		cmd: "",
	};

	// this stup hand-constructed parser (including the mess in parsing the pattern) is actually the best/easiest option... >:(

	var i = 0;

	// optional: leading whitespace
	while (i < s.length && (s[i] == ' ' || s[i] == '\t') ) {
		i++;
	}

	// optional: one or more options (starts with -)
	while (i < s.length && s[i] == '-') {
		var word = '';
		while (i < s.length && (s[i] != ' ' && s[i] != '\t') ) {
			word += s[i];
			i++;
		}
		while (i < s.length && (s[i] == ' ' || s[i] == '\t') ) {
			i++;
		}
		// -- is special
		if (word == "--") {
			break;
		} else {
			res.options.push(word);
		}
	}

	// required: pattern
	const normal = 0;
	const singleQuote = 1;
	const doubleQuote = 2;
	var context = normal;
	while (true) {
		if (i >= s.length) {
			if (context == normal) {
				break;
			} else if (context == singleQuote) {
				throw "Unterminated single quote";
			} else if (context == doubleQuote) {
				throw "Unterminated double quote";
			}
		} else if (s[i] == ' ' || s[i] == '\t') {
			if (context == normal) {
				break;
			} else if (context == singleQuote || context == doubleQuote) {
				res.pattern += s[i];
			}
		} else if (s[i] == '\\') {
			i++;
			if (i >= s.length) {
				res.pattern += '\\';
				break;
			} else if (s[i] == '"' || s[i] == "'" || s[i] == '\\' || s[i] == ' ') {
				res.pattern += s[i];
			} else if (s[i] == 'a') {
				res.pattern += '\a';
			} else if (s[i] == 'b') {
				res.pattern += '\b';
			} else if (s[i] == 't') {
				res.pattern += '\t';
			} else if (s[i] == 'n') {
				res.pattern += '\n';
			} else if (s[i] == 'v') {
				res.pattern += '\v';
			} else if (s[i] == 'f') {
				res.pattern += '\f';
			} else if (s[i] == 'r') {
				res.pattern += '\r';
			} else {
				res.pattern += '\\' + s[i];
			}
		} else if (s[i] == "'") {
			if (context == normal) {
				context = singleQuote;
			} else if (context == singleQuote) {
				context = normal;
			} else if (context == doubleQuote) {
				res.pattern += s[i];
			}
		} else if (s[i] == '"') {
			if (context == normal) {
				context = doubleQuote;
			} else if (context == doubleQuote) {
				context = normal;
			} else if (context == singleQuote) {
				res.pattern += s[i];
			}
		} else {
			res.pattern += s[i];
		}
		i++;
	}

	// required: whitespace
	while (i < s.length && (s[i] == ' ' || s[i] == '\t') ) {
		i++;
	}

	// required: rest (cmd)
	res.cmd = s.substr(i);

	return res;
};


return function (str) {
	var hlStart = "\033[01;31m\033[K";   // red
	var hlEnd = "\033[m\033[K";          // clear

	var flags = "g";
	var negate = false;

	// parse options/pattern
	//print("str = " + tojson(str));
	var parsed = parser(str);
	//print("parsed = " + tojson(parsed));

	if (parsed.pattern == "") {
		print("grep: no cmd specified");
		return;
	}
	if (parsed.cmd == "") {
		print("grep: no cmd specified");
		return;
	}

	var i = 0;
	while (i < parsed.options.length) {
		if (parsed.options[i] == "-i") {
			flags += "i";
		} else if (parsed.options[i] == "-v") {
			negate = true;
		// FIXME: -c
		// FIXME: --color/--nocolor
		// FIXME: -m
		// FIXME: -n
		// FIXME: -A/-B/-C would be awesome
		}
		i++;
	}

	var pattern = new RegExp(parsed.pattern, flags);

	var lines = print.captureAllOutput(function () { shellPrint(eval(parsed.cmd)) }).output;
	for (var l in lines) {
		var line = lines[l];
		var found = false;
		var highlighted = line.replace(pattern, function (match) { found = true; return hlStart + match + hlEnd; });
		if ( (!negate && found) || (negate && !found) ) {
			print(highlighted);
		}
	}
};

})();

