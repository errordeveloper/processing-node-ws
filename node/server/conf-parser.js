var sys = require('sys'),
    fs = require('fs');

/* See conf-parser-test.js for usage */
exports.input = function (config_file) {
  // var config_file = process.argv[2];
  var config_data = JSON.parse(fs.readFileSync(config_file));
  console.log('=> config_data:\n'+sys.inspect(config_data));
  return config_data;
}

/*
// This is the object prototype:
var sketch_skel = {
  libraries: [1,2,3],
  head: "<html><head></head>",
  body: "<body>",
  tail: "</body></html>",
  func: function() { do_something(); }
};
*/

// var sketch_skel = {};

// var sketch_conf = {};

// I cannot see anyway that this could fail -
// it will just use all defaults if anything!
// Hence there is no error callback.
exports.check = function (conf, skel, log, use) {
  if(conf) { // if(typeof(conf) === typeof(skel)
    if (conf.constructor === skel.constructor) {
      console.log(log + ' is OK.');
      use(conf);
    } else {
      console.error(log + ' is wrong type!\n\t'
         +' I expected '
         + skel.constructor.name + ','
         +' but encoutered '
         + conf.constructor.name + '!\n\t'
         +' Applying default setting.');
      use(skel);
    }
  } else {
    console.log(log + ' is undefined!\n\t'
       +' Applying default setting.');
    use(skel);
  }
}

exports.parse = function (conf, skel, call) {

  var sketch_conf = {};

  console.log('=> sketch_conf:\n'+sys.inspect(conf));
  console.log('=> sketch_skel:\n'+sys.inspect(skel));
  for(e in skel) {
    //console.log('skel['+e+'] = ' + skel[e] + ' (' +typeof(skel[e])+')');
    //console.log('data['+e+'] = ' + data[e] + ' (' +typeof(data[e])+')');
    this.check(conf[e], skel[e], 'Checking field ['+e+']',
       function(use){ sketch_conf[e] = use; });
  }

  call(sketch_conf);
}

exports.usual = function (config_file,
                          sketch_skel) {
  var ret = {};
  this.parse(
      this.input(config_file),
      sketch_skel,
      function(x) {
        ret = x;
      });
  return ret;
}

exports.async = function (config_file,
                          sketch_skel,
                          callback_me) {

  that = this;

  fs.readFile(config_file, function(fs_err, fs_out) {
    if (fs_err) throw fs_err;
    that.parse(JSON.parse(fs_out), sketch_skel, callback_me);
  });
}

// parse(config_data, sketch_skel);

/*
if (! 'test' in config_data ) {
  console.log("If it was a book, I'd call it \"OMG, Test Failed!\"");
}
*/
