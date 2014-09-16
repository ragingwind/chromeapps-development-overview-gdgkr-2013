'use strict';

(function (window) {
  var socket = chrome.socket;

  var NotiServer = window.NotiServer = {
    listened: false,
    clientSocketId: -1,
    serverSocketId: -1
  };

  function doNotification(msg) {
    var nid = new Date().getTime();
    var opt = {
      type: 'basic',
      title: 'Notification Server',
      message: msg,
      iconUrl: 'images/jimmymoon-profile.jpg'
    }

    // Try to download target external resource with xhr and blob
    if (msg.search(/gif|jpg|png|jpeg/) !== -1) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', msg, true);
      xhr.responseType = 'blob';
      xhr.onload = function(e) {
        opt.type = 'image';
        opt.imageUrl =  window.webkitURL.createObjectURL(this.response);
        chrome.notifications.create('' + nid, opt, function () {});
      };
      xhr.send();
    } else {
      chrome.notifications.create('' + nid, opt, function () {});
    }
  };

  NotiServer.notify = function(sockeId, message) {
    var f = new FileReader();
    f.onload = function(e) {
      chrome.socket.write(sockeId, e.target.result, function() {});
    };
    f.readAsArrayBuffer(new Blob([message]));
  };

  NotiServer.connect = function(opt, cb) {
    NotiServer.log('Try to connect to notification server', {side: 'client'})
    socket.create('tcp', {}, function(createInfo) {
      socket.connect(createInfo.socketId, opt.ip, opt.port, function() {
        cb && cb({socketId: createInfo.socketId});
      });
    });
  }

  NotiServer.disconnect = function(socketId) {
    if (socketId >= -1) {
      socket.disconnect(socketId);
      socket.destroy(socketId);
    }
  };

  NotiServer.onReceive = function(readInfo) {
    if (readInfo && readInfo.resultCode < 0) {
      NotiServer.disconnect(NotiServer.clientSocketId);
      NotiServer.clientSocketId = -1;
      return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      NotiServer.log('Received message from client: ' + e.target.result);
      doNotification(e.target.result);
    };
    reader.readAsText(new Blob([new Uint8Array(readInfo.data)]));

    socket.read(NotiServer.clientSocketId, null, NotiServer.onReceive);
  };

  NotiServer.onAccept = function(resultInfo) {
    NotiServer.log('Here comes new client');

    socket.accept(NotiServer.serverSocketId, NotiServer.onAccept);

    if (NotiServer.clientSocketId !== -1) {
      NotiServer.disconnect(NotiServer.clientSocketId);
      NotiServer.clientSocketId = -1;
    }

    NotiServer.clientSocketId = resultInfo.socketId;
    socket.read(NotiServer.clientSocketId, null, NotiServer.onReceive);
  };

  NotiServer.stop = function() {
    NotiServer.log('Stop notification server');

    NotiServer.disconnect(NotiServer.clientSocketId);
    NotiServer.clientSocketId = -1;

    NotiServer.disconnect(NotiServer.serverSocketId);
    NotiServer.serverSocketId = -1;

    NotiServer.listened = false;
  };

  NotiServer.start = function(opt, cb) {
    NotiServer.ip = opt.ip || '127.0.0.1';
    NotiServer.port = opt.port || 9090;

    NotiServer.log('Start notification server ip: ' + opt.ip +
                   ', port: ' + opt.port);

    if (!NotiServer.listened) {
      socket.create('tcp', {}, function(createInfo) {
        NotiServer.log('Listen socket created sid: ' + createInfo.socketId);

        if (createInfo.socketId > 0) {
          NotiServer.serverSocketId = createInfo.socketId;
          socket.listen(NotiServer.serverSocketId, opt.ip, opt.port,
                  null, function(resultCode) {
            if (resultCode === 0) {
              NotiServer.log('Start to waiting for client');

              NotiServer.listened = true;
              socket.accept(NotiServer.serverSocketId, NotiServer.onAccept);
            } else {
              NotiServer.log('Unable to listen to socket. code: ' + resultCode);

            }
            cb && cb();
          });
        } else {
          NotiServer.log('Failed to start notification server');
        }
      });
    } else {
      NotiServer.log('Unable to create socket');
    }
  };

})(window);
