#!/usr/bin/env node
/**
 * Xiaomi Air Purifier Control Script (Room-Aware Version)
 */

const { XiaomiMiHome } = require('xmihome');
const fs = require('fs');
const path = require('path');

const CREDS_FILE = path.join(process.env.HOME, '.config/xmihome/credentials.json');
const CONFIG_FILE = path.join(__dirname, '..', 'config.json');

const PROPS = {
    power: { siid: 2, piid: 1 },
    mode: { siid: 2, piid: 4 },
    humidity: { siid: 3, piid: 1 },
    pm25: { siid: 3, piid: 4 },
    temperature: { siid: 3, piid: 7 },
    filterLife: { siid: 4, piid: 1 },
    filterLeft: { siid: 4, piid: 4 },
    buzzer: { siid: 6, piid: 1 },
    childLock: { siid: 8, piid: 1 },
    motorRpm: { siid: 9, piid: 1 },
    favoriteLevel: { siid: 9, piid: 11 },
    brightness: { siid: 13, piid: 2 },
};

const MODE_NAMES = ['Auto', 'Sleep', 'Favorite'];
const BRIGHTNESS_NAMES = ['Off', 'Dim', 'On'];

async function getClient() {
    if (!fs.existsSync(CREDS_FILE)) {
        console.error('❌ Credentials not found. Login first.');
        process.exit(1);
    }
    const creds = JSON.parse(fs.readFileSync(CREDS_FILE, 'utf8'));
    
    const supported = ['sg', 'ru', 'us', 'cn'];
    if (!supported.includes(creds.country)) {
        console.log(`⚠️ Country "${creds.country}" might not be directly supported. Falling back to cluster "sg".`);
        creds.country = 'sg';
    }
    
    return new XiaomiMiHome({ credentials: creds });
}

async function findDevice(client, query) {
    const response = await client.miot.request('/v2/home/device_list', { getVirtualModel: false, getHuamiDevices: 0 });
    const homes = await client.getHome();
    
    const devices = response.result.list.filter(d => d.model && (d.model.includes('airp') || d.model.includes('airpurifier')));
    
    const roomMap = {};
    for (const home of homes) {
        if (home.roomlist) {
            home.roomlist.forEach(r => {
                r.dids.forEach(did => { roomMap[did] = r.name; });
            });
        }
    }

    if (!query) {
        const config = fs.existsSync(CONFIG_FILE) ? JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')) : {};
        const defaultDev = devices.find(d => d.did === config.did);
        if (defaultDev) {
            defaultDev.roomName = roomMap[defaultDev.did] || '';
            return defaultDev;
        }
        
        if (devices.length > 1) {
            console.error('⚠️ AMBIGUOUS_DEVICE');
            devices.forEach(d => {
                console.error(`- ${d.did}|${d.name}|${roomMap[d.did] || 'Unknown Room'}`);
            });
            process.exit(2);
        }
        
        const found = devices[0];
        if (found) found.roomName = roomMap[found.did] || '';
        return found;
    }

    const found = devices.find(d => 
        d.did === query || 
        d.name.toLowerCase().includes(query.toLowerCase()) || 
        (roomMap[d.did] && roomMap[d.did].toLowerCase().includes(query.toLowerCase()))
    );
    
    if (found) found.roomName = roomMap[found.did] || '';
    return found;
}

