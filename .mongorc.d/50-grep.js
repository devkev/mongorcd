shellHelper.grep = function (cmd) {
	var hlStart = "\033[01;31m\033[K";   // red
	var hlEnd = "\033[m\033[K";          // clear

	var flags = "g";
	var negate = false;

	// parse options/pattern

	try {
		// do this properly with https://github.com/substack/node-shell-quote
		// FIXME: still doesn't work in common cases, because the parser output ends up like:
		// [ ": false", "db.getParameter", { "op" : "(" }, { "op" : ")" } ]
		var parse = require('shell-quote').parse;
		var parser = function (str) {
			return parse(str);
		};
	} catch (e) {
		// crappy fallback
		print("grep: Warning: Unable to load `shell-quote` module");
		var parser = function (str) {
			return str.split(" ");
		};
	}
	var words = parser(cmd);

	var i = 0;
	while (i < words.length) {
		if (words[i] == "-i") {
			flags += "i";
		} else if (words[i] == "-v") {
			negate = true;
		// FIXME: -c
		// FIXME: --color/--nocolor
		// FIXME: -m
		// FIXME: -n
		// FIXME: -A/-B/-C would be awesome
		} else if (words[i] == "--") {
			i++; // eat the "--"
			break;
		} else if (words[i][0] != "-") {
			break;
		}
		i++;
	}
	// next word is the pattern
	var patternStr = words[i];
	i++;

	// get rid of the first i words, what's left is the actual cmd to run
	var prefix = "";
	for (var j = 0; j < i; j++) {
		prefix += words[j] + "  *";
	}
	cmd = cmd.replace(new RegExp(prefix), "");

	var pattern = new RegExp(patternStr, flags);

	var lines = print.captureAllOutput(function () { shellPrint(eval(cmd)) }).output;
	for (var l in lines) {
		var line = lines[l];
		var found = false;
		var highlighted = line.replace(pattern, function (match) { found = true; return hlStart + match + hlEnd; });
		if ( (!negate && found) || (negate && !found) ) {
			print(highlighted);
		}
	}
};

