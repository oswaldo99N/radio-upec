require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const { getAudioUrl } = require('google-tts-api');

const app = express();
app.use(cors());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../admin-panel/dist')));

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --- MONGODB CONNECTION & INITIALIZATION ---
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/radio-upec';

// --- SCHEMAS & MODELS ---

const deviceSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  campus: { type: String, default: '' },
  building: { type: String, default: '' },
  floor: { type: String, default: '' },
  ip: String,
  volume: { type: Number, default: 90 },
  status: { type: String, default: 'offline' },
  is_playing: { type: Boolean, default: false },
  is_muted: { type: Boolean, default: false },
  saved_volume: { type: Number, default: 90 },
  boot_volume: { type: Number, default: 50 },
  is_volume_locked: { type: Boolean, default: false },
  username: { type: String, default: 'pi' },
  last_seen: { type: Date, default: Date.now }
});

const settingSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true },
  value: { type: mongoose.Schema.Types.Mixed } // Can store arrays or strings
});

const Device = mongoose.model('Device', deviceSchema);
const Setting = mongoose.model('Setting', settingSchema);

// Initialize settings if empty
const initSettings = async () => {
  try {
    const keys = ['campuses', 'buildings', 'floors'];
    for (const key of keys) {
      const exists = await Setting.findOne({ key });
      if (!exists) {
        await Setting.create({ key, value: DEFAULT_SETTINGS[key] });
        console.log(`Initialized setting: ${key}`);
      }
    }
  } catch (err) {
    console.error('Error initializing settings:', err);
  }
};

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Initialize settings after successful connection
    await initSettings();

    // Start listening only after DB is ready
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB:', err);
    process.exit(1); // Exit if DB connection fails
  }
};

startServer();

