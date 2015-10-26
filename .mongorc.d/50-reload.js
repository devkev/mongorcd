
// Shortcut to reload your ~/.mongorc.js (including ~/.mongorc.d/*.js).
//
// Usage:
//   > reload()
//   > reload
//
// Note: does not unload everything first.  If you've removed something (rather
// than changing/adding something), you'll need to manually delete it from the
// interpreter, or just reload the shell.


reload = function () {
	return load(_mongorcjs);
}

shellHelper.reload = function () {
	return reload();
};

// Uncomment this to be able to reload just by typing "r<Enter>"
//shellHelper.r = shellHelper.reload;

