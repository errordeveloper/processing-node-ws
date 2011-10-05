var sys = require('sys'),
    ass = require('assert'),
    fs = require('fs');

var config_file = process.argv[2];

var config_data = JSON.parse(fs.readFileSync(config_file));

sys.puts('new ='+sys.inspect(config_data));


// This is the object prototype:
var default_obj = {
  libraries: [1,2,3],
  head: "<html><head></head>",
  body: "<body>",
  tail: "</body></html>"
}; // TODO: make it enumerable!

var _obj_ = {};

function checkEntryType(_new_, _def_, _log_, _set_) {
  //console.log(sys.inspect(arguments));
  if(_def_.constructor === _new_.constructor) {
    console.log(_log_+' is OK.');
    _set_(_new_);
  } else {
    // Should I call name.toLowerCase() ?
    console.log(_log_+' is wrong type!'
       +'\nShould had been '+_def_.constructor.name
       +' but I found '+_new_.constructor.name+'!');
    _set_(_def_);
  }
}

function parseConfig(_new_, _def_) {

  var list = [ 'head', 'libraries', 'body', 'tail' ];

  list.forEach(function(e) {
    checkEntryType(_new_[e], _def_[e], 'Checking entry \"'+e+'\"',
      function(_set_){ _obj_[e] = _set_; });
  });
}

parseConfig(config_data, default_obj);
sys.puts('use ='+sys.inspect(_obj_));

if ( 'test' in config_data ) {
  console.log("If it was a book, I'd call it \"OMG, Test Failed!\"");
}
