var rework = require('rework');
var path = require('path');
var through = require('through2');
var validator = require('validator');
var extend = require('extend');

var isAbsolute = function(url) {
    return path.resolve(url) === path.normalize(url);
};

var isWindows = function() {
    return process.platform === 'win32';
};

var rebaseUrls = function(css, options) {
    return rework(css)
        .use(rework.url(function(url){

            // only rewrite relative paths
            if (!isAbsolute(url) && !validator.isURL(url)) {
                url = path.join(options.cwd, url);
                url = path.relative(options.root, url);
                url = path.join(options.prepend, url);
                if (isWindows()) {
                    url = url.replace(/\\/g, '/');
                }
            }

            return url;
        }))
        .toString();
};

module.exports = function(options) {
    options = extend({
        root: '.',
        prepend: ''
    }, options);

    return through.obj(function(file, enc, callback) {
        var css = rebaseUrls(file.contents.toString(), {
            cwd: path.dirname(file.path),
            root: path.join(file.cwd, options.root),
            prepend: options.prepend
        });

        file.contents = new Buffer(css);

        this.push(file);
        callback();
    });
};
