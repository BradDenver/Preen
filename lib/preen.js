var bower = require('bower');
var fs = require('fs.extra');
var readdirp = require('readdirp');
var minimatch =  require('minimatch');

var bowerJSON;
var preview = false; //an optional argument to show would happen when preen is run

function preen(options) {
	preview = options.preview;

  try {
    bowerJSON = require(process.cwd()+'/'+bower.config.json);
  }
  catch(err) {
    console.log('Did not find '+bower.config.json);
    return;
  }

  Object.keys(bowerJSON.preen).map(preenPackage);
}


//module.exports = preen;
exports.preen = preen;


var preenPackage = function(name) {

  console.log('Preening: '+name);
  var root = bower.config.directory+'/'+name+'/';
  var filters = bowerJSON.preen[name];

  if(!filters.length){
    console.log('no filters found for '+name);
    return;
  }

  readdirp({ root: root, fileFilter: pathFilter(filters) },
    function (err, res) {

    	if(!res) return;

      // loop thru all matched files creating a filter for each file
      // and each of its parent directories

      var keepFilters = [];
      var i, length;
      for (i = 0, length = res.files.length; i < length; i += 1) {
        //console.log(res.files[i].parentDir, res.files[i].path);

        keepFilters = uniqueAdd(res.files[i].path, keepFilters);

        var pDirs = res.files[i].parentDir.split('/');
        var pDir = '';
        var j, lengthJ;
        for (j = 0, lengthJ = pDirs.length; j < lengthJ; j += 1) {
          pDir = pDirs.slice(0, j+1).join('/');
          keepFilters = uniqueAdd(pDir, keepFilters);
        }
      }
      //console.log(keepFilters);

      // now loop thru all files and directories deleting any that dont match the filters
      readdirp({ root: root},
        function (err, res) {
          // loop thru directories first
          var i, length;
          for (i = 0, length = res.directories.length; i < length; i += 1) {
            //console.log(res.directories[i].path);
            if(matchSomeFilter(res.directories[i].path, keepFilters)){
              logger('keep dir ' + res.directories[i].path);
            } else {
              logger('delete dir ' + res.directories[i].path);
              removeDir(root+res.directories[i].path);
            }
          }
          // and then files
          for (i = 0, length = res.files.length; i < length; i += 1) {
            //console.log(res.directories[i].path);
            if(matchSomeFilter(res.files[i].path, keepFilters)){
              logger('keep file ' + res.files[i].path);
            } else {
              logger('delete file ' + res.files[i].path);
              removeFile(root+res.files[i].path);
            }
          }
        });

    });

};

function logger(output) {
	if(!preview) return;
	console.log(output);
}

function uniqueAdd(val, arr) {
  if(arr.indexOf(val)===-1){
    arr.push(val);
  }
  return arr;
}

function isFunction (obj) {
  return toString.call(obj) == '[object Function]';
}

function isString (obj) {
  return toString.call(obj) == '[object String]';
}

////////

function pathFilter(filter){


  if (isFunction(filter)) {

    return filter;

  } else if (isString(filter)) {

    return function (entryInfo) {
      return minimatch(entryInfo. path, filter.trim());
    };

  } else if (filter && Array.isArray(filter)) {

    if (filter) filter = filter.map(function (f) {
      return f.trim();
    });

    return allNegated(filter) ?
      // use AND to concat multiple negated filters
      function (entryInfo) {
        return filter.every(function (f) {
          return minimatch(entryInfo.path, f);
        });
      }
      :
      // use OR to concat multiple inclusive filters
      function (entryInfo) {
        return filter.some(function (f) {
          return minimatch(entryInfo.path, f);
        });
      };
  }
}

function isNegated(f) {
  return f.indexOf('!') === 0;
}

function allNegated (filters) {
  var some = filters.some(isNegated);
  if (!some) {
    return false;
  } else {
    if (filters.every(isNegated)) {
      return true;
    } else {
      // if we detect illegal filters, bail out immediately
      throw new Error(
        'Cannot mix negated with non negated glob filters: ' + filters + '\n' +
        'https://github.com/thlorenz/readdirp#filters'
      );
    }
  }
}

function matchSomeFilter(path, filters) {
  return filters.some(function (f) {
    return minimatch(path, f);
  });
}

function removeFile(path) {
  if(preview) return;
  fs.unlink(path, function (err) {
    if (err) console.error(err);
    //console.log('successfully deleted');
  });
}

function removeDir(path) {
  if(preview) return;
  fs.rmrf(path, function (err) {
    if (err) console.error(err);
  });
}