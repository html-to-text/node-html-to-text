const { exec } = require('child_process');
const fs = require('fs');

const { expect } = require('chai');


const isWin = process.platform === 'win32';

function runWithInputAndExpect (input, args, expectedOutput, done) {
  const command = isWin
    ? 'echo.' + input.replace(/[<>]/g, '^^^$&') + ' | node bin/cli.js ' + args
    : 'echo "' + input.replace(/"/g, '\\"') + '" | node bin/cli.js ' + args;
  exec(command, function callback (error, stdout, stderr) {
    expect(error).to.be.a('null');
    expect(stderr).to.equal('');
    expect(stdout).to.equal(expectedOutput + '\n');
    done(error);
  });
}

describe('cli arguments', function () {

  this.timeout(5000);

  it('should output nothing with empty input', function (done) {
    runWithInputAndExpect('', '', '', done);
  });

  it('should not ignore images by default', function (done) {
    runWithInputAndExpect(
      'Hello <img alt="alt text" src="http://my.img/here.jpg">!',
      '',
      'Hello alt text [http://my.img/here.jpg]!',
      done
    );
  });

  it('should ignore images with --ignore-image=true', function (done) {
    runWithInputAndExpect(
      'Hello <img alt="alt text" src="http://my.img/here.jpg">!',
      '--ignore-image=true',
      'Hello !',
      done
    );
  });

  it('should not ignore href by default', function (done) {
    runWithInputAndExpect(
      '<a href="http://my.link">test</a>',
      '',
      'test [http://my.link]',
      done
    );
  });

  it('should ignore href with --ignore-href=true', function (done) {
    runWithInputAndExpect(
      '<a href="http://my.link">test</a>',
      '--ignore-href=true',
      'test',
      done
    );
  });

  it('should wordwrap at 80 characters by default', function (done) {
    runWithInputAndExpect(
      ' 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789',
      '',
      '123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789\n123456789',
      done
    );
  });

  it('should wordwrap at 40 with --wordwrap=40', function (done) {
    runWithInputAndExpect(
      ' 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789 123456789',
      '--wordwrap=40',
      '123456789 123456789 123456789 123456789\n123456789 123456789 123456789 123456789\n123456789',
      done
    );
  });

  it('should return link with brackets by default', function (done) {
    runWithInputAndExpect(
      '<a href="http://my.link">test</a>',
      '',
      'test [http://my.link]',
      done
    );
  });

  it('should return link without brackets with --noLinkBrackets=true', function (done) {
    runWithInputAndExpect(
      '<a href="http://my.link">test</a>',
      '--noLinkBrackets=true',
      'test http://my.link',
      done
    );
  });

  it('should support --tables definitions with commas', function (done) {
    const expectedTxt = fs.readFileSync('test/test.txt', 'utf8');

    function runWithArgs (args, callback) {
      const command = isWin
        ? 'node bin/cli.js ' + args + ' < test/test.html'
        : 'cat test/test.html | node bin/cli.js ' + args;
      exec(command, callback);
    }

    runWithArgs('--tables=#invoice,.address', function callback (error, stdout, stderr) {
      expect(error).to.be.a('null');
      expect(stderr).to.equal('');
      expect(stdout).to.equal(expectedTxt + '\n');
      done(error);
    });
  });
});
