import express from 'express';
import * as http from 'http';
import { Server } from 'socket.io';
import path from 'path';

const PORT = process.env.PORT || 3000;

const app = express();

// static 폴더 설정(정적파일 경로 설정)
app.use('/public', express.static(path.join(__dirname, 'public')));

// view engine 설정
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.get('/', (req, res) => {
  res.render('index');
});
app.get('/', (req, res) => {
  res.render('index');
});

const httpServer = http.createServer(app);
const ws = new Server(httpServer);

const getPublicRoomList = () => {
  const {
    sockets: {
      adapter: { rooms, sids },
    },
  } = ws;

  let result = [];
  if (!rooms) return result;

  rooms.forEach((users, room) => {
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

let roomIndex = 0;
const getRoomName = () => {
  roomIndex = roomIndex + 1;
  return 'room' + roomIndex;
};

ws.on('connection', (socket) => {
  // 모든 이벤트 Log 남기기
  socket.onAny((event) => {
    console.log(`🟦 Socket Event: ${event}`);
  });

  // 접속시 룸리스트 보내고 자동으로 방생성
  const publicRoomList = getPublicRoomList();
  ws.to(socket.id).emit('roomList', publicRoomList);
  console.log('룸리스트', publicRoomList);

  // 방 생성
  socket.on('makeRoom', (roomName, done) => {
    if (!roomName) {
      roomName = getRoomName();
      console.log('roomName 없음');
    } else {
      console.log('roomName 있음');
    }
    socket.join(roomName);
    console.log('접속정보', socket.id, roomName);
    done(roomName);

    // 룸이 있는 곳에 접속했을시 나를 제외한 방 사람한테 join 보냄.
    if (roomName) {
      socket.to(roomName).emit('join');
    }
  });

  // offer 받았을 때
  socket.on('offer', (offer, roomName, done) => {
    // 나를 제외한 방 사람한테 offer 보냄
    socket.to(roomName).emit('offer', offer);
    done();
  });

  // answer 받았을 때
  socket.on('answer', (answer, roomName, done) => {
    // 나를 제외한 방 사람한테 answer 보냄
    socket.to(roomName).emit('answer', answer);
    done();
  });

  // ice 받았을 때
  socket.on('ice', (ice, roomName, done) => {
    // 나를 제외한 방 사람한테 ice 보냄
    socket.to(roomName).emit('ice', ice);
    done();
  });
});

httpServer.listen(PORT, () => {
  console.log('🔥 Listening on http://localhost:' + PORT);
});
