#Preen [![Analytics](https://ga-beacon.appspot.com/UA-40041520-3/Preen/readme)](https://github.com/igrigorik/ga-beacon)

>A Node.js module to preen unwanted files and folders from packages installed via Bower.

Bower is great but some times it gives you more than you need. These days many packages define paths that are not required in production via the `bower.json` files `ignore` property but even then you may still get more than you need. Preens role is to remove any of those unwanted files/paths.

##A Basic Example
My projects `bower.json` file has jquery as a dependency.
```javascript
{
  "name": "myProject",
  "dependencies": {
    "jquery": "~2.0.3"
  }
}
```
which gives the following folder after running `bower install`  
![](https://raw.github.com/BradDenver/Preen/master/screenshots/basic.png)  
but all I really need for this project is the 4 javascript files.
So I update my `bower.json` with a preen property as follows
```javascript
{
  "name": "myProject",
  "dependencies": {
    "jquery": "~2.0.3"
  },
  "preen": {
    "jquery": [
      "**.js"
    ]
  }
}
```
and then run `preen` to end up with  
![](https://raw.github.com/BradDenver/Preen/master/screenshots/basic2.png)

###Updated Example
The previous example will not work for newer versions of jquery such as 2.1.1 due to its updated folder structure
![](https://raw.github.com/BradDenver/Preen/master/screenshots/example2_before.png)
A more suitable `bower.json` would look like
```javascript
{
  "name": "myProject",
  "dependencies": {
    "jquery": "~2.1.1"
  },
  "preen": {
    "jquery": [
      "dist/**.js"
    ]
  }
}
```
resulting in
![](https://raw.github.com/BradDenver/Preen/master/screenshots/example2_after.png)

##Configuration
As shown above configuration is done via the preen property of your `bower.json` file.
The preen data object expects properties for each bower installed package that is to be preened in the format
```javascript
"<package>": ["<patern 1>", "<patern 2>", ...]
```

See [Minimatch](https://github.com/isaacs/minimatch) for an explanation of Minimatch patterns.

Any packages not listed will not be preened.

##Options
when running via the command line you can add a preview flag to see a list of all paths and if they will be deleted or kept
`preen --preview`  
![](https://raw.github.com/BradDenver/Preen/master/screenshots/preview.png)  
you can then run `preen` if you are happy to go ahead  
![](https://raw.github.com/BradDenver/Preen/master/screenshots/preview2.png)

A verbose flag is also avaible to show the same level of detail as the actual preen is run
`preen --verbose`

##Grunt Task
while preen can be run via the command line it is well suited to running as a [grunt task](https://github.com/braddenver/grunt-preen)
[![NPM](https://nodei.co/npm/grunt-preen.png?downloads=true&stars=true)](https://github.com/braddenver/grunt-preen)

##Dependencies
thanks to the following modules that make this one possible
* async
* bower
* fs.extra
* readdirp
* minimatch
* optimist
* winston

##Credits
thanks to [@ratbeard](https://github.com/ratbeard) for his contributions

## Release History
* Aug 9, 2013 v1.0.0
  preen and grunt-preen are ready to roll
* Jun 20, 2014 v1.1.0
  * new --verbose flag
  * improved logging using winston
  * updated examples
