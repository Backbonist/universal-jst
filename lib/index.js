var fs    = require('fs')
  , handlebars = require('handlebars')
  , api   = {};

api.handleError = function( err ){
  console.log(err);
};

api.process = function process( data, output_dir, callback ){
  var nm = output_dir +'/templates.js';

  fs.writeFile( nm, data.join('\n\n'), 'utf8', function( err ){
    if( err ) api.handleError( err );
    console.log(nm +' written.');
    if( typeof callback == "function" ) callback();
  });
};

api.build = function build( target_dir, callback ){
  var templates = fs.readdirSync(target_dir)
    , len = templates.length
    , output = []
    , readFiles
    , subTemplate;

  // Reads a file and appends it's template function to @output
  build.readFile = function( index ){
    var tmpl = templates[ index ]
      , nm = tmpl.split('.')[0]
      , path = target_dir +'/'+ tmpl;

    if( /\.jst/.test(tmpl) === false ) return;

    fs.readFile( path, 'utf8', function( err, file_contents ){
      if( err ) return api.handleError();
      var subs = build.subTemplate( file_contents );

      if( subs ){
        build.subTemplateString( nm, subs, index, file_contents );
      } else {
        output[index] = build.templateString( nm, file_contents );
      }

      if( index === 0 && typeof callback == "function" ){
        return callback.call( api, output );
      }
      return;
    });
  };

  // Returns a string of js with the compiled template
  build.templateString = function( nm, file_contents ){
    var func, compiled_hbs;

    try {
      // delete any cached versions of the template
      console.log( 'Building '+ nm );

      compiled_hbs = handlebars.precompile( file_contents );

      func = nm.slice(0,1) == '_' ?
        [
          '(function() {',
          'Handlebars.registerPartial("'+ nm +'", Handlebars.template('+ compiled_hbs +'));',
          '}).call(this);'
        ] :
        [ '(function(){',
            'this.JST || (this.JST = {});',
            'this.JST["'+ nm +'"] = function(context) { return HandlebarsTemplates["'+ nm +'"](context); };',
            'this.HandlebarsTemplates || (this.HandlebarsTemplates = {});',
            'this.HandlebarsTemplates["'+ nm +'"] = Handlebars.template('+ compiled_hbs +');',
          '}).call(this);' ];

    } catch( e ){
      console.log( 'Error processing'+ nm, e);
      return false;
    }

    return func.join('');
  };

  // Parses a raw template file and extracts subtemplates
  build.subTemplate = function( file_contents ){
    var find_subs = /\/\*\s?(\w+)\s?\*\//
      , subs = file_contents.trim().split( find_subs );

    return subs.length > 1 && subs.length % 2 ? subs : false;
  };

  // Builds multi part template string from subtemplates
  build.subTemplateString = function( nm, subs, index, file_contents ){
    output[index] = "";

    var i = 0
      , l = subs.length
      , name;

    for(; i < l; i += 2){
      name = subs[ i - 1 ] != null ? nm +'_'+ subs[ i - 1] : nm;
      output[index] += build.templateString( name, subs[ i ] );
    }
    return;
  };

  // Process each file in the target_directory
  while(len--){
    build.readFile(len);
  }
};

module.exports = api;