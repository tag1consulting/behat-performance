var page = require('webpage').create(),
    fs = require('fs'),
    system = require('system');
    

if (system.args.length === 1) {
    console.log('Usage: netsniff.coffee <some URL>');
    phantom.exit(1);
}
else {
  page.address = system.args[1];
  page.resources = [];

  page.onInitialized = function() {
    page.resources = [];
  }
  page.onLoadStarted = function () {
    page.startTime = new Date();
  };
  page.onResourceRequested = function (req) {
    page.resources[req.id] = {
      request: req,
      startReply: null,
      endReply: null
    };
  };

  page.onResourceReceived = function (res) {
    if (res.stage === 'start') {
      page.resources[res.id].startReply = res;
    }
    if (res.stage === 'end') {
      page.resources[res.id].endReply = res;
    }
  };

  console.log('Loading ' + page.address);

  page.open(page.address, function(status) {
    var har;
    if (status === 'success') {
      page.endTime = new Date();
      page.title = page.evaluate(function() {
        return document.title;
      });
      var url = page.evaluate(function() {
        return document.URL;
      });
      har = createHAR(url, page.title, page.startTime, page.resources);
      var filename = page.evaluate(function() {
        return document.URL + '-' + Math.random().toString(36).substring(7);;
      });
      // @todo: better, properly unique filenames.
      // Alternatively we could have a web API which accepts a POST
      // request and write the HAR directly to that from here instead
      // of to files.
      filename = filename.replace('http://', '');
      filename = filename.replace(/\//g, '_');
      filename = filename.replace(/:/g, '_');

      id = fs.read('/tmp/performance_test_id');


      filename = '/tmp/performance_test_data/' + id + '/har/' + filename + '.json';

      var f = fs.open(filename, "w");
      f.writeLine(JSON.stringify(har, undefined, 4));
      f.close();

      fs.write('/tmp/filenames.txt', filename, "a");

      console.log('Page title is ' + page.title);
    }
    else {
      console.log('FAIL to load the address');
    }
  });
}


if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function () {
        function pad(n) { return n < 10 ? '0' + n : n; }
        function ms(n) { return n < 10 ? '00'+ n : n < 100 ? '0' + n : n }
        return this.getFullYear() + '-' +
            pad(this.getMonth() + 1) + '-' +
            pad(this.getDate()) + 'T' +
            pad(this.getHours()) + ':' +
            pad(this.getMinutes()) + ':' +
            pad(this.getSeconds()) + '.' +
            ms(this.getMilliseconds()) + 'Z';
    }
}

function createHAR(address, title, startTime, resources)
{
    var entries = [];

    resources.forEach(function (resource) {
        var request = resource.request,
            startReply = resource.startReply,
            endReply = resource.endReply;

        if (!request || !startReply || !endReply) {
            return;
        }

        entries.push({
            startedDateTime: request.time.toISOString(),
            time: endReply.time - request.time,
            request: {
                method: request.method,
                url: request.url,
                httpVersion: "HTTP/1.1",
                cookies: [],
                headers: request.headers,
                queryString: [],
                headersSize: -1,
                bodySize: -1
            },
            response: {
                status: endReply.status,
                statusText: endReply.statusText,
                httpVersion: "HTTP/1.1",
                cookies: [],
                headers: endReply.headers,
                redirectURL: "",
                headersSize: -1,
                bodySize: startReply.bodySize,
                content: {
                    size: startReply.bodySize,
                    mimeType: endReply.contentType
                }
            },
            cache: {},
            timings: {
                blocked: 0,
                dns: -1,
                connect: -1,
                send: 0,
                wait: startReply.time - request.time,
                receive: endReply.time - startReply.time,
                ssl: -1
            },
            pageref: address
        });
    });

    return {
        log: {
            version: '1.2',
            creator: {
                name: "PhantomJS",
                version: phantom.version.major + '.' + phantom.version.minor +
                    '.' + phantom.version.patch
            },
            pages: [{
                title: title,
                startedDateTime: startTime.toISOString(),
                id: address,
                pageTimings: {
                    onLoad: page.endTime - page.startTime
                }
            }],
            entries: entries
        }
    };
}

