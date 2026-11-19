// AHAD-MD - By Ahad | Render Ready
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const pino = require('pino');

const OWNER_NUMBER = '923243480736';
const PREFIX = '.';
const BOT_NAME = 'AHAD-MD';

async function startBot() {
  const { state, saveCreds } = await useMultiFileAuthState('session');
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    logger: pino({ level: 'silent' }),
    printQRInTerminal: true,
    auth: state,
    browser: ['AHAD-MD', 'Chrome', '1.0.0']
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'close') {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log('Connection closed, reconnecting...', shouldReconnect);
      if (shouldReconnect) startBot();
    } else if (connection === 'open') {
      console.log('AHAD-MD CONNECTED SUCCESSFULLY!');
    }
  });

  if (!sock.authState.creds.registered) {
    const phoneNumber = OWNER_NUMBER;
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(phoneNumber);
        console.log('================================');
        console.log('TERA PAIRING CODE: ' + code);
        console.log('WhatsApp > Linked Devices > Link with phone number');
        console.log('================================');
      } catch (e) {
        console.log('Pairing Code Error:', e.message);
      }
    }, 3000);
  }

  sock.ev.on('messages.upsert', async ({ messages }) => {
    const msg = messages[0];
    if (!msg.message || msg.key.fromMe) return;
    const from = msg.key.remoteJid;
    const body = msg.message.conversation || msg.message.extendedTextMessage?.text || '';
    if (!body.startsWith(PREFIX)) return;
    const args = body.slice(PREFIX.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();
    const reply = async (text) => {
      await sock.sendMessage(from, { text: text }, { quoted: msg });
    };

    if (command === 'menu' || command === 'help') {
      await reply('AHAD-MD MENU\n\nOwner: Ahad\nWebsite: ahadmart.free.nf\n\nCommands:\n.menu - Ye list\n.ping - Bot speed check\n.alive - Bot zinda hai?\n.owner - Owner ka number\n.info - Bot ki info');
    }
    if (command === 'ping') {
      const start = Date.now();
      await reply('Pong!');
      await reply('Speed: ' + (Date.now() - start) + 'ms');
    }
    if (command === 'alive') {
      await reply('AHAD-MD ALIVE HAI! Ahad ka bot chal raha hai');
    }
    if (command === 'owner') {
      await reply('OWNER: AHAD\nNumber: +92 324 3480736\nShop: ahadmart.free.nf');
    }
    if (command === 'info') {
      await reply('AHAD-MD INFO\nVersion: 1.0.0\nCreator: Ahad (Karachi)\nStatus: Online');
    }
  });
}

startBot();

const http = require('http');
http.createServer((req, res) => {
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('AHAD-MD IS ONLINE');
}).listen(process.env.PORT || 3000);
