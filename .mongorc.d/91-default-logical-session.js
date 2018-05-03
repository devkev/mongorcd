
// All ops go into a logical session by default.

var _sessionify = function (_db) {
	if (typeof(_db) !== "undefined" && "startSession" in _db.getMongo()) {
		try {
			_db = _db.getMongo().startSession().getDatabase(_db.getName());
			// SERVER-19710
			//shellPrint(_db.getSession());
			print(_db.getSession());
		} catch (e) {
			// Probably connected to an old server.  Oh well.
		}
	}
	return _db;
};


if (typeof(db) != "undefined") {

	// It can sometimes be useful to do ops outside of any logical session.
	// So hang onto the original db for that purpose.
	// If in the future the default db gets a session, then this will stop working
	// (and we'll have to figure out how to do it the right way).
	_db = db;

	// The main `db` object (if there is one).
	db = _sessionify(db);

}


// Any new db objects created via `connect()`.
_connect = connect;
connect = function (...args) {
	return _sessionify(_connect.apply(null, args));
};


