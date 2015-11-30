
// Given a bunch of db objects, use dbhash to determine which collections differ between the DBs.
// Great for quickly checking a set of config server dumps which have been mongorestored (with a little effort, you could connect to each of the config servers directly).

compareDbs = function (db1, db2, db3) {

	var dbs = Array.prototype.slice.call(arguments);

	var res = {};
	for (var i in dbs) {
		var result = dbs[i].runCommand("dbhash");
		if (result.ok) {
			for (var c in result.collections) {
				if (!res[c]) {
					res[c] = {};
				}
				res[c][dbs[i]] = result.collections[c];
			}
		}
	}

	if ( ! res.shellPrint) {
		res.shellPrint = function () {
			var maxCollLen = 10;
			for (var c in this) {
				if (c.length > maxCollLen) {
					maxCollLen = c.length;
				}
			}

			var s = "||    Collection" + genstr(maxCollLen - 10, " ") + " || ";
			for (var i in dbs) {
				s = s + dbs[i].getName() + genstr(32 - dbs[i].getName().length, " ") + " || ";
			}
			print(s);

			// This is a much dodgier hack than what mongo-hacker uses.  Oh well.
			var red = String.fromCharCode(0x1B) + '[31;1m';
			var green = String.fromCharCode(0x1B) + '[32m';
			var normal = String.fromCharCode(0x1B) + '[0m';

			for (var c in this) {
				if (c == "shellPrint" && typeof(this[c]) == "function") {
					continue;
				}

				var same = true;
				for (var i in dbs) {
					if (this[c][dbs[i]] !== this[c][dbs[0]]) {
						same = false;
						break;
					}
				}

				var s = "| " + (same ? "(/) " : "(x) ") + c + genstr(maxCollLen - c.length, " ") + " |  ";
				for (var i in dbs) {
					s = s + this[c][dbs[i]] + " |  ";
				}
				var color = same ? green : red;
				print(color + s + normal);
			}
			//printjson(this);
		};
	}

	return res;

};


