var jst = require('../index.js'),
  fs = require('fs'),
  handlebars = require('handlebars'),
  Path = require('path'),
  helpers = {};

// Returns a string of js with the compiled template
module.exports = function( options, nm, file_contents ){
  var output, compiled_hbs;

  // `options.helpers` directory containing helper files.
  // See `example/handlebars/helpers`
  if(options.helpers && !Object.keys(helpers).length){
    var files = fs.readdirSync(options.helpers)
    files.forEach(function(file){
      if(!/\.js$/.test(file)) return;
      file = file.replace(/\.js$/, '');
      if( options.verbose ) { console.log('Register helper ' + file); }
      var helper = helpers[file] = require(Path.resolve(Path.join(options.helpers, file)) );

      handlebars.registerHelper(file, helper);
    });
  }


  try {
    // delete any cached versions of the template
    compiled_hbs = handlebars.precompile( file_contents );

    output = [
      options.namespace + '["'+ nm +'"] = Handlebars.template('+ compiled_hbs +');\n',
      'Handlebars.partials["'+ nm.replace(/\//g, '.') +'"] = ' + options.namespace + '["'+ nm +'"]'
    ];

  } catch( e ){
    console.error( 'Error processing'+ nm, e);
    return '/* Unable to compile ' + nm + ' */\n';
  }

  return output.join('');
};
