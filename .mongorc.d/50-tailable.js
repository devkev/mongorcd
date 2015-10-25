
// Various query helpers for cursor options.


// db.foo.find().tailable()
//  - sets the "tailable" option on the cursor
//
// db.foo.find().awaitData()
//  - sets the "awaitData" option on the cursor
//
// db.foo.find().oplogReplay()
//  - sets the "oplogReplay" option on the cursor
//
// db.foo.find().noTimeout()
//  - sets the "noTimeout" option on the cursor


// db.foo.find().tailForever(func)
// db.foo.find().tail(func)
//  - creates a tailable, awaitData, noTimeout cursor, and passes each document returned to
//    an invocation of the `func` function
//
// db.foo.find().oplogReplay().tailForever(func)
// db.foo.find().oplogReplay().tail(func)
//  - As above, but also an "oplogReplay" cursor



DBQuery.prototype.tailable = function () {
	return this.addOption(DBQuery.Option.tailable);
};

DBQuery.prototype.awaitData = function () {
	return this.addOption(DBQuery.Option.awaitData);
};

DBQuery.prototype.oplogReplay = function () {
	return this.addOption(DBQuery.Option.oplogReplay);
};

DBQuery.prototype.noTimeout = function () {
	return this.addOption(DBQuery.Option.noTimeout);
};

DBQuery.prototype.tailForever = function (func) {
	// If you want oplogReplay, then ask for it yourself before calling tailForever
	var cursor = this.tailable().awaitData().noTimeout();
	while (1) {
		cursor.forEach(func);
	}
};

DBQuery.prototype.tail = DBQuery.prototype.tailForever;

