var async = require('async');
var bower = require('bower');
var fs = require('fs.extra');
var readdirp = require('readdirp');
var minimatch = require('minimatch');
var winston = require('winston');

var logger = new winston.Logger({
  transports: [
    new (winston.transports.Console)({
      colorize: true
    })
  ]
});
logger.cli();

var bowerJSON;
var preview = false; // an optional argument to show would happen when preen is run
var verbose = false; // an optional argument to show details of the files/folders preened
var directory; // an optional argument to set a custom root directory (for processing after copying bower files)

function preen(options, callback) {
  
  preview = options.preview;
  verbose = options.verbose;
  directory = options.directory;

  if(preview || verbose){
    logger.transports.console.level = 'verbose';
  }

  try {
    bowerJSON = require(process.cwd()+'/'+bower.config.json);
  }
  catch(err) {
    logger.error('Error trying to read '+bower.config.json, err);
    return;
  }

  async.each(Object.keys(bowerJSON.preen), preenPackage, callback);
}


//module.exports = preen;
exports.preen = preen;


var preenPackage = function(name, callback) {

  logger.info(preview ? 'Previewing Preen of: '+name : 'Preening: '+name);

  var root = getRootDirectory()+'/'+name+'/';
  var filters = bowerJSON.preen[name];

  if(!filters.length){
    logger.warn('no filters found for '+name);
    return;
  }

  readdirp({ root: root, fileFilter: pathFilter(filters) },
    function (err, res) {

      if(!res) {
        callback(err);
        return;
      }

      // loop thru all matched files creating a filter for each file
      // and each of its parent directories

      var keepFilters = [];
      var i, length,
          dirsToDelete = []
          filesToDelete = [];
      for (i = 0, length = res.files.length; i < length; i += 1) {
        //logger.debug(res.files[i].parentDir, res.files[i].path);

        keepFilters = uniqueAdd(res.files[i].path, keepFilters);

        var pDirs = res.files[i].parentDir.split(/[\/\\]/g);
        var pDir = '';
        var j, lengthJ;
        for (j = 0, lengthJ = pDirs.length; j < lengthJ; j += 1) {
          pDir = pDirs.slice(0, j+1).join('/');
          keepFilters = uniqueAdd(pDir, keepFilters);
        }
      }
      //logger.debug(keepFilters);

      // now loop thru all files and directories deleting any that dont match the filters
      readdirp({ root: root},
        function (err, res) {
          // loop thru directories first
          var i, length;
          for (i = 0, length = res.directories.length; i < length; i += 1) {
            //logger.debug(res.directories[i].path);
            if(matchSomeFilter(res.directories[i].path, keepFilters)){
              logger.verbose('keep dir ' + res.directories[i].path);
            } else {
              logger.verbose('delete dir ' + res.directories[i].path);
              dirsToDelete.push(root+res.directories[i].path);
            }
          }
          // and then files
          for (i = 0, length = res.files.length; i < length; i += 1) {
            //logger.debug(res.directories[i].path);
            if(matchSomeFilter(res.files[i].path, keepFilters)){
              logger.verbose('keep file ' + res.files[i].path);
            } else {
              logger.verbose('delete file ' + res.files[i].path);
              filesToDelete.push(root+res.files[i].path);
            }
          }

          async.parallel([
            function(cb) { async.map(dirsToDelete, removeDir, cb); },
            function(cb) { async.map(filesToDelete, removeFile, cb); }
          ],
          function(err) {
            logger.verbose('deleted ' + filesToDelete.length + ' files and ' + dirsToDelete.length + ' dirs');
            callback(err);
          });

        });

    });

};

/*function logger(output) {
  if(!preview) return;
  console.log(output);
}*/

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

function removeFile(path, callback) {
  if(preview || !fs.existsSync(path)) {
    callback(null);
    return;
  }
  fs.unlink(path, function (err) {
    if (err) logger.error(err);
    //logger.debug('successfully deleted');
    callback(err);
  });
}

function removeDir(path, callback) {
    logger.verbose('de', path);
  if(preview) {
    callback(null);
    return;
  }
  fs.rmrf(path, function (err) {
    if (err) logger.error(err);
    logger.verbose('de', path, err);
    callback(err);
  });
}

function getRootDirectory() {

  return directory || bower.config.directory
}