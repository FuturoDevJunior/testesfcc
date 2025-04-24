// script.js
// P2P Video Chat App (freeCodeCamp)
// Estrutura base: controle de etapas, mídia, sinalização, WebRTC, UX

// --- Seletores de elementos ---
const permissionStep = document.getElementById('permission-step');
const roomStep = document.getElementById('room-step');
const chatStep = document.getElementById('chat-step');
const grantMediaBtn = document.getElementById('grant-media-btn');
const permissionError = document.getElementById('permission-error');
const roomInput = document.getElementById('room-input');
const joinRoomBtn = document.getElementById('join-room-btn');
const cancelRoomBtn = document.getElementById('cancel-room-btn');
const roomError = document.getElementById('room-error');
const localVideo = document.getElementById('local-video');
const remoteVideo = document.getElementById('remote-video');
const chatStatus = document.getElementById('chat-status');
const leaveBtn = document.getElementById('leave-btn');

// --- Estado global ---
let localStream = null;
let remoteStream = null;
let ws = null;
let peer = null;
let currentRoom = null;
let isInitiator = false;
let reconnectTimeout = null;

// --- Funções utilitárias ---
function showStep(step) {
  [permissionStep, roomStep, chatStep].forEach(s => s.classList.remove('active'));
  step.classList.add('active');
}

function showError(elem, msg) {
  elem.textContent = msg;
  elem.style.display = msg ? 'block' : 'none';
}

function clearError(elem) {
  showError(elem, '');
}

function resetApp() {
  // Limpa estado e volta ao início
  if (peer) { peer.close(); peer = null; }
  if (ws) { ws.close(); ws = null; }
  if (remoteVideo.srcObject) remoteVideo.srcObject = null;
  chatStatus.textContent = '';
  currentRoom = null;
  isInitiator = false;
  clearError(permissionError);
  clearError(roomError);
  showStep(permissionStep);
}

// --- Inicialização ---
showStep(permissionStep);
// (A lógica completa será implementada nas próximas etapas)

// --- Permissão de mídia ---
grantMediaBtn.onclick = async () => {
  clearError(permissionError);
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideo.srcObject = localStream;
    showStep(roomStep);
    roomInput.focus();
  } catch (err) {
    showError(permissionError, 'Permissão de câmera e microfone é obrigatória.');
  }
};

// --- Prompt de sala ---
joinRoomBtn.onclick = () => {
  clearError(roomError);
  const roomName = (roomInput.value || '').trim();
  if (!roomName) {
    showError(roomError, 'Digite um nome de sala válido.');
    roomInput.focus();
    return;
  }
  connectToRoom(roomName);
};

cancelRoomBtn.onclick = () => {
  resetApp();
};

function connectToRoom(roomName) {
  if (ws) ws.close();
  ws = new WebSocket('ws://localhost:3001');
  ws.onopen = () => {
    ws.send(JSON.stringify({ type: 'join', room: roomName }));
  };
  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'joined') {
      currentRoom = roomName;
      isInitiator = msg.users === 1;
      showStep(chatStep);
      chatStatus.textContent = 'Aguardando outro participante...';
      setupWebRTC();
    } else if (msg.type === 'peer-joined') {
      chatStatus.textContent = 'Conectando...';
      if (isInitiator && peer) createOffer();
    } else if (msg.type === 'full') {
      showError(roomError, 'Sala cheia. Escolha outro nome.');
      ws.close();
    } else if (msg.type === 'error') {
      showError(roomError, msg.message || 'Erro desconhecido.');
      ws.close();
    } else if (msg.type === 'signal') {
      if (peer) handleSignal(msg.data);
    } else if (msg.type === 'peer-left') {
      chatStatus.textContent = 'O outro participante saiu. Aguardando reconexão...';
      if (peer) { peer.close(); peer = null; }
      // Permitir reconexão automática
    }
  };
  ws.onerror = () => {
    showError(roomError, 'Erro de conexão com o servidor.');
    ws.close();
  };
  ws.onclose = () => {
    // Se fechar inesperadamente durante o chat, tentar reconectar
    if (currentRoom && chatStep.classList.contains('active')) {
      chatStatus.textContent = 'Reconectando...';
      reconnectTimeout = setTimeout(() => connectToRoom(currentRoom), 2000);
    }
  };
}

// --- WebRTC ---
function setupWebRTC() {
  if (peer) { peer.close(); peer = null; }
  peer = new RTCPeerConnection({
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }
    ]
  });
  // Adiciona tracks locais
  localStream.getTracks().forEach(track => peer.addTrack(track, localStream));

  // Recebe tracks remotas
  peer.ontrack = (event) => {
    if (!remoteStream) {
      remoteStream = new MediaStream();
      remoteVideo.srcObject = remoteStream;
    }
    event.streams[0].getTracks().forEach(track => {
      if (!remoteStream.getTracks().includes(track)) {
        remoteStream.addTrack(track);
      }
    });
  };

  // ICE candidates
  peer.onicecandidate = (event) => {
    if (event.candidate && ws && ws.readyState === 1) {
      ws.send(JSON.stringify({ type: 'signal', data: { candidate: event.candidate } }));
    }
  };

  // Conexão estabelecida
  peer.onconnectionstatechange = () => {
    if (peer.connectionState === 'connected') {
      chatStatus.textContent = 'Conectado!';
    } else if (peer.connectionState === 'disconnected' || peer.connectionState === 'failed') {
      chatStatus.textContent = 'Conexão perdida. Tentando reconectar...';
    }
  };
}

async function createOffer() {
  if (!peer) return;
  const offer = await peer.createOffer();
  await peer.setLocalDescription(offer);
  ws.send(JSON.stringify({ type: 'signal', data: { sdp: peer.localDescription } }));
}

async function handleSignal(signal) {
  if (!peer) return;
  if (signal.sdp) {
    if (signal.sdp.type === 'offer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
      const answer = await peer.createAnswer();
      await peer.setLocalDescription(answer);
      ws.send(JSON.stringify({ type: 'signal', data: { sdp: peer.localDescription } }));
    } else if (signal.sdp.type === 'answer') {
      await peer.setRemoteDescription(new RTCSessionDescription(signal.sdp));
    }
  } else if (signal.candidate) {
    try {
      await peer.addIceCandidate(new RTCIceCandidate(signal.candidate));
    } catch (e) {
      // Ignora erros de ICE
    }
  }
}

// --- Sair da sala ---
leaveBtn.onclick = () => {
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify({ type: 'leave' }));
    ws.close();
  }
  resetApp();
}; 