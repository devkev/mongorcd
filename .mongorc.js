
try {

	// Find the location of .mongorc.js (and therefore then the home directory).
	if (typeof(_homedir) === "undefined") {
		try {
			throw(new Error(""));
		} catch (e) {
			s = (e.stack);
			var _homedir = s.replace(/(.|\n)*at (.*)\.mongorc\.js:[0-9]+:[0-9]+$/, "$2");
		}
	}

	if (typeof(_mongorcjs) === "undefined") {
		var _mongorcjs = _homedir + ".mongorc\.js";
	}

	if (typeof(_mongorcd) === "undefined") {
		var _mongorcd = _homedir + ".mongorc\.d";
	}

	allfiles = [];
	try {
		allfiles = ls(_mongorcd);
	} catch (e) {
	}

	numLoaded = 0;
	numFailed = 0;
	allfiles.sort().forEach(function (file) {
		if (file.endsWith(".js")) {
			if (_verboseShell) { // Bit pointless, because this isn't set by "mongo --verbose" like you'd expect
				print("Loading " + file + "...");
			}
			var success = undefined;
			try {
				success = load(file);
			} catch (e) {
				success = e;
			}
			if (success == true) {
				numLoaded++;
			} else {
				numFailed++;
				if (typeof(success) == "undefined") {
					// Shouldn't happen, no extra info to print, at any rate
					print("*** Error loading " + file + ", continuing anyway ***");
				} else if (success == false) {
					// wut?
					print("*** Error loading " + file + ", continuing anyway ***");
				} else {
					print(success.stack);
				}
			}
		}
	});
	if ( _verboseShell || ! __quiet && numFailed > 0) {
		print("Loaded", numLoaded, (numFailed > 0 ? "(" + numFailed.toString() + " failed) " : "") + "files from", _mongorcd);
	}

} catch (e) {
	print(e.stack);
	print("*** Error loading .mongorc.js, continuing anyway ***");
}

// Don't leak temporary variables
delete s;
delete numLoaded;
delete numFailed;
delete allfiles;

