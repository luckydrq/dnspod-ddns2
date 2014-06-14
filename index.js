var net = require('net');
var Q = require('q');
var current_ip;

function getip() {
  var d = Q.defer();
  var ip = '';
  var client = net.connect({
    port: 6666,
    host: 'ns1.dnspod.net'
  });
  
  client.setEncoding('utf8');
  client.on('data', function(chunk) {
    ip += chunk;
  });
  client.on('end', function() {
    d.resolve(ip);
  });
  client.on('error', function(err) {
    d.reject(err);
  });

  return d.promise;
}

function isValidIP(ip) {
  return net.isIPv4(ip) || net.isIPv6(ip);
}

module.exports = function(timeout) {
  var ddns = require('./lib/ddns');

  function doDDNS() {
    getip()
      .then(function(ip) {
        if (isValidIP(ip)) {
          if (current_ip == ip) {
            console.log('%s ip: [%s], not change!', now(), ip);
          } else {
            current_ip = ip;
            return ddns.updateARecord(ip);
          }
        } else {
          throw new Error('Invalid IP!');
        }
      })
      .then(function(record) {
        if (record) {
          console.log('%s %s', now(), record.value);
        }
      })
      .fail(function(err) {
        console.error('%s %s', now(), err.message);
      })
      .fin(function(){
        setTimeout(doDDNS, timeout);
      });
  }

  doDDNS();
};

function now(){
  var now = new Date();
  var year = normalize(now.getFullYear());
  var month = normalize(now.getMonth() + 1);
  var day = normalize(now.getDate());
  var hour = normalize(now.getHours());
  var minute = normalize(now.getMinutes());
  var second = normalize(now.getSeconds());
  
  return [[year, month, day].join('-'), [hour, minute, second].join(':')].join(' ');
}

function normalize(num) {
  if (num < 10) return '0' + num;
  else return num;
}
