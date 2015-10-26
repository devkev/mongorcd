mongorcd
========

**Automatically load multiple mongo shell startup scripts from the `~/.mongorc.d` directory.**

The `mongo` shell will automatically load the `.mongorc.js` file from the user's home directory (if it exists, and unless `--norc` is specified).  This is very handy for defining various shortcuts, helper functions, and so on; however, managing content in a single file quickly becomes a pain.  The traditional approach to solving this problem is to have a similarly-named "`.d`" directory which contains multiple files, each of which is processed in turn.  For example, `/etc/sudoers.d/*` are processed after `/etc/sudoers`.  This allows cleaner management of disparate content by users (since the content is in separate files).

This `.mongorc.js` script will mimic this behaviour by loading each of the `*.js` files inside the `.mongorc.d` direcotyr in the user's home directory (if such a directory exists).  The files are loaded in lexicographical order, which means that leading numbers can be used to ensure that the files are loaded in the desired order.

There are also a collection of various example files that can be placed in the `.mongorc.d` directory.  Refer to the comments at the start of each file for a description of the functionality provided, and how to use it.


Installation
------------

1. Create a `.mongorc.d` directory in your home directory:

    ```
    mkdir ~/.mongorc.d
    ```

2. If you have an existing `.mongorc.js` file, move it inside `.mongorc.d`:

    ```
    mv ~/.mongorc.js ~/.mongorc.d/00-previous-mongorc.js
    ```

    If you feel like it, you can break this file out into multiple files.

3. Copy (or symlink) this `.mongorc.js` into your home directory:

    ```
    cp -i .mongorc.js ~
    ```

4. Copy (or symlink) any desired scripts from the `.mongorc.d` directory into your own directory:

    ```
    cp -i .mongorc.d/* ~/.mongorc.d
    ```

Enjoy!
