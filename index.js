const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, makeCacheableSignalKeyStore } = require('@whiskeysockets/baileys')
const P = require('pino')
const readline = require('readline')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
const question = (text) => new Promise((resolve) => rl.question(text, resolve))

async function startBot() {
    console.log("=== SAJY-MD BOT BY SAJY TECH ===")
    const { state, saveCreds } = await useMultiFileAuthState('./auth')
    
    const sock = makeWASocket({
        auth: {
            creds: state.creds,
            keys: makeCacheableSignalKeyStore(state.keys, P().child({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: P({ level: "silent" }),
        browser: ["SAJY-MD", "Chrome", "1.0.0"]
    })

    if (!sock.authState.creds.registered) {
        const number = await question("Apna WhatsApp Number Likho (9230...): ")
        const code = await sock.requestPairingCode(number.trim())
        console.log(`\nAapka Pair Code: ${code}\nIsko WhatsApp > Linked Devices > Link with Phone Number me dalo\n`)
    }

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut
            if (shouldReconnect) startBot()
        } else if (connection === 'open') {
            console.log("SAJY-MD Connected Successfully!")
        }
    })

    sock.ev.on('messages.upsert', async ({ messages }) => {
        const msg = messages[0]
        if (!msg.message) return
        const text = msg.message.conversation || msg.message.extendedTextMessage?.text || ""
        const from = msg.key.remoteJid

        if (text.toLowerCase() === '.menu' || text.toLowerCase() === '.ping') {
            await sock.sendMessage(from, { text: `*SAJY-MD BOT*\n\n✅ Bot Active Hai\n\nCommands:\n.manu - Menu\n.ping - Check Speed\n.owner - Owner Info\n\nPowered by SAJY TECH` })
        }
        if (text.toLowerCase() === '.owner') {
            await sock.sendMessage(from, { text: `Owner: Sajid Ali Laghari\nBot: SAJY-MD` })
        }
    })
}

startBot()
