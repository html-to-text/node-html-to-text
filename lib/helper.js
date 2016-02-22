var _ = require('underscore');
var _s = require('underscore.string');

exports.wordwrap = function wordwrap(text, max, preserveNewlines) {
    // Preserve leading space
    var result = _s.startsWith(text, ' ') ? ' ' : '';
    var length = result.length;
    var buffer = [];
    // Decide to perverse new lines or not.
    var words = preserveNewlines
        ? text.replace(/\n/g, '\n ').split(/\ +/)
        : _s.words(text);

    _.each(words, function(word) {
        if ((max || max === 0) && length + word.length > max) {
            // Concat buffer and add it to the result
            result += buffer.join(' ') + '\n';
            // Reset buffer and length
            buffer.length = length = 0;
        }
        buffer.push(word);
        // Add word length + one whitespace
        length += word.length + 1;
    });
    // Add the rest tot the result.
    result += buffer.join(' ');
    return _s.rstrip(result);
};

exports.arrayZip = function arrayZip(array) {
    return _.zip.apply(_, array);
};
