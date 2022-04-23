"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var myVideoFrame = document.getElementById('myVideoFrame');
var peerVideoFrame = document.getElementById('peerVideoFrame');
var myStream;
var muted = false;
var cameraOff = false;
var cameraIndex = 0;
var cameras;
var myRoomName;
var myPeerConnection;

var getUserMedia = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(deviceId) {
    var defaultConstrains, cameraConstrains;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            defaultConstrains = {
              audio: true,
              video: true
            };
            cameraConstrains = {
              audio: true,
              video: {
                deviceId: {
                  exact: deviceId
                }
              }
            };
            _context.prev = 2;
            _context.next = 5;
            return navigator.mediaDevices.getUserMedia(deviceId ? cameraConstrains : defaultConstrains);

          case 5:
            myStream = _context.sent;
            myVideoFrame.srcObject = myStream;
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](2);
            console.error(_context.t0);

          case 12:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[2, 9]]);
  }));

  return function getUserMedia(_x) {
    return _ref.apply(this, arguments);
  };
}();

var btnMic = document.getElementById('btnMic');
var btnCamera = document.getElementById('btnCamera');
var btnChangeCamera = document.getElementById('btnChangeCamera');
var roomNameHTML = document.getElementById('roomName'); // 버튼 컨트롤

btnMic.addEventListener('click', function () {
  if (muted) {
    btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  } else {
    btnMic.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
  } // track.muted 는 되지 않음!


  myStream.getAudioTracks().forEach(function (track) {
    return track.enabled = !track.enabled;
  });
  muted = !muted;
});
btnCamera.addEventListener('click', function () {
  if (cameraOff) {
    btnCamera.innerHTML = '<i class="fa-solid fa-video"></i>';
  } else {
    btnCamera.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
  }

  myStream.getVideoTracks().forEach(function (track) {
    return track.enabled = !track.enabled;
  });
  cameraOff = !cameraOff;
});

var getNextCameraId = function getNextCameraId(cameras) {
  cameraIndex = cameraIndex >= cameras.length - 1 ? 0 : cameraIndex + 1;
  return cameras[cameraIndex].deviceId;
};

btnChangeCamera.addEventListener('click', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
  var videoSender;
  return regeneratorRuntime.wrap(function _callee2$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.next = 2;
          return getUserMedia(getNextCameraId(cameras));

        case 2:
          if (myPeerConnection) {
            videoSender = myPeerConnection.getSenders().find(function (sender) {
              return sender.track.kind === 'video';
            });
            videoSender.replaceTrack(myStream.getVideoTracks()[0]);
          }

        case 3:
        case "end":
          return _context2.stop();
      }
    }
  }, _callee2);
}))); // WebRtc 코드

var makeRTCConnection = function makeRTCConnection() {
  console.log('RTC실행');
  myPeerConnection = new RTCPeerConnection({
    iceServers: [{
      urls: ['stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302', 'stun:stun3.l.google.com:19302', 'stun:stun4.l.google.com:19302']
    }]
  });
  myPeerConnection.addEventListener('icecandidate', function (data) {
    nsp.emit('ice', data.candidate, myRoomName, function () {
      console.log('ice 보냈습니다.');
    });
  });
  myPeerConnection.addEventListener('track', function (data) {
    console.log('🧤 피어랑 연결됨!', data.streams);
    peerVideoFrame.srcObject = data.streams[0];
  });
  myStream.getTracks().forEach(function (track) {
    myPeerConnection.addTrack(track, myStream);
  });
}; // socket io 접속


var nsp = io(); // 네임스페이스 설정

var joinRoom = function joinRoom(roomName) {
  nsp.emit('makeRoom', roomName, function (roomName) {
    console.log(roomName + ' 입장');
    myRoomName = roomName;
    roomNameHTML.innerText = roomName;
  });
}; // 처음 연결


nsp.on('connect', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
  return regeneratorRuntime.wrap(function _callee3$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          // 앱실행
          init();
          console.log("id: ".concat(nsp.id));

        case 2:
        case "end":
          return _context3.stop();
      }
    }
  }, _callee3);
}))); // 대기방 리스트 받아왔을때

nsp.on('roomList', function (roomList) {
  // 대기중인 방이 있는 경우
  if (roomList.length) {
    joinRoom(roomList[0]);
  } // 새로 생성해야되는 경우
  else {
    joinRoom();
  }
}); // 다른 사람이 방에 접속했을때

nsp.on('join', /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
  var offer;
  return regeneratorRuntime.wrap(function _callee4$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          _context4.next = 2;
          return myPeerConnection.createOffer();

        case 2:
          offer = _context4.sent;
          myPeerConnection.setLocalDescription(offer); // 서버에 offer 전송

          nsp.emit('offer', offer, myRoomName, function () {
            console.log('offer 보냈습니다.');
          });

        case 5:
        case "end":
          return _context4.stop();
      }
    }
  }, _callee4);
})));
nsp.on('offer', function (offer) {
  console.log('offer 받았습니다.');
  var check = setInterval( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    var answer;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!myPeerConnection) {
              _context5.next = 8;
              break;
            }

            clearInterval(check);
            myPeerConnection.setRemoteDescription(offer);
            _context5.next = 5;
            return myPeerConnection.createAnswer();

          case 5:
            answer = _context5.sent;
            myPeerConnection.setLocalDescription(answer);
            nsp.emit('answer', answer, myRoomName, function () {
              console.log('answer 보냈습니다.');
            });

          case 8:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  })), 1000);
});
nsp.on('answer', function (answer) {
  console.log('answer 받았습니다.', myPeerConnection);
  myPeerConnection.setRemoteDescription(answer);
});
nsp.on('ice', function (ice) {
  var check = setInterval( /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (myPeerConnection) {
              clearInterval(check);
              console.log('ice 받았습니다.');
              myPeerConnection.addIceCandidate(ice);
            }

          case 1:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  })), 1000);
}); // 앱 실행

var init = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
    var devices;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return getUserMedia();

          case 2:
            // RTC 실행 (새로운 myPeerConnection 생성)
            makeRTCConnection(); // 카메라 갯수 확인 및 저장

            _context7.next = 5;
            return navigator.mediaDevices.enumerateDevices();

          case 5:
            devices = _context7.sent;
            cameras = devices.filter(function (device) {
              return device.kind === 'videoinput';
            });

            if (cameras.length > 1) {
              btnChangeCamera.style.display = 'block';
            }

          case 8:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function init() {
    return _ref7.apply(this, arguments);
  };
}();