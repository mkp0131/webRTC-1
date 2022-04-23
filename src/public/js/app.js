const myVideoFrame = document.getElementById('myVideoFrame');
const peerVideoFrame = document.getElementById('peerVideoFrame');

let myStream;
let muted = false;
let cameraOff = false;
let cameraIndex = 0;
let cameras;
let myRoomName;
let myPeerConnection;
let myDataChannel;

const getUserMedia = async (deviceId) => {
  const defaultConstrains = {
    audio: true,
    video: true,
  };
  const cameraConstrains = {
    audio: true,
    video: { deviceId: { exact: deviceId } },
  };

  try {
    // 카메라 스트림
    myStream = await navigator.mediaDevices.getUserMedia(
      deviceId ? cameraConstrains : defaultConstrains
    );
    myVideoFrame.srcObject = myStream;
  } catch (error) {
    console.error(error);
  }
};

const btnMic = document.getElementById('btnMic');
const btnCamera = document.getElementById('btnCamera');
const btnChangeCamera = document.getElementById('btnChangeCamera');
const roomNameHTML = document.getElementById('roomName');
const btnChat = document.getElementById('btnChat');
const contentsHTML = document.getElementById('contents');
const chatForm = document.getElementById('chatForm');
const chatList = document.getElementById('chatList');

// 버튼 컨트롤
btnMic.addEventListener('click', () => {
  if (muted) {
    btnMic.innerHTML = '<i class="fa-solid fa-microphone"></i>';
  } else {
    btnMic.innerHTML = '<i class="fa-solid fa-microphone-slash"></i>';
  }
  // track.muted 는 되지 않음!
  myStream
    .getAudioTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  muted = !muted;
});

btnCamera.addEventListener('click', () => {
  if (cameraOff) {
    btnCamera.innerHTML = '<i class="fa-solid fa-video"></i>';
  } else {
    btnCamera.innerHTML = '<i class="fa-solid fa-video-slash"></i>';
  }
  myStream
    .getVideoTracks()
    .forEach((track) => (track.enabled = !track.enabled));
  cameraOff = !cameraOff;
});

const getNextCameraId = (cameras) => {
  cameraIndex = cameraIndex >= cameras.length - 1 ? 0 : cameraIndex + 1;

  return cameras[cameraIndex].deviceId;
};

btnChangeCamera.addEventListener('click', async () => {
  await getUserMedia(getNextCameraId(cameras));
  if (myPeerConnection) {
    const videoSender = myPeerConnection
      .getSenders()
      .find((sender) => sender.track.kind === 'video');
    videoSender.replaceTrack(myStream.getVideoTracks()[0]);
  }
});

btnChat.addEventListener('click', () => {
  contentsHTML.classList.toggle('chat');
});

const appendChat = (chat, my = 'my') => {
  const html = document.createElement('div');
  html.classList.add('chat');
  html.classList.add(my);
  html.innerHTML = `<div class="speech-bubble">${chat}</div>`;
  chatList.appendChild(html);
};

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const chat = chatForm.querySelector('textarea[name="chat"]').value.trim();

  appendChat(chat, 'my');
  myDataChannel.send(chat);
});

// WebRtc 코드
const makeRTCConnection = () => {
  console.log('RTC실행');
  myPeerConnection = new RTCPeerConnection({
    iceServers: [
      {
        urls: [
          'stun:stun.l.google.com:19302',
          'stun:stun1.l.google.com:19302',
          'stun:stun2.l.google.com:19302',
          'stun:stun3.l.google.com:19302',
          'stun:stun4.l.google.com:19302',
        ],
      },
    ],
  });
  myPeerConnection.addEventListener('icecandidate', (data) => {
    nsp.emit('ice', data.candidate, myRoomName, () => {
      console.log('ice 보냈습니다.');
    });
  });
  myPeerConnection.addEventListener('track', (data) => {
    console.log('🧤 피어랑 연결됨!', data.streams);
    peerVideoFrame.srcObject = data.streams[0];
  });
  myStream.getTracks().forEach((track) => {
    myPeerConnection.addTrack(track, myStream);
  });
};

// socket io 접속
const nsp = io(); // 네임스페이스 설정

const joinRoom = (roomName) => {
  nsp.emit('makeRoom', roomName, (roomName) => {
    console.log(roomName + ' 입장');
    myRoomName = roomName;
    roomNameHTML.innerText = roomName;
  });
};

// 처음 연결
nsp.on('connect', async () => {
  // 앱실행
  init();

  console.log(`id: ${nsp.id}`);
});

// 대기방 리스트 받아왔을때
nsp.on('roomList', (roomList) => {
  // 대기중인 방이 있는 경우
  if (roomList.length) {
    joinRoom(roomList[0]);
  }
  // 새로 생성해야되는 경우
  else {
    joinRoom();
  }
});

// 다른 사람이 방에 접속했을때
nsp.on('join', async () => {
  // 데이터 채널 생성
  myDataChannel = myPeerConnection.createDataChannel('chat');
  myDataChannel.addEventListener('message', (msg) => {
    console.log(msg);
    appendChat(msg.data, 'other');
  });
  console.log('😀', myDataChannel);
  // 새로운 오퍼 생성
  const offer = await myPeerConnection.createOffer();
  myPeerConnection.setLocalDescription(offer);

  // 서버에 offer 전송
  nsp.emit('offer', offer, myRoomName, () => {
    console.log('offer 보냈습니다.');
  });
});

nsp.on('offer', (offer) => {
  console.log('offer 받았습니다.');

  const check = setInterval(async () => {
    if (myPeerConnection) {
      clearInterval(check);
      myPeerConnection.setRemoteDescription(offer);
      const answer = await myPeerConnection.createAnswer();
      myPeerConnection.setLocalDescription(answer);
      nsp.emit('answer', answer, myRoomName, () => {
        console.log('answer 보냈습니다.');
      });

      myPeerConnection.addEventListener('datachannel', (data) => {
        myDataChannel = data.channel;
        myDataChannel.addEventListener('message', (msg) => {
          appendChat(msg.data, 'other');
        });
      });
    }
  }, 1000);
});

nsp.on('answer', (answer) => {
  console.log('answer 받았습니다.', myPeerConnection);
  myPeerConnection.setRemoteDescription(answer);
});

nsp.on('ice', (ice) => {
  const check = setInterval(async () => {
    if (myPeerConnection) {
      clearInterval(check);
      console.log('ice 받았습니다.');
      myPeerConnection.addIceCandidate(ice);
    }
  }, 1000);
});

// 앱 실행
const init = async () => {
  // 기본 카메라 세팅
  await getUserMedia();

  // RTC 실행 (새로운 myPeerConnection 생성)
  makeRTCConnection();

  // 카메라 갯수 확인 및 저장
  const devices = await navigator.mediaDevices.enumerateDevices();
  cameras = devices.filter((device) => device.kind === 'videoinput');
  if (cameras.length > 1) {
    btnChangeCamera.style.display = 'block';
  }
};
