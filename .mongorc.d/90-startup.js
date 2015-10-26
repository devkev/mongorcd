
// At startup, more clearly print out:
//  - the address of the remote server
//  - the version of the remote server
//  - the current db
//
// The default mongo shell just says "connecting to: [host[:port]]/test", which is ambiguous
// and easily misunderstood.  eg:
//
//     $ mongo localhost --norc
//     MongoDB shell version: 2.6.11
//     connecting to: localhost
//     >
//     bye
//     $ mongo localhost
//     MongoDB shell version: 2.6.11
//     connecting to: localhost
//     connection to 127.0.0.1, version 2.6.10
//     db: localhost
//     >


// Also makes a variable `mongo` which is a shortcut to `db.getMongo()`.
// Mainly, this allows tab completion on the `mongo` object.
// Note: if `db` is updated to an object that has a different `mongo` connection
// object, the `mongo` object will not automatically be updated.


if (typeof(db) !== "undefined") {
	print(db.getMongo() + ", version " + db.version())
	print("db: " + db)

	mongo = db.getMongo();
}

