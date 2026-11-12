// Сервер Zoo Throw: комнаты до 6 игроков, у каждого свой участок (0..5).
// Запуск: node server.js   (порт из PORT, по умолчанию 8080)
const http = require('http');
const { WebSocketServer } = require('ws');

const PORT = +process.env.PORT || 8080, MAX = 6;
const rooms = []; let nextId = 1;

const srv = http.createServer((req, res) => { res.writeHead(200, { 'content-type': 'text/plain', 'access-control-allow-origin': '*' }); res.end(`zoo-throw ok, rooms=${rooms.length}, players=${rooms.reduce((s, r) => s + r.players.size, 0)}`); });
const wss = new WebSocketServer({ server: srv, maxPayload: 32 * 1024 });

const clean = (s) => String(s || 'Player').replace(/[<>&"'`]/g, '').slice(0, 16) || 'Player';
const num = (v) => (typeof v === 'number' && isFinite(v) ? v : 0);
function roomFor() {
  let r = rooms.find((r) => r.players.size < MAX);
  if (!r) { r = { players: new Map() }; rooms.push(r); }
  return r;
}
function send(ws, o) { if (ws.readyState === 1) ws.send(JSON.stringify(o)); }
function cast(r, o, except) { const s = JSON.stringify(o); for (const p of r.players.values()) if (p.ws !== except && p.ws.readyState === 1) p.ws.send(s); }
const pub = (p) => ({ id: p.id, name: p.name, look: p.look, plot: p.plot, st: p.st, pets: p.pets, slots: p.slots, tl: p.tl });

wss.on('connection', (ws) => {
  let me = null, room = null, last = 0, count = 0;
  ws.on('message', (buf) => {
    const now = Date.now(); if (now - last > 1000) { last = now; count = 0; } if (++count > 60) return; // защита от флуда
    let m; try { m = JSON.parse(buf); } catch (e) { return; }
    if (!me) {
      if (m.t !== 'hello') return;
      room = roomFor(); const used = new Set([...room.players.values()].map((p) => p.plot));
      let plot = 0; while (used.has(plot)) plot++;
      me = { id: nextId++, ws, name: clean(m.name), look: num(m.look) | 0, plot, st: [0, 0, 0, 0, 0, 0, 0, -1], pets: [], slots: 8, tl: 1 };
      send(ws, { t: 'welcome', id: me.id, plot, players: [...room.players.values()].map(pub) });
      room.players.set(me.id, me); cast(room, { t: 'join', p: pub(me) }, ws);
      return;
    }
    if (m.t === 'st' && Array.isArray(m.s)) { me.st = m.s.slice(0, 8).map(num); cast(room, { t: 'st', id: me.id, s: me.st }, ws); }
    else if (m.t === 'plot' && Array.isArray(m.pets)) { me.pets = m.pets.slice(0, 40).map((a) => [num(a[0]) | 0, num(a[1]) | 0]); me.slots = num(m.slots) | 0; me.tl = num(m.tl) | 0; cast(room, { t: 'plot', id: me.id, pets: me.pets, slots: me.slots, tl: me.tl }, ws); }
    else if (m.t === 'throw') cast(room, { t: 'throw', id: me.id, x: num(m.x), z: num(m.z), f: num(m.f) | 0 }, ws);
    else if (m.t === 'catch') cast(room, { t: 'catch', id: me.id, k: num(m.k) | 0, m: num(m.m) | 0 }, ws);
  });
  ws.on('close', () => {
    if (!me) return; room.players.delete(me.id); cast(room, { t: 'leave', id: me.id });
    if (!room.players.size) rooms.splice(rooms.indexOf(room), 1);
  });
});
// пинг, чтобы обрывать мёртвые соединения
setInterval(() => { for (const ws of wss.clients) { if (ws.alive === false) { ws.terminate(); continue; } ws.alive = false; ws.ping(); } }, 20000);
wss.on('connection', (ws) => { ws.alive = true; ws.on('pong', () => (ws.alive = true)); });
srv.listen(PORT, () => console.log('zoo-throw server on :' + PORT));
