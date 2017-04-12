
Date.prototype.toISOTZString = function (tz) {
	// tz is as per Date.prototype.getTimezoneOffset, ie. minutes from UTC
	if (typeof tz === "undefined") {
		tz = this.getTimezoneOffset();
	}
	var localDate = new Date(this - tz * 60 * 1000);
	var s = localDate.toISOString();
	s = s.substring(0, s.length-1);  // chop the trailing "Z"
	if (tz <= 0) {
		var dir = "+";
		tz *= -1;
	} else {
		var dir = "-";
	}
	var hrs = 0;
	var rem = tz;
	while (rem >= 60) {
		hrs++;
		rem -= 60;
	}
	var mins = rem;
	if (hrs < 10) {
		hrs = "0" + hrs;
	}
	if (mins < 10) {
		mins = "0" + mins;
	}
	return s + dir + hrs + mins;

};

