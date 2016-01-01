// SERVER-21861

// Makes < > <= >= work correctly for Timestamp objects

// > Timestamp(1,900) < Timestamp(1,99)
// true
// > Timestamp.prototype.valueOf = function() { return "Timestamp(0x" + this.t.toString(16).pad(8, false, "0") + ", 0x" + this.i.toString(16).pad(8, false, "0") + ")"; }
// function () { return "Timestamp(0x" + this.t.toString(16).pad(8, false, "0") + ", 0x" + this.i.toString(16).pad(8, false, "0") + ")"; }
// > Timestamp(1,900) < Timestamp(1,99)
// false

Timestamp.prototype.valueOf = function() {
	return "Timestamp(0x" + this.t.toString(16).pad(8, false, "0") + ", 0x" + this.i.toString(16).pad(8, false, "0") + ")";
};
