var _ = require('underscore');
var _s = require('underscore.string');

exports.wordwrap = function wordwrap(text, options) {
    var max = options.wordwrap;
    var preserveNewlines = options.preserveNewlines;
    var length = options.lineCharCount;

    // Preserve leading space
    var result = _s.startsWith(text, ' ') ? ' ' : '';
    length += result.length;
    var buffer = [];
    // Split the text into words, decide to preserve new lines or not.
    var words = preserveNewlines
        ? text.replace(/\n/g, '\n ').split(/\ +/)
        : _s.words(text);

    // Determine where to end line word by word.
    _.each(words, function(word) {
        if ((word.indexOf('\n') === -1) &&
            (max || max === 0) &&
            ((length + word.length > max) || (length + word.indexOf('\n') > max)))
        {
            // Concat buffer and add it to the result
            result += buffer.join(' ') + '\n';
            // Reset buffer and length
            buffer.length = length = 0;
        }

        buffer.push(word);

        // If the word contains a newline then restart the count and add the buffer to the result
        if (word.indexOf('\n') != -1) {
            result += buffer.join(' ');

            // Reset the buffer, let the length include any characters after the last newline
            buffer.length = 0;
            length = word.length - (word.lastIndexOf('\n') + 1);
            // If there are characters after the newline, add a space and increase the length by 1
            if (length) {
                result += ' ';
                length++;
            }
        } else {
            // Add word length + one whitespace
            length += word.length + 1;
        }
    });
    // Add the rest to the result.
    result += buffer.join(' ');
    return _s.rstrip(result);
};

exports.arrayZip = function arrayZip(array) {
    return _.zip.apply(_, array);
};

exports.splitCssSearchTag = function splitCssSearchTag(tagString) {
    function getParams(re, string) {
        var captures = [], found;
        while (found = re.exec(string)) {
            captures.push(found[1]);
        }
        return captures;
    }

    var splitTag = {};
    var elementRe = /(^\w*)/g;
    splitTag.element = elementRe.exec(tagString)[1];
    splitTag.classes = getParams( /\.([\d\w-]*)/g, tagString);
    splitTag.ids = getParams( /#([\d\w-]*)/g, tagString);

    return splitTag;
};
