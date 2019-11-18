
if (typeof Mongo.prototype.listCursors === "undefined") {
    Mongo.prototype.listCursors = function () {
        return this.getDB("admin").aggregate( [
                { $currentOp: { idleCursors: true } },
                { $match: { cursor: { $exists: true } } },
            ] );
    };
}

if (typeof DB.prototype.listCursors === "undefined") {
    DB.prototype.listCursors = function () {
        return this.getMongo().listCursors();
    };
}

