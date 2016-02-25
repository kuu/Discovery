var sha256 = require('sha256');
var http = require('http');

function serialize(params, delimiter) {
  return Object.keys(params).sort()
  .map(function(key) {
    return key + '=' + (params[key] !== void 0 ? params[key] : options[key]);
  }).join(delimiter);
}

function createCB(callback) {
  return function (res) {
    var data = '';
    res.setEncoding('utf8');
    res.on('data', function(chunk){
      data += chunk;
    });
    res.on('end', function() {
      //console.log('Response:', data);
      try {
        data = JSON.parse(data);
        callback(null, data);
      } catch (e) {
        callback(null, data);
      }
    });
  };
}

function API(apiKey, secret) {
  this.apiKey = apiKey;
  this.secret = secret;
}

API.prototype.request = function (path, params, body, callback) {
  var method = (body ? 'POST' : 'GET'),
      hashStr, signature, url;

  params.api_key = this.apiKey;
  params.expires = Date.now() + 86400000,

  // Get SHA-256 hash value
  hashStr = sha256(this.secret + method + path + serialize(params, '')),
  signature = new Buffer(hashStr, 'hex').toString('base64');
  // Remove any trailing '=' sign
  signature = signature.replace(/=+$/, '');

  url = [
    'http://api.ooyala.com' + path,
    [
      serialize(params, '&'),
      ['signature', encodeURIComponent(signature)].join('=')
    ].join('&').replace(/^&+/, '')
  ].join('?');

  console.log('API call: [' + method + '] ' + url);

  if (method === 'GET') {
    http.get(url, createCB(callback)).on('error', callback);
  } else {

  var postData = JSON.stringify(body);
  console.log('\t' + postData);

  var options = {
    hostname: 'api.ooyala.com',
    port: 80,
    path: path,
    method: method,
    headers: {
      //'Content-Type': 'application/x-www-form-urlencoded',
      'Content-Type': 'application/json',
      'Content-Length': postData.length
    }
  };

  var req = http.request(options, createCB(callback)).on('error', callback);

  // write data to request body
  req.write(postData);
  req.end();
  }
};

module.exports = API;
