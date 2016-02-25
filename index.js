var path = require('path');
var express = require('express');
var bodyParser = require('body-parser');
var config = require('config');
var API = require('./api');

var server = express();
var host = config.server.host;
var port = config.server.port;
var api = new API(config.api.key, config.api.secret);

server.use(express.static(path.join(__dirname, 'public')));
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));

// Creates a callback function with a closure
function createCB(res) {
  return function (e, data) {
    if (e) {
      res.status(500).send('Error occurred: API call.');
    } else {
      res.json(data);
    }
  };
}

server.get('/trending', function (req, res) {
  api.request('/v2/discover/trending/momentum', req.query, null, createCB(res));
});

server.get('/popular', function (req, res) {
  api.request('/v2/discover/trending/top', req.query, null, createCB(res));
});

server.get('/similar/:embedCode', function (req, res) {
  api.request('/v2/discover/similar/assets/' + req.params.embedCode, req.query, null, createCB(res));
});

server.get('/recent', function (req, res) {
  var query = req.query;
  query.orderby = 'created_at DESCENDING';
  api.request('/v2/assets', req.query, null, createCB(res));
});

server.get('/promoted', function (req, res) {
  var discoveryProfile = 'b2b8a66ef9cb40948aea3e9f7cbc1c38';
  var pos = parseInt(req.query.pos);
  var params = { countries: 'all', time: 'now', 'window': 'month', discovery_profile_id: discoveryProfile , limit: req.query.limit || 10 };
  api.request('/v2/discover/trending/top', params, null, createCB(res));
});

server.post('/feedback/:event', function (req, res) {
  api.request('/v2/discover/feedback/' + req.params.event, req.query, req.body, createCB(res));
});

server.listen(port, function () {
  console.log('The server is running at http://' + host + ':' + port);
});
