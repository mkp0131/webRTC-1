"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var _express = _interopRequireDefault(require("express"));

var http = _interopRequireWildcard(require("http"));

var _socket = require("socket.io");

var _path = _interopRequireDefault(require("path"));

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function _getRequireWildcardCache(nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || _typeof(obj) !== "object" && typeof obj !== "function") { return { "default": obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj["default"] = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

var PORT = process.env.PORT || 3001;
var app = (0, _express["default"])(); // static 폴더 설정(정적파일 경로 설정)

app.use('/public', _express["default"]["static"](_path["default"].join(__dirname, 'public'))); // view engine 설정

app.set('view engine', 'pug');
app.set('views', _path["default"].join(__dirname, 'views'));
app.get('/', function (req, res) {
  res.render('index');
});
app.get('/', function (req, res) {
  res.render('index');
});
var httpServer = http.createServer(app);
var ws = new _socket.Server(httpServer);

var getPublicRoomList = function getPublicRoomList() {
  var _ws$sockets$adapter = ws.sockets.adapter,
      rooms = _ws$sockets$adapter.rooms,
      sids = _ws$sockets$adapter.sids;
  var result = [];
  if (!rooms) return result;
  rooms.forEach(function (users, room) {
    // Room 체크(Room인 경우)
    if (!sids.get(room)) {
      if (users.size === 1) {
        result.push(room);
        return;
      }
    }
  });
  return result;
};

var roomIndex = 0;

var getRoomName = function getRoomName() {
  roomIndex = roomIndex + 1;
  return 'room' + roomIndex;
};

ws.on('connection', function (socket) {
  // 모든 이벤트 Log 남기기
  socket.onAny(function (event) {
    console.log("\uD83D\uDFE6 Socket Event: ".concat(event));
  }); // 접속시 룸리스트 보내고 자동으로 방생성

  var publicRoomList = getPublicRoomList();
  ws.to(socket.id).emit('roomList', publicRoomList);
  console.log('룸리스트', publicRoomList); // 방 생성

  socket.on('makeRoom', function (roomName, done) {
    if (!roomName) {
      roomName = getRoomName();
      console.log('roomName 없음');
    } else {
      console.log('roomName 있음');
    }

    socket.join(roomName);
    console.log('접속정보', socket.id, roomName);
    done(roomName); // 룸이 있는 곳에 접속했을시 나를 제외한 방 사람한테 join 보냄.

    if (roomName) {
      socket.to(roomName).emit('join');
    }
  }); // offer 받았을 때

  socket.on('offer', function (offer, roomName, done) {
    // 나를 제외한 방 사람한테 offer 보냄
    socket.to(roomName).emit('offer', offer);
    done();
  }); // answer 받았을 때

  socket.on('answer', function (answer, roomName, done) {
    // 나를 제외한 방 사람한테 answer 보냄
    socket.to(roomName).emit('answer', answer);
    done();
  }); // ice 받았을 때

  socket.on('ice', function (ice, roomName, done) {
    // 나를 제외한 방 사람한테 ice 보냄
    socket.to(roomName).emit('ice', ice);
    done();
  });
});
httpServer.listen(PORT, function () {
  console.log('🔥 Listening on http://localhost:' + PORT);
});