
// The simplest node.js compatible `require()` loader you could possibly imagine.
// Seems to work for relatively simple modules like `shell-quote`.

// cd into your .mongorc.d directory, and then use `npm install foobar` to install stuff under the `node_modules` subdirectory.

function require(name) {
	// FIXME: some caching would be nice

	var module = {};
	module.exports = {};
	var exports = module.exports;

	// https://stackoverflow.com/questions/25574826/how-to-requiremodule-in-mongo-shell
	// http://fredkschott.com/post/2014/06/require-and-the-module-system/

	// exports, require, module, __filename, __dirname

	// find the file for the named module.
	if (name.indexOf("/") >= 0) {
		// if there is a "/", then interpret it relative to the current directory (append ".js").

		//load(name + ".js");  // uses global scope, doesn't see variables here
		var contents = cat(name + ".js");
		eval(contents);

	} else {
		// otherwise, go looking in .mongorc.d/node_modules/<name> (cd into there before, back to owd afterwards, and while in there load index.js)

		var owd = pwd();
		cd(_mongorcd + "/node_modules/" + name);
		//load("index.js");  // uses global scope, doesn't see variables here
		var contents = cat("index.js");
		eval(contents);
		cd(owd);
	}

	return module.exports;
}

