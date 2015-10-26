
// Saves the result of the expression on the rest of the line in a variable called `_`.
// Effectively a shortcut for adding ```var foo = ``` to the start of the line.
//
// Usage:
//   > _ db.foo.find()
//   > _.<tab>
//   > _.count()
//
// Note: if the line contains a " character, then the shell won't run this code.
// Use ' to delimit your strings instead.
// https://github.com/mongodb/mongo/blob/52294f76710c4c891aebfe594f4ec8029b8c4e8c/src/mongo/shell/dbshell.cpp#L856

shellHelper._ = function (cmd) {
	//printjson(cmd);
	if (cmd == "") {
		// Original.  Doesn't work with cursors.
		//printjson(_);

		// Homebrew printing.  Works with cursors.
		//if (typeof(_) == "object" && "shellPrint" in _ && typeof(_.shellPrint) == "function") {
		//	_.shellPrint();
		//} else {
		//	printjson(_);
		//}

		// Realised that this homebrew stuff is already implemented, so use it.
		// However, shellPrint() sets "it", and will call GLE if db exists, which is maybe not great.
		//shellPrint(_);

		// So use shellPrintHelper instead, which is like an extended version of the homebrew stuff above.
		// Handles other things properly, like __magicNoPrint and functions.
		// This can also try to run GLE, but only if we pass it "undefined".
		shellPrintHelper(_);
	} else {
		_ = eval(cmd);
	}
};

