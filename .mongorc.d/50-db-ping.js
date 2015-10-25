
// Adds `db.ping()` as an alias for `db.runCommand("ping")`
//
// Takes an optional argument which is included in the command object; can be used to pad out
// the size of the ping that is sent (but not the size of the reply, which will always be small).

DB.prototype.ping = function (payload) {
	var cmd = { ping: 1 };
	if (typeof(payload) !== "undefined") {
		cmd.payload = payload;
	}
	return this.runCommand(cmd);
};

