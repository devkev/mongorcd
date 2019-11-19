
if (typeof DB.prototype.startTransaction === "undefined") {
    DB.prototype.startTransaction = function () {
        var session = this.getMongo().startSession( { readPreference: { mode: "primary" } } );
        session.startTransaction();
        return session.getDatabase(this.getName());
    };
}

