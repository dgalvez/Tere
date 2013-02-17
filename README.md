[Tere] - Simple Javascript Test Driven Development ( with QUnit )
=================================================================

If you already have a QUnit test page ready,
you can use Tere to see the test results in all the browsers
you attach to it by simply opening the "Running on" url.

Features
--------------------------------------

- Attach any browser by opening the "Running on" url.
- Watch folder to rerun tests. ( Folder path and file name RegExp )
- Reload all browsers attached to the url of one of them.

Install
--------------------------------------

```bash
npm install -g tere
```

Basic Usage
--------------------------------------

```bash
tere -u http://localhost/myQUnitTestPath
```

The next 3 lines will appear in your terminal:

```bash
Running on: http://localhost:8001/myQUnitTestPath
Watching files in /CurrentFolderPath
Matching this RegExp /.*\.js$/i
```

Now you can open the "Running on" url in several browsers and see the test results in the terminal.

Full Usage
--------------------------------------

tere -u [ url ] -d [ path to folder ] -f [ RegExp ]

where

-u : Your QUnit test page url
-d : Path to the folder you want to watch
-f : RegExp to filter files to you want to watch
