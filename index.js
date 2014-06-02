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
            console.log('ip: [%s], not change!', ip);
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
          console.log(record.value);
        }
      })
      .fail(function(err) {
        console.error(err.message);
      })
      .fin(function(){
        setTimeout(doDDNS, timeout);
      });
  }

  doDDNS();
};

