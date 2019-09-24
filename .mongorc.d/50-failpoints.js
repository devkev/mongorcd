// Interactive usage:
//
//  > fp
//      Print the list of available failpoints with their current values
//
//  > fp.foo<tab>
//      Autocomplete failpoints starting with `foo`
//
//  > fp.foobar
//      Print the current settings for the `foobar` failpoint
//
//  > fp.foobar.alwaysOn()
//  > fp.foobar.on()
//      Enable `foobar` failpoint
//
//  > fp.foobar.times(n)
//      Enable `foobar` failpoint for `n` times
//
//  > fp.foobar.alwaysOn().data( { ... } )
//  > fp.foobar.on().data( { ... } )
//  > fp.foobar.times(n).data( { ... } )
//      Enable `foobar` failpoint while setting optional data parameters
//
//  > fp.foobar.off()
//      Disable `foobar` failpoint
//
//
// Script usage:
//
//  fp.foobar.get()
//      Return the current settings for the `foobar` failpoint
//
//  fp.foobar.alwaysOn().set()
//  fp.foobar.on().set()
//  fp.foobar.times(n).set()
//  fp.foobar.alwaysOn().data( { ... } ).set()
//  fp.foobar.on().data( { ... } ).set()
//  fp.foobar.times(n).data( { ... } ).set()
//      Enable `foobar` failpoint, return cmd result
//
//  fp.foobar.off().set()
//      Disable `foobar` failpoint, return cmd result
//
//  for (let f of fp._list) { ... }
//      Iterate over all failpoint names


function FailPoint(name, curr) {
    this._name = name;
    this._curr = curr;
    this._reset();
}

FailPoint.prototype._reset = function() {
    this._op = 'get';
    this._mode = 'off';
    this._data = undefined;
    return this;
};

FailPoint.prototype.off = function() {
    this._op = 'set';
    this._mode = 'off';
    return this;
};

FailPoint.prototype.alwaysOn = function() {
    this._op = 'set';
    this._mode = 'alwaysOn';
    return this;
};
FailPoint.prototype.on = FailPoint.prototype.alwaysOn;

FailPoint.prototype.times = function(n) {
    this._op = 'set';
    this._mode = { times: n };
    return this;
};

FailPoint.prototype.data = function(data) {
    this._data = data;
    return this;
};

FailPoint.prototype.toString = function() {
    return "Failpoint " + this._name + ": " + tojson(this._curr);
};

FailPoint.prototype.set = function() {
    if (this._op == 'set') {
        var cmd = {configureFailPoint: this._name, mode: this._mode};
        if (this._data) {
            cmd.data = this._data;
        }
        var res = db.adminCommand(cmd);
        this._reset();
        return res;
    }
};

FailPoint.prototype.get = function() {
    // report the current value
    this._curr = db.adminCommand({getParameter:'*'})["failpoint." + this._name];
    return this._curr;
};

FailPoint.prototype.shellPrint = function() {
    var prefix = "";
    if (this._op == 'set') {
        prefix = "Set: ";
        printjson(this.set());
    }
    this.get();
    print(prefix + this);
};


function FPS() {
    this._refresh();
}

FPS.prototype._refresh = function() {
    // enumerate from server
    var list = [];
    var res = db.adminCommand({getParameter:'*'});
    for (var i in res) {
        const prefix = "failpoint.";
        if (i.startsWith(prefix)) {
            list.push(i.substr(prefix.length));
        }
    }

    if (this._list) {
        for (let i of this._list) {
            delete this[i];
        }
    }
    this._list = list;
    for (let i of this._list) {
        this[i] = new FailPoint(i, res["failpoint." + i]);
    }
};

FPS.prototype.shellPrint = function() {
    // sigh, see shellPrint note below
    //this._refresh();
    for (let i of this._list) {
        print(this[i]);
    }
};

FPS.getFPS = function() {
    // Could proxy-ify the `FPS` function itself, to trap `construct`, but that's more effort than it's worth.
    return new Proxy( new FPS(), {
        get: function(obj, prop) {
            // Prevent autocomplete from barfing.
            if (prop === Symbol.toPrimitive) return function () { return "FPS" };

            // Should be in FPS.prototype.shellPrint, but the Proxy because `this`, which makes it not work.
            if (prop === "shellPrint") obj._refresh();

            if (prop in obj) return obj[prop];

            obj[prop] = new FailPoint(prop);
            return obj[prop];
        },
        set: function(obj, prop) {
            throw("Can't set properties on fp");
        },
        has: function(obj, prop) {
            // Can't actually check for an individual fp param (getParameter with failoints doesn't
            // work that way), so just update them all.
            obj._refresh();
            return (prop in obj);
        },
        // Doesn't work (eg. `for (i in fp) print(i)`), but don't really care why.
        ownKeys: function(obj) {
            obj._refresh();
            return obj._list;
        },
    } );
};


if (typeof(db) !== "undefined") {
    fp = FPS.getFPS();
}

