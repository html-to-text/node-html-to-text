var expect = require('chai').expect;
var htmlToText = require('..');
var path = require('path');
var fs = require('fs');


describe('html-to-text', function() {
  describe('.fromString()', function() {
    describe('wordwrap option', function() {

      var longStr;

      beforeEach(function() {
        longStr = '111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888 999999999';
      });

      it('should wordwrap at 80 characters by default', function() {
        expect(htmlToText.fromString(longStr)).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777 888888888\n999999999');
      });

      it('should wordwrap at given amount of characters when give a number', function() {

        expect(htmlToText.fromString(longStr, { wordwrap: 20 })).to.equal('111111111 222222222\n333333333 444444444\n555555555 666666666\n777777777 888888888\n999999999');

        expect(htmlToText.fromString(longStr, { wordwrap: 50 })).to.equal('111111111 222222222 333333333 444444444 555555555\n666666666 777777777 888888888 999999999');

        expect(htmlToText.fromString(longStr, { wordwrap: 70 })).to.equal('111111111 222222222 333333333 444444444 555555555 666666666 777777777\n888888888 999999999');
      });

      it('should not wordwrap when given null', function() {
        expect(htmlToText.fromString(longStr, { wordwrap: null })).to.equal(longStr);
      });

      it('should not wordwrap when given false', function() {
        expect(htmlToText.fromString(longStr, { wordwrap: false })).to.equal(longStr);
      });
    });
    describe('preserveNewlines option', function() {

      var newlineStr;

      beforeEach(function() {
        newlineStr = '<p\n>One\nTwo\nThree</p>';
      });

      it('should not preserve newlines by default', function() {
        expect(htmlToText.fromString(newlineStr)).to.not.contain('\n');
      });

      it('should preserve newlines when provided with a truthy value', function() {
        expect(htmlToText.fromString(newlineStr, { preserveNewlines: true })).to.contain('\n');
      });

      it('should not preserve newlines in the tags themselves', function() {
        var output_text = htmlToText.fromString(newlineStr, { preserveNewlines: true });
        expect(output_text.slice(0,1)).to.equal("O");
      });
    });
  });

  describe('.fromFile()', function() {
    it('should convert file at given path', function(done) {

      var htmlFile = path.join(__dirname, 'test.html'),
        txtFile = path.join(__dirname, 'test.txt');

      var expectedTxt = fs.readFileSync(txtFile, 'utf8');
      htmlToText.fromFile(htmlFile, { tables: ['#invoice', '.address'] }, function(err, text) {
        expect(err).to.be.null();
        expect(text).to.equal(expectedTxt);
        done()
      });
    });
  });

  describe('li', function () {
    it('doesnt wrap li if wordwrap isnt', function () {
      var html = 'Good morning Jacob, \
        <p>Lorem ipsum dolor sit amet</p> \
        <p><strong>Lorem ipsum dolor sit amet.</strong></p> \
        <ul> \
          <li>run in the park <span style="color:#888888;">(in progress)</span></li> \
        </ul> \
      ';
      var resultExpected = 'Good morning Jacob,Lorem ipsum dolor sit amet\n\nLorem ipsum dolor sit amet.\n\n * run in the park (in progress)';
      var result = htmlToText.fromString(html, { wordwrap: false });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('tables', function () {
    it('does not process tables with uppercase tags / does not process tables with center tag', function () {
      var html = 'Good morning Jacob, \
        <TABLE> \
        <CENTER> \
        <TBODY> \
        <TR> \
        <TD>Lorem ipsum dolor sit amet.</TD> \
        </TR> \
        </CENTER> \
        </TBODY> \
        </TABLE> \
      ';
      var resultExpected = 'Good morning Jacob,Lorem ipsum dolor sit amet.';
      var result = htmlToText.fromString(html, { tables: true });
      expect(result).to.equal(resultExpected);
    });
  });

  describe('entities', function () {
    it('does not insert null bytes', function () {
      var html = '<a href="some-url?a=b&amp;b=c">Testing &amp; Done</a>'

      var result = htmlToText.fromString(html)
      expect(result).to.equal('Testing & Done [some-url?a=b&b=c]')
    })
  })

});