async function runCommand(cmd, query, arg) {
    const client = await getClient();
    const device = await findDevice(client, query);
    
    if (!device) {
        console.error(`❌ Device/Room "${query}" not found.`);
        return;
    }

    const did = device.did;
    const name = device.name;
    const room = device.roomName;

    switch (cmd) {
        case 'status':
        case 'status-full':
            const showAll = cmd === 'status-full';
            const propsToFetch = [
                PROPS.power, PROPS.mode, PROPS.humidity, PROPS.pm25, 
                PROPS.temperature, PROPS.childLock, PROPS.motorRpm, 
                PROPS.favoriteLevel, PROPS.brightness, PROPS.filterLife, PROPS.filterLeft
            ];
            if (showAll) propsToFetch.push(PROPS.buzzer);
            
            const results = await client.miot.request('/miotspec/prop/get', { params: propsToFetch.map(p => ({ did, siid: p.siid, piid: p.piid })) });
            const getValue = (siid, piid) => results.result.find(r => r.siid === siid && r.piid === piid)?.value;

            const pm25 = getValue(3, 4);
            const humidity = getValue(3, 1);
            const filterLife = getValue(4, 1);
            const filterLeft = getValue(4, 4);
            
            let airEmoji = '🟢', airLabel = 'Fresh and clean';
            if (pm25 > 20) { airEmoji = '🟡'; airLabel = 'Low pollution'; }
            if (pm25 > 35) { airEmoji = '🟠'; airLabel = 'Moderate pollution'; }
            if (pm25 > 55) { airEmoji = '🔴'; airLabel = 'High pollution'; }

            let humEmoji = '🟢', humLabel = 'Ideal';
            if (humidity < 40) { humEmoji = '🟡'; humLabel = 'Low'; }
            if (humidity > 60) { humEmoji = '🔴'; humLabel = 'High'; }

            console.log(`🌬️ ${name}${room ? ` (${room})` : ''}\n`);
            console.log(`⚡ Power: ${getValue(2, 1) ? 'ON' : 'OFF'}`);
            console.log(`🎚️ Mode: ${MODE_NAMES[getValue(2, 4)] || getValue(2, 4)}${getValue(2, 4) === 2 ? ` (🌀 ${getValue(9, 11)}/14)` : ''}`);
            console.log(`⚙️ Speed: ${getValue(9, 1) || 0} RPM`);
            console.log(`💡 Brightness: ${BRIGHTNESS_NAMES[getValue(13, 2)] || getValue(13, 2)}`);
            console.log(`🔒 Child Lock: ${getValue(8, 1) ? 'ON' : 'OFF'}\n`);
            console.log(`${airEmoji} PM2.5: ${pm25} μg/m³ — ${airLabel}`);
            console.log(`${humEmoji} Humidity: ${humidity}% — ${humLabel}`);
            console.log(`🌡️ Temp: ${getValue(3, 7)}°C`);
            console.log(`✨ Filter: ${filterLife}% (${filterLeft} days left)`);

            if (filterLife <= 10 || filterLeft <= 30) {
                console.log(`\n⚠️  FILTER ALERT: Please consider replacing the filter soon!`);
            }
            
            if (showAll) {
                console.log(`\n🔔 Notification Sound: ${getValue(6, 1) ? 'ON' : 'OFF'}`);
            }
            break;

        case 'on':
        case 'off':
            const ok = await client.miot.request('/miotspec/prop/set', { params: [{ did, siid: 2, piid: 1, value: cmd === 'on' }] });
            console.log(ok.code === 0 ? `✅ ${name} turned ${cmd.toUpperCase()}` : `❌ Failed to turn ${cmd}`);
            break;

        case 'mode':
            const m = parseInt(arg);
            const mok = await client.miot.request('/miotspec/prop/set', { params: [{ did, siid: 2, piid: 4, value: m }] });
            console.log(mok.code === 0 ? `✅ Mode set to ${MODE_NAMES[m]}` : `❌ Failed`);
            break;
        
        case 'devices':
            const response = await client.miot.request('/v2/home/device_list', { getVirtualModel: false, getHuamiDevices: 0 });
            const homes = await client.getHome();
            const purifiers = response.result.list.filter(d => d.model && (d.model.includes('airp') || d.model.includes('airpurifier')));
            const rMap = {};
            homes.forEach(h => h.roomlist?.forEach(r => r.dids.forEach(d => rMap[d] = r.name)));
            
            console.log('🌬️ Available Air Purifiers\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            purifiers.forEach((d, i) => {
                console.log(`${i + 1}. ${d.name}${rMap[d.did] ? ` (${rMap[d.did]})` : ''}\n   DID: ${d.did} | Online: ${d.isOnline ? 'Yes' : 'No'}\n`);
            });

            if (purifiers.length > 1) {
                console.log('💡 Tip: If you have multiple devices, you can set a default: node purifier.js select <did>');
                console.log('💡 Otherwise, just include the [room] name in your commands.');
            } else if (purifiers.length === 1 && !fs.existsSync(CONFIG_FILE)) {
                fs.writeFileSync(CONFIG_FILE, JSON.stringify({ did: purifiers[0].did, name: purifiers[0].name }, null, 2));
                console.log(`✅ Auto-selected the only device found: ${purifiers[0].name}`);
            } else if (purifiers.length === 1) {
                const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
                console.log(`✅ Default device is set to: ${config.name || config.did}`);
            }
            break;

        case 'select':
            fs.writeFileSync(CONFIG_FILE, JSON.stringify({ did, name }, null, 2));
            console.log(`✅ Default device: ${name}`);
            break;

        case 'buzzer':
            const bval = arg === 'on' || arg === '1' || arg === 'true';
            const bok = await client.miot.request('/miotspec/prop/set', { params: [{ did, siid: 6, piid: 1, value: bval }] });
            console.log(bok.code === 0 ? `✅ Notification Sound ${bval ? 'ON 🔔' : 'OFF 🔕'}` : `❌ Failed`);
            break;

        case 'lock':
            const lval = arg === 'on' || arg === '1' || arg === 'true';
            const lok = await client.miot.request('/miotspec/prop/set', { params: [{ did, siid: 8, piid: 1, value: lval }] });
            console.log(lok.code === 0 ? `✅ Child Lock ${lval ? 'ON 🔒' : 'OFF 🔓'}` : `❌ Failed`);
            break;
    }
}

const [,, cmd, ...args] = process.argv;
let query = '', argVal = '';
if (cmd === 'mode' || cmd === 'level' || cmd === 'brightness' || cmd === 'lock' || cmd === 'buzzer' || cmd === 'select') {
    argVal = args[0];
    query = args.slice(1).join(' ');
} else {
    query = args.join(' ');
}

runCommand(cmd, query, argVal).catch(e => console.error('❌', e.message));
