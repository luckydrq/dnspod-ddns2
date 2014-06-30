var dns = require('dns');
var net = require('net');
var Q = require('q');
var current_ip, host_ip;
var DNSPOD_DOMAIN = 'ns1.dnspod.net';

// set global `onerror`
Q.longStackSupport = true;
Q.onerror = function(e) {
  console.error(e.stack);
};

function gethost() {
  if (host_ip) return;

  var d = Q.defer();

  dns.lookup(DNSPOD_DOMAIN, function(e, host) {
    if (e) d.reject(e);
    else {
      if (isValidIP(host)) {
        host_ip = host;
        d.resolve();
      } else {
        d.reject(new Error('Invalid host!'));
      }
    }
  });

  return d.promise;
}

function getip() {
  var d = Q.defer();
  var ip = '';
  var client = net.connect({
    port: 6666,
    host: host_ip
  });

  client.setEncoding('utf8');
  client.on('data', function(chunk) {
    ip += chunk;
  });
  client.on('end', function() {
    d.resolve(ip);
  });
  client.on('error', function(e) {
    // destroy socket
    client && client.destroy();
    d.reject(e);
  });
  // got `ETIMEDOUT`
  // add listener to `timeout`
  client.on('timeout', function(e) {
    client && client.destroy();
    d.reject(new Error('connect timeout!'));
  });

  return d.promise;
}

function isValidIP(ip) {
  return net.isIPv4(ip) || net.isIPv6(ip);
}

module.exports = function(timeout) {
  var ddns = require('./lib/ddns');
  var internal = 0;

  function doDDNS() {
    return Q
      .try(function() {
        return gethost();
      })
      .then(function() {
        return getip();
      })
      .then(function(ip) {
        if (isValidIP(ip)) {
          if (current_ip == ip) {
            console.log('%s ip: [%s], not change!', now(), ip);
          } else {
            return ddns
              .updateARecord(ip)
              .then(function(record) {
                if (record && isValidIP(record.value)) {
                  current_ip = ip;
                  console.log('%s %s', now(), record.value);
                } else {
                  throw new Error('updateARecord failed!');
                }
              });
          }
        } else {
          throw new Error('Invalid IP!');
        }
      })
      .catch(function(e) {
        host_ip = undefined;
        console.error('%s %s', now(), e.message);
      })
      .finally(function(){
        if (++internal == 50) {
          host_ip = undefined;
          internal = 0;
        }
        setTimeout(doDDNS, timeout);
      })
      .done();
  }

  doDDNS();
};

function now(){
  var nowDate = new Date();
  var year = normalize(nowDate.getFullYear());
  var month = normalize(nowDate.getMonth() + 1);
  var day = normalize(nowDate.getDate());
  var hour = normalize(nowDate.getHours());
  var minute = normalize(nowDate.getMinutes());
  var second = normalize(nowDate.getSeconds());

  return [[year, month, day].join('-'), [hour, minute, second].join(':')].join(' ');
}

function normalize(num) {
  if (num < 10) return '0' + num;
  else return num;
}
