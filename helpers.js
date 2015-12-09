var fs = require('fs');
var handlebars = require('handlebars');
var Prism = require('prismjs');

require('prismjs/components/prism-javascript');
require('prismjs/components/prism-php');
require('prismjs/components/prism-handlebars');

var helpers = {
    code: function (cx, options) {
        return new handlebars.SafeString('<pre><code class="language-' + options.hash.type + '">' + Prism.highlight(helpers.remove_last_cr(cx), Prism.languages[options.hash.type], options.hash.type) + '</code></pre>');
    },
    isStringThenOutput: function (cx, options) {
        if (typeof cx !== 'string') {
            return;
        }
        if (options.hash.tag) {
            return new handlebars.SafeString('<' + options.hash.tag + '>' + cx + '</' + options.hash.tag + '>');
        }
        return cx;
    },
    addOne: function (I) {
        return I + 1;
    },
    collect: function (cx, key, options) {
        if (typeof cx != 'object') {
            return;
        }
        return Object.keys(cx).reduce(function (O, K, I) {
            var V = cx[K];
            if (V && V[key]) {
                if (!options.hash.ignore || options.hash.ignore[I] === undefined) {
                    O.push(V[key]);
                }
            }
            return O;
        }, []);
    },
    join: function (cx, sep) {
        return (cx && cx.join) ? new handlebars.SafeString(cx.join(sep)) : '';
    },
    book_writer: function (data, options) {
        data.forEach(function (D, I) {
            if (I > 0) {
                D.page_prev = data[I - 1];
            }
            if (data[I + 1] !== undefined) {
                D.page_next = data[I + 1];
            }
            fs.writeFileSync(data.configs.out_dir + D.pagename + '.html', options.fn(D));
        });
    },
    section_builder: function (cx, options) {
        if (typeof cx !== 'object') {
            return cx ? '<p>' + cx + '</p>' : '';
        }
        var sections = Object.keys(cx).reduce(function (ret, S) {
            var data = handlebars.createFrame(options.data);
            data.section = S;
            data.sectionNumber = (ret.length + 1) + '. ';
            var R = options.fn(cx, {data: data});
            if (R != '') {
                ret.push(R);
            }
            return ret;
        }.bind(this), []);
        if (options.hash.column) {
            return '<div class="row">' + sections.map(function (S) {
                return '<div class="col-md-' + ((sections.length > 2) ? '4' : '6') + '">' + S + '</div>';
            }).join('') + '</div>';
        }
        return sections.join('');
    },
    main_section: function (options) {
        switch (options.data.section) {
        case 'page_prev':
        case 'page_next':
        case 'title':
        case 'description':
        case 'pagename':
            return '';
        default:
            return options.fn(this);
        }
    },
    code_type: function (options) {
        if (this.file) {
            switch (this.file.match(/\.(.+)$/)[1]) {
            default:
                return 'js';
            }
        }
        if (options.data.section) {
            switch (options.data.section) {
            case 'template':
            case 'handlebars.js':
            case 'mustache':
                return 'handlebars';
            case 'nodejs':
            case 'JavaScript':
                return 'js';
            case 'php':
            case 'lightncandy':
                return 'php';
            default:
                return 'js';
            }
        }
    },
    remove_last_cr: function (txt) {
        return (txt && txt.replace) ? txt.replace(/\n+$/, '') : '';
    }
};

module.exports = helpers;
