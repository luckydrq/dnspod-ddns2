var https = require('https');
var util = require('util');
var qs = require('querystring');
var Q = require('q');
var common_params = {
  login_email: global.login_email,
  login_password: global.login_password,
  format: 'json'
};
var cfg = {};

/**
 * get domain info by name if provided
 * @param  {String} domain name
 * @return 
 */
exports.getDomain = function(name) {
  return Q
    .fcall(function() {
      var data = qs.stringify(common_params);
      var opts = {
        host: 'dnsapi.cn',
        path: '/Domain.List',
        method: 'POST',
        headers: {
          "Content-Type": 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        }
      };

      var d = Q.defer();

      var result = '';
      var req = https.request(opts, function(res) {
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          result += chunk;
        });
        res.on('end', function() {
          try {
            result = JSON.parse(result);
            if (result.status.code == '1') {
              if (name) {
                d.resolve(result.domains.filter(function(domain) {
                  return domain.name == name
                })[0]);
              } else {
                d.resolve(result.domains[0]);
              }
            } else {
              throw new Error(result.status.message);
            }
          } catch (e) {
            d.reject(e);
          }
        });
      });

      req.write(data + '\n');
      req.end();
      req.on('error', function(err) {
        d.reject(err);
      });

      return d.promise;
    })
    .then(function(domain){
      cfg.domain_id = domain.id;
      return domain;
    })
    .fail(function(err) {
      throw err;
    });
};

/**
 * get A record by domain id
 * @return 
 */
exports.getARecord = function() {
  return Q
    .fcall(function(){
      if (!cfg.domain_id) return exports.getDomain(global.domain_name);
    })
    .then(function(){
      var data = qs.stringify(util._extend(common_params, {domain_id: cfg.domain_id}));
      var opts = {
        host: 'dnsapi.cn',
        path: '/Record.List',
        method: 'POST',
        headers: {
          "Content-Type": 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        }
      };

      var d = Q.defer();

      var result = '';
      var req = https.request(opts, function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
          result += chunk;
        });
        res.on('end', function(){
          try {
            result = JSON.parse(result);
            if (result.status.code == '1') {
              d.resolve(result.records.filter(function(record){return record.type == 'A'})[0]);
            } else {
              throw new Error(result.status.message);
            }
          } catch(e) {
            d.reject(e);
          }
        });
      });
  
      req.write(data + '\n');
      req.end();
      req.on('error', function(err){
        d.reject(err);
      });

      return d.promise;
    })
    .then(function(record){
      cfg.record_id = record.id;
      return record;
    })
    .fail(function(err){
      throw err;
    });
};


exports.updateARecord = function(ip) {
  return Q
    .fcall(function(){
      if (!cfg.record_id) return exports.getARecord();
    })
    .then(function(){
      var data = {
        domain_id: cfg.domain_id,
        record_id: cfg.record_id
      };
      data = qs.stringify(util._extend(util._extend(data, common_params), {
        sub_domain: '@',
        record_line: '\u9ed8\u8ba4' // 默认
      }));

      var opts = {
        host: 'dnsapi.cn',
        path: '/Record.Ddns',
        method: 'POST',
        headers: {
          "Content-Type": 'application/x-www-form-urlencoded',
          'Content-Length': data.length
        }
      };

      var d = Q.defer();

      var result = '';
      var req = https.request(opts, function(res){
        res.setEncoding('utf8');
        res.on('data', function(chunk){
          result += chunk;
        });
        res.on('end', function(){
          try {
            result = JSON.parse(result);
            if (result.status.code == '1') {
              d.resolve(result.record);
            } else {
              throw new Error(result.status.message);
            }
          } catch(e) {
            d.reject(e);
          }
        });
      });
  
      req.write(data + '\n');
      req.end();
      req.on('error', function(err){
        d.reject(err);
      });

      return d.promise;
    })
    .fail(function(err){
      console.error(err.message);
    });
};