// In-memory map to track active socket connections by device ID
const deviceSockets = new Map();

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // --- SETTINGS EVENTS ---
  socket.on('get_settings', async () => {
    try {
      const campusesDoc = await Setting.findOne({ key: 'campuses' });
      const buildingsDoc = await Setting.findOne({ key: 'buildings' });
      const floorsDoc = await Setting.findOne({ key: 'floors' });

      socket.emit('settings_data', {
        campuses: campusesDoc?.value || [],
        buildings: buildingsDoc?.value || [],
        floors: floorsDoc?.value || []
      });
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  });

  socket.on('update_settings', async ({ type, list }) => {
    console.log(`📝 REQUEST: update_settings for ${type}`, list);
    // type: 'campuses' | 'buildings' | 'floors'
    if (['campuses', 'buildings', 'floors'].includes(type) && Array.isArray(list)) {
      try {
        console.log(`💾 SAVING to MongoDB: ${type}...`);
        const result = await Setting.findOneAndUpdate({ key: type }, { value: list }, { upsert: true, new: true });
        console.log(`✅ SAVED MongoDB: ${type}`, result);

        // Broadcast new settings to all
        const campusesDoc = await Setting.findOne({ key: 'campuses' });
        const buildingsDoc = await Setting.findOne({ key: 'buildings' });
        const floorsDoc = await Setting.findOne({ key: 'floors' });

        io.emit('settings_data', {
          campuses: campusesDoc?.value || [],
          buildings: buildingsDoc?.value || [],
          floors: floorsDoc?.value || []
        });
        console.log(`📡 BROADCAST settings data`);
      } catch (err) {
        console.error('❌ Error updating settings:', err);
      }
    } else {
      console.warn(`⚠️ INVALID update_settings payload:`, { type, list });
    }
  });

  // --- DEVICE EVENTS ---

  socket.on('register_device', async (data) => {
    // data: { id: 'mac-address-or-uuid', ip: '192.168.x.x', name: 'Optional Hostname', username: 'pi' }
    const { id, ip, name, username } = data;
    if (!id) return;

    console.log(`Device registered: ${id} (${name})`);

    try {
      // Check if device exists
      let device = await Device.findOne({ id });

      // Determine final values (preserve existing if available)
      const finalName = device?.name || name || `Device ${id.slice(-4)}`;
      const finalCampus = device?.campus || '';
      const finalBuilding = device?.building || '';
      const finalFloor = device?.floor || '';
      const savedVolume = device?.boot_volume ?? device?.volume ?? 90; // Use boot_volume if exists
      const finalUsername = device?.username || username || 'pi';
      const isVolumeLocked = device?.is_volume_locked || false;

      // Upsert device
      device = await Device.findOneAndUpdate(
        { id },
        {
          name: finalName,
          campus: finalCampus,
          building: finalBuilding,
          floor: finalFloor,
          ip,
          username: finalUsername,
          status: 'online',
          is_playing: true,
          last_seen: new Date()
          // Note: We don't overwrite volume or is_volume_locked here blindly
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // Map socket to device ID
      deviceSockets.set(id, socket);
      socket.data.deviceId = id;

      // Send saved volume to device on connect
      socket.emit('command', { action: 'set_volume', value: savedVolume });
      console.log(`Restored boot volume ${savedVolume}% for device ${id} (Locked: ${isVolumeLocked})`);

      // Broadcast update
      broadcastDevices();
    } catch (err) {
      console.error('Error registering device:', err);
    }
  });

  socket.on('device_status', async (data) => {
    // data: { volume: 50, is_playing: true/false }
    const deviceId = socket.data.deviceId;
    if (!deviceId) return;

    try {
      const device = await Device.findOne({ id: deviceId });
      if (!device) return;

      const isPlayingBool = !!data.is_playing;

      if (device.is_volume_locked) {
        // Locked Mode
        await Device.updateOne({ id: deviceId }, { is_playing: isPlayingBool });

        if (!device.is_muted) {
          if (data.volume !== undefined && Math.abs(data.volume - device.boot_volume) > 2) {
            console.log(`📡 Device ${deviceId} reported volume ${data.volume}% but is LOCKED at ${device.boot_volume}% (and NOT Muted). Enforcing...`);
            socket.emit('command', { action: 'set_volume', value: device.boot_volume });
          }
        }
      } else {
        // Unlocked Mode
        const update = { is_playing: isPlayingBool };
        if (data.volume !== undefined) {
          update.volume = data.volume;
        }
        await Device.updateOne({ id: deviceId }, update);
      }

      // Broadcast update (fetch fresh to get latest state)
      const updatedDevice = await Device.findOne({ id: deviceId });
      io.emit('device_updated', updatedDevice);
    } catch (err) {
      console.error('Error updating device status:', err);
    }
  });

  socket.on('toggle_mute', async (deviceId) => {
    try {
      const device = await Device.findOne({ id: deviceId });
      if (!device) return;

      const devSocket = deviceSockets.get(deviceId);

      if (device.is_muted) {
        // Unmute
        const restoreVol = device.saved_volume || 90;
        await Device.updateOne({ id: deviceId }, { is_muted: false, volume: restoreVol });
        if (devSocket) {
          devSocket.emit('command', { action: 'set_volume', value: restoreVol });
        }
      } else {
        // Mute
        await Device.updateOne({ id: deviceId }, { is_muted: true, saved_volume: device.volume, volume: 0 });
        if (devSocket) {
          devSocket.emit('command', { action: 'set_volume', value: 0 });
        }
      }
      broadcastDevices();
    } catch (err) {
      console.error('Error toggling mute:', err);
    }
  });

  socket.on('global_mute_toggle', async () => {
    try {
      // Check if ANY device is currently unmuted
      const unmutedCount = await Device.countDocuments({ $or: [{ is_muted: false }, { is_muted: null }] });
      const shouldMuteAll = unmutedCount > 0;

      console.log(`Global Mute Request. Unmuted count: ${unmutedCount}. Action: ${shouldMuteAll ? 'MUTE ALL' : 'UNMUTE ALL'}`);

      const allDevices = await Device.find({});

      for (const dev of allDevices) {
        const devSocket = deviceSockets.get(dev.id);

        if (shouldMuteAll) {
          // MUTE ALL
          const currentVol = dev.volume || 0;
          const volToSave = currentVol > 0 ? currentVol : (dev.saved_volume || 90);

          await Device.updateOne({ id: dev.id }, { is_muted: true, saved_volume: volToSave, volume: 0 });
          if (devSocket) devSocket.emit('command', { action: 'set_volume', value: 0 });

        } else {
          // UNMUTE ALL
          const restoreVol = dev.saved_volume || 90;
          await Device.updateOne({ id: dev.id }, { is_muted: false, volume: restoreVol });
          if (devSocket) devSocket.emit('command', { action: 'set_volume', value: restoreVol });
        }
      }

      broadcastDevices();
    } catch (err) {
      console.error("Error in global_mute_toggle:", err);
    }
  });

  // --- ADMIN EVENTS ---

  socket.on('get_devices', async () => {
    broadcastDevices();
  });

  socket.on('rename_device', async (data) => {
    const { id, name, campus, building, floor, username } = data;
    try {
      const update = {};
      if (name) update.name = name;
      if (campus) update.campus = campus;
      if (building) update.building = building;
      if (floor) update.floor = floor;
      if (username !== undefined) update.username = username;

      await Device.updateOne({ id }, update);
      broadcastDevices();
    } catch (err) {
      console.error('Error renaming device:', err);
    }
  });

  socket.on('save_volume', async (data) => {
    const { id, volume } = data;
    if (id && volume !== undefined) {
      try {
        await Device.updateOne({ id }, { boot_volume: volume, volume: volume, is_volume_locked: true });

        const devSocket = deviceSockets.get(id);
        if (devSocket) {
          devSocket.emit('command', { action: 'set_volume', value: volume });
        }

        broadcastDevices();
        console.log(`Boot volume saved and LOCKED for device ${id}: ${volume}%`);
      } catch (err) {
        console.error('Error saving volume:', err);
      }
    }
  });

  socket.on('unlock_volume', async (id) => {
    if (id) {
      try {
        await Device.updateOne({ id }, { is_volume_locked: false });
        broadcastDevices();
        console.log(`Volume UNLOCKED for device ${id}`);
      } catch (err) {
        console.error('Error unlocking volume:', err);
      }
    }
  });

  socket.on('announce', async (data) => {
    // data: { text: "Mensaje", target: "all" | id, volume: 150 }
    const { text, target, volume } = data;
    if (!text) return;

    console.log(`ANNOUNCEMENT: ${text} -> ${target} (Vol: ${volume || 'Default'})`);

    const url = getAudioUrl(text, {
      lang: 'es-US',
      slow: false,
      host: 'https://translate.google.com',
    });

    const payload = { action: 'announce', value: url, volume: volume };

    if (target === 'all') {
      for (const [id, devSocket] of deviceSockets) {
        devSocket.emit('command', payload);
      }
    } else if (target === 'filtered' && data.filters) {
      // Filtered Announcement
      const { campus, building, floor } = data.filters;
      const query = {};

      if (campus && campus !== 'Todos') query.campus = campus;
      if (building && building !== 'Todos') query.building = building;
      if (floor && floor !== 'Todos') query.floor = floor;

      try {
        const matchingDevices = await Device.find(query);
        console.log(`ANNOUNCING to FILTERED group: ${matchingDevices.length} devices found.`);

        for (const dev of matchingDevices) {
          const devSocket = deviceSockets.get(dev.id);
          if (devSocket) {
            devSocket.emit('command', payload);
          }
        }
      } catch (err) {
        console.error('Error fetching filtered devices:', err);
      }
    } else {
      const devSocket = deviceSockets.get(target);
      if (devSocket) {
        devSocket.emit('command', payload);
      }
    }
  });

  socket.on('command', ({ target, action, value }) => {
    console.log(`Admin command: ${action} -> ${target}`);
    const payload = { action, value };

    if (target === 'all') {
      for (const [id, devSocket] of deviceSockets) {
        devSocket.emit('command', payload);
      }
    } else {
      const devSocket = deviceSockets.get(target);
      if (devSocket) {
        devSocket.emit('command', payload);
      }
    }
  });

  socket.on('disconnect', async () => {
    const deviceId = socket.data.deviceId;
    if (deviceId) {
      console.log(`Device disconnected: ${deviceId}`);
      deviceSockets.delete(deviceId);

      // Update DB status to offline
      try {
        await Device.updateOne({ id: deviceId }, { status: 'offline', is_playing: false });
        broadcastDevices();
      } catch (err) {
        console.error('Error handling disconnect:', err);
      }
    }
  });
});

async function broadcastDevices() {
  try {
    const devices = await Device.find({});
    io.emit('devices_list', devices);
  } catch (err) {
    console.error('Error broadcasting devices:', err);
  }
}

// Catch-all handler for React (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin-panel/dist/index.html'));
});


