import { useState, useEffect } from 'react';
import io from 'socket.io-client';
import { Play, Square, Volume2, VolumeX, Edit2, Radio, Activity, Save, Wifi, WifiOff, Settings, Mic, Lock, Unlock } from 'lucide-react';

// Connect to server (adjust URL if deployed elsewhere)
const socket = io('http://localhost:3000');

const SettingsModal = ({ isOpen, onClose, settings, updateSettings }) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('campuses');
  const [newValue, setNewValue] = useState('');

  const getList = () => settings[activeTab] || [];

  const handleAdd = () => {
    if (newValue.trim()) {
      const list = getList();
      if (!list.includes(newValue.trim())) {
        updateSettings(activeTab, [...list, newValue.trim()]);
      }
      setNewValue('');
    }
  };

  const handleDelete = (val) => {
    const list = getList().filter(v => v !== val);
    updateSettings(activeTab, list);
  };

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.8)', zIndex: 1000,
      display: 'flex', justifyContent: 'center', alignItems: 'center'
    }}>
      <div className="glass-panel" style={{ width: '500px', maxWidth: '90%', padding: '2rem', maxHeight: '80vh', display: 'flex', flexDirection: 'column', background: '#181820' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings size={20} /> Gestionar Listas
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.5rem', cursor: 'pointer' }}>×</button>
        </div>

        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', borderBottom: '1px solid #333' }}>
          {['campuses', 'buildings', 'floors'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: 'none', border: 'none', padding: '10px',
                color: activeTab === tab ? 'var(--primary)' : 'var(--text-muted)',
                borderBottom: activeTab === tab ? '2px solid var(--primary)' : 'none',
                cursor: 'pointer', fontWeight: 'bold', textTransform: 'capitalize'
              }}
            >
              {tab === 'campuses' ? 'Campus' : tab === 'buildings' ? 'Edificios' : 'Pisos'}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '1rem' }}>
          <input
            className="volume-input"
            style={{ flex: 1, textAlign: 'left', background: 'rgba(255,255,255,0.05)' }}
            placeholder={`Agregar nuevo...`}
            value={newValue}
            onChange={(e) => setNewValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button className="btn-primary" onClick={handleAdd} style={{ padding: '0.5rem 1rem' }}>Agregar</button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5px', minHeight: '200px' }}>
          {getList().map(item => (
            <div key={item} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
              <span>{item}</span>
              <button
                onClick={() => handleDelete(item)}
                style={{ background: 'none', border: 'none', color: 'var(--danger)', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ELIMINAR
              </button>
            </div>
          ))}
          {getList().length === 0 && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>Lista vacía</div>}
        </div>
      </div>
    </div>
  );
};

const DeviceCard = ({ device, sendCommand, startEditing, editingId, editName, setEditName, editCampus, setEditCampus, editBuilding, setEditBuilding, editFloor, setEditFloor, editUsername, setEditUsername, saveName, settings }) => {
  const [localVolume, setLocalVolume] = useState(device.volume || 40);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!isDragging) {
      setLocalVolume(device.volume || 40);
    }
  }, [device.volume, isDragging]);

  const handleVolumeChange = (e) => {
    const newVal = parseInt(e.target.value, 10);
    setLocalVolume(newVal);
    sendCommand(device.id, 'set_volume', newVal);
  };

  const handleSaveVolume = () => {
    socket.emit('save_volume', { id: device.id, volume: localVolume });
  };

  // Safe access to lists
  const campuses = settings?.campuses || [];
  const buildings = settings?.buildings || [];
  const floors = settings?.floors || [];

  return (
    <div className={`device-card glass-panel`}>
      <div className="device-info">
        <div className="device-status-row">
          <div className={`status-indicator ${device.status === 'online' ? 'dot-online' : 'dot-offline'}`}></div>
          <span style={{ fontSize: '0.8rem', color: device.status === 'online' ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
            {device.status === 'online' ? 'EN LÍNEA' : 'OFFLINE'}
          </span>
          {device.status === 'online' && device.is_playing && (
            <div className="tag-on-air">
              <Activity size={10} /> AL AIRE
            </div>
          )}
        </div>

        <div className="device-name">
          {editingId === device.id ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <input
                autoFocus
                className="volume-input"
                style={{ width: '200px', textAlign: 'left', background: 'rgba(0,0,0,0.5)', border: '1px solid #444', padding: '5px' }}
                placeholder="Nombre (Ej. Pasillo 1)"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
              <div style={{ display: 'flex', gap: '5px' }}>
                <select
                  className="volume-input"
                  style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #444', padding: '5px' }}
                  value={editCampus}
                  onChange={(e) => setEditCampus(e.target.value)}
                >
                  <option value="" disabled>Campus</option>
                  {campuses.map(o => <option key={o} value={o}>{o}</option>)}
                </select>

                <select
                  className="volume-input"
                  style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #444', padding: '5px' }}
                  value={editBuilding}
                  onChange={(e) => setEditBuilding(e.target.value)}
                >
                  <option value="" disabled>Edificio</option>
                  {buildings.map(o => <option key={o} value={o}>{o}</option>)}
                </select>

                <select
                  className="volume-input"
                  style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #444', padding: '5px' }}
                  value={editFloor}
                  onChange={(e) => setEditFloor(e.target.value)}
                >
                  <option value="" disabled>Piso</option>
                  {floors.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: '5px' }}>
                <input
                  className="volume-input"
                  style={{ flex: 1, textAlign: 'left', fontSize: '0.8rem', background: 'rgba(0,0,0,0.5)', border: '1px solid #444', padding: '5px' }}
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  placeholder="Usuario (ej: pi)"
                />
              </div>
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button className="btn-primary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => saveName(device.id)}>Guardar</button>
                <button className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => startEditing(null)}>Cancelar</button>
              </div>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div>
                <div>{device.name}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal', display: 'flex', gap: '5px' }}>
                  <span style={{ color: 'var(--primary)', opacity: 0.9 }}>{device.campus || 'Sin Campus'}</span>
                  <span style={{ opacity: 0.5 }}>›</span>
                  <span style={{ color: '#fff', opacity: 0.8 }}>{device.building || 'General'}</span>
                  <span style={{ opacity: 0.5 }}>›</span>
                  <span style={{ color: 'var(--text-muted)' }}>{device.floor || 'Sin Piso'}</span>
                </div>
              </div>
              <button style={{ opacity: 0.5, cursor: 'pointer', background: 'none', border: 'none', color: '#fff' }} onClick={() => startEditing(device)}>
                <Edit2 size={14} />
              </button>
            </div>
          )}
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'monospace' }}>
          Usuario: {device.username || 'pi'}@{device.ip}
        </div>
      </div>

      <div className="controls-area">
        <div className="slider-group">
          <button
            className="btn-ghost"
            style={{ padding: '5px', color: device.is_muted ? 'var(--danger)' : 'var(--text-muted)' }}
            onClick={() => socket.emit('toggle_mute', device.id)}
            title={device.is_muted ? "Activar Sonido" : "Silenciar"}
          >
            {device.is_muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min="0"
            max="500"
            disabled={device.is_muted || device.is_volume_locked}
            value={device.is_muted ? 0 : localVolume}
            onChange={handleVolumeChange}
            onMouseDown={() => setIsDragging(true)}
            onMouseUp={() => setIsDragging(false)}
            onTouchStart={() => setIsDragging(true)}
            onTouchEnd={() => setIsDragging(false)}
            style={{ opacity: (device.is_muted || device.is_volume_locked) ? 0.5 : 1, cursor: device.is_volume_locked ? 'not-allowed' : 'pointer' }}
          />
          <span style={{ width: '35px', textAlign: 'right', fontSize: '0.9rem', fontWeight: 'bold', color: device.is_muted ? 'var(--danger)' : 'inherit' }}>
            {device.is_muted ? 'MUTE' : `${localVolume}%`}
          </span>
        </div>

        <div style={{ display: 'flex', gap: '5px', alignItems: 'center', marginTop: '8px' }}>
          <input
            className="volume-input"
            type="number"
            min="0"
            max="500"
            value={localVolume}
            disabled={device.is_volume_locked}
            onChange={(e) => setLocalVolume(parseInt(e.target.value, 10) || 0)}
            style={{
              width: '60px',
              textAlign: 'center',
              padding: '4px',
              fontSize: '0.85rem',
              opacity: device.is_volume_locked ? 0.5 : 1,
              cursor: device.is_volume_locked ? 'not-allowed' : 'text'
            }}
          />
          {device.is_volume_locked ? (
            <button
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--danger)', borderColor: 'var(--danger)' }}
              onClick={() => socket.emit('unlock_volume', device.id)}
              title="Desbloquear control de volumen"
            >
              <Unlock size={14} /> DESBLOQUEAR
            </button>
          ) : (
            <button
              className="btn-primary"
              style={{ padding: '4px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }}
              onClick={handleSaveVolume}
              title="Guardar y Bloquear volumen"
            >
              <Lock size={14} /> GUARDAR
            </button>
          )}
        </div>

        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
          <button className="btn-circle btn-play" onClick={() => sendCommand(device.id, 'play')} title="Reproducir"><Play size={20} fill="currentColor" /></button>
          <button className="btn-circle btn-stop" onClick={() => sendCommand(device.id, 'stop')} title="Detener"><Square size={20} fill="currentColor" /></button>
        </div>
      </div>
    </div>
  );
};

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginCode, setLoginCode] = useState('');
  const [loginError, setLoginError] = useState('');

  const [devices, setDevices] = useState([]);
  const [settings, setSettings] = useState({ campuses: [], buildings: [], floors: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Edit State
  const [editName, setEditName] = useState('');
  const [editCampus, setEditCampus] = useState('');
  const [editBuilding, setEditBuilding] = useState('');
  const [editFloor, setEditFloor] = useState('');
  const [editUsername, setEditUsername] = useState('');

  // Filter State
  const [filterCampus, setFilterCampus] = useState('Todos');
  const [filterBuilding, setFilterBuilding] = useState('Todos');
  const [filterFloor, setFilterFloor] = useState('Todos');

  const [globalVolume, setGlobalVolume] = useState(30);

  // Announcement State
  const [announceVolume, setAnnounceVolume] = useState(150);
  const [announceText, setAnnounceText] = useState('');
  const [isAnnouncing, setIsAnnouncing] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('radio_upec_auth');
    if (savedAuth === 'authenticated') {
      setIsAuthenticated(true);
    }
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    const correctCode = 'qwerty12N@';

    if (loginCode === correctCode) {
      setIsAuthenticated(true);
      localStorage.setItem('radio_upec_auth', 'authenticated');
      setLoginError('');
      setLoginCode('');
    } else {
      setLoginError('Código incorrecto');
      setLoginCode('');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('radio_upec_auth');
  };

  useEffect(() => {
    if (!isAuthenticated) return; // Don't connect if not authenticated

    socket.emit('get_devices');
    socket.emit('get_settings');

    socket.on('devices_list', setDevices);
    socket.on('device_updated', (updatedDevice) => {
      setDevices((prev) =>
        prev.map(d => d.id === updatedDevice.id ? { ...d, ...updatedDevice } : d)
      );
    });
    socket.on('settings_data', setSettings);

    return () => {
      socket.off('devices_list');
      socket.off('device_updated');
      socket.off('settings_data');
    };
  }, [isAuthenticated]);

  const updateSettings = (type, list) => {
    socket.emit('update_settings', { type, list });
  };

  const sendCommand = (target, action, value = null) => {
    if (action === 'set_volume' && target !== 'all') {
      setDevices(prev => prev.map(d => d.id === target ? { ...d, volume: value } : d));
    }
    socket.emit('command', { target, action, value });
  };

  const startEditing = (device) => {
    if (!device) {
      setEditingId(null);
      return;
    }
    setEditingId(device.id);
    setEditName(device.name);
    // Set defaults if empty
    setEditCampus(device.campus || settings.campuses[0] || '');
    setEditBuilding(device.building || settings.buildings[0] || '');
    setEditFloor(device.floor || settings.floors[0] || '');
    setEditUsername(device.username || 'pi');
  };

  const saveName = (id) => {
    socket.emit('rename_device', {
      id,
      name: editName,
      campus: editCampus,
      building: editBuilding,
      floor: editFloor,
      username: editUsername
    });
    setEditingId(null);
  };

  const applyGlobalVolume = () => {
    setDevices(prev => prev.map(d => ({ ...d, volume: globalVolume })));
    sendCommand('all', 'set_volume', globalVolume);
  };

  const globalPlay = () => sendCommand('all', 'play');
  const globalStop = () => sendCommand('all', 'stop');

  const handleAnnounce = () => {
    if (!announceText.trim()) return;
    setIsAnnouncing(true);

    // Determine target based on filters
    let target = 'all';
    let filters = null;

    if (filterCampus !== 'Todos' || filterBuilding !== 'Todos' || filterFloor !== 'Todos') {
      target = 'filtered';
      filters = {
        campus: filterCampus,
        building: filterBuilding,
        floor: filterFloor
      };
    }

    socket.emit('announce', {
      text: announceText,
      target,
      volume: announceVolume,
      filters
    });

    // Clear after delay
    setTimeout(() => {
      setAnnounceText('');
      setIsAnnouncing(false);
    }, 2000);
  };

  // Filter Logic: Combine settings options with actual device values
  const deviceCampuses = [...new Set(devices.map(d => d.campus || '').filter(v => v))];
  const deviceBuildings = [...new Set(devices.map(d => d.building || '').filter(v => v))];
  const deviceFloors = [...new Set(devices.map(d => d.floor || '').filter(v => v))];

  const uniqueCampuses = ['Todos', ...new Set([...(settings.campuses || []), ...deviceCampuses])];
  const uniqueBuildings = ['Todos', ...new Set([...(settings.buildings || []), ...deviceBuildings])];
  const uniqueFloors = ['Todos', ...new Set([...(settings.floors || []), ...deviceFloors])];

  // Filtering Logic
  const filteredDevices = devices.filter(d => {
    // Normalize device values
    const deviceCampus = d.campus || '';
    const deviceBuilding = d.building || '';
    const deviceFloor = d.floor || '';

    // Check campus filter
    if (filterCampus !== 'Todos' && deviceCampus !== filterCampus) return false;

    // Check building filter
    if (filterBuilding !== 'Todos' && deviceBuilding !== filterBuilding) return false;

    // Check floor filter
    if (filterFloor !== 'Todos' && deviceFloor !== filterFloor) return false;

    return true;
  });

  // Group devices by Campus - Building
  const groupedDevices = filteredDevices.reduce((acc, device) => {
    const groupKey = `${device.campus || 'Sin Campus'} - ${device.building || 'General'}`;
    if (!acc[groupKey]) acc[groupKey] = [];
    acc[groupKey].push(device);
    return acc;
  }, {});

  const sortedGroups = Object.keys(groupedDevices).sort();

  // Show login screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0a0a0f 0%, #1a1a2e 100%)'
      }}>
        <div className="glass-panel" style={{
          width: '400px',
          maxWidth: '90%',
          padding: '3rem 2rem',
          textAlign: 'center'
        }}>
          <Radio size={64} color="var(--primary)" style={{ marginBottom: '1rem' }} />
          <h1 style={{ marginBottom: '0.5rem', fontSize: '2rem' }}>
            Radio UPEC <span style={{ color: 'var(--primary)' }}>Admin</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
            Ingresa el código de acceso
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <input
              type="password"
              className="volume-input"
              placeholder="Código de acceso"
              value={loginCode}
              onChange={(e) => setLoginCode(e.target.value)}
              style={{
                width: '100%',
                padding: '1rem',
                fontSize: '1rem',
                textAlign: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: loginError ? '1px solid var(--danger)' : '1px solid rgba(255,255,255,0.1)'
              }}
              autoFocus
            />

            {loginError && (
              <p style={{ color: 'var(--danger)', fontSize: '0.9rem', margin: 0 }}>
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className="btn-primary"
              style={{ width: '100%', padding: '1rem', fontSize: '1rem' }}
            >
              INGRESAR
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div>
      <SettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        updateSettings={updateSettings}
      />

      <header className="header" style={{ flexDirection: 'column', gap: '1rem', padding: '1rem 2rem' }}>
        {/* Top Row: Logo + Settings */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="logo">
            <Radio size={32} color="var(--primary)" />
            <span>Radio UPEC <span style={{ color: 'var(--primary)' }}>Administrador</span></span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="button-base btn-ghost" onClick={() => setShowSettings(true)} style={{ padding: '0.6rem 1.2rem' }}>
              <Settings size={16} style={{ marginRight: 6 }} /> CONFIGURAR
            </button>
            <button className="button-base btn-danger-ghost" onClick={handleLogout} style={{ padding: '0.6rem 1.2rem' }}>
              <VolumeX size={16} style={{ marginRight: 6 }} /> CERRAR SESIÓN
            </button>
          </div>
        </div>

        {/* Bottom Row: Control Panels */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Playback Controls */}
          <div style={{ display: 'flex', gap: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button className="button-base btn-ghost" style={{ color: 'var(--success)', borderColor: 'var(--success)', padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={globalPlay}>
              <Play size={14} fill="currentColor" style={{ marginRight: 6 }} /> JUGAR TODO
            </button>
            <button className="button-base btn-danger-ghost" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={globalStop}>
              <Square size={14} fill="currentColor" style={{ marginRight: 6 }} /> DETENER TODO
            </button>
          </div>

          {/* Volume Control */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', padding: '0.5rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>VOLUMEN GLOBAL</span>
            <input
              className="volume-input"
              type="number"
              min="0"
              max="500"
              value={globalVolume}
              onChange={(e) => setGlobalVolume(parseInt(e.target.value))}
              style={{ width: '60px', padding: '0.4rem', fontSize: '0.85rem' }}
            />
            <button className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }} onClick={applyGlobalVolume}>
              APLICAR
            </button>
          </div>

          {/* Mute Control */}
          <div style={{ display: 'flex', padding: '0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              className="button-base btn-outline"
              style={{
                borderColor: devices.length > 0 && devices.every(d => d.is_muted) ? 'var(--success)' : 'var(--danger)',
                color: devices.length > 0 && devices.every(d => d.is_muted) ? 'var(--success)' : 'var(--danger)',
                padding: '0.5rem 1rem',
                fontSize: '0.85rem'
              }}
              onClick={() => socket.emit('global_mute_toggle')}
            >
              {devices.length > 0 && devices.every(d => d.is_muted) ? (
                <>
                  <Volume2 size={14} style={{ marginRight: 6 }} /> RESTAURAR SONIDO
                </>
              ) : (
                <>
                  <VolumeX size={14} style={{ marginRight: 6 }} /> TODO SILENCIAR
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MEGAFONÍA BAR */}
      <div className="glass-panel" style={{ margin: '0 0 2rem 0', padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', border: '1px solid var(--primary)', background: 'rgba(239, 68, 68, 0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--primary)', fontWeight: 'bold', minWidth: '140px' }}>
          <Mic size={24} />
          MEGAFONÍA
        </div>

        {/* Volume Slider for Announce */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginRight: '10px' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vol: {announceVolume}%</span>
          <input
            type="range"
            min="0"
            max="500"
            step="10"
            value={announceVolume}
            onChange={(e) => setAnnounceVolume(parseInt(e.target.value))}
            style={{ width: '100px', accentColor: 'var(--primary)' }}
          />
        </div>

        <input
          style={{ flex: 1, padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid #444', color: 'white', borderRadius: '4px' }}
          placeholder={`Escribe un anuncio para transmitir en ${filterCampus !== 'Todos' || filterBuilding !== 'Todos' || filterFloor !== 'Todos' ? filteredDevices.length + ' DISPOSITIVOS FILTRADOS' : 'TODOS los dispositivos'}...`}
          value={announceText}
          onChange={(e) => setAnnounceText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAnnounce()}
        />
        <button
          className="btn-primary"
          style={{ padding: '0.8rem 1.5rem', display: 'flex', alignItems: 'center', gap: '8px', opacity: isAnnouncing ? 0.7 : 1 }}
          onClick={handleAnnounce}
          disabled={isAnnouncing}
        >
          {isAnnouncing ? 'TRANSMITIENDO...' : 'ANUNCIAR'}
        </button>
      </div>

      {/* FILTER BAR */}
      <div className="glass-panel" style={{ padding: '1rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <span style={{ fontWeight: 'bold', color: 'var(--primary)', fontSize: '0.9rem' }}>FILTRAR POR:</span>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>CAMPUS</span>
          <select value={filterCampus} onChange={e => { setFilterCampus(e.target.value); setFilterBuilding('Todos'); setFilterFloor('Todos'); }} style={{ background: 'var(--bg-input)', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px' }}>
            {uniqueCampuses.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>EDIFICIO</span>
          <select value={filterBuilding} onChange={e => { setFilterBuilding(e.target.value); setFilterFloor('Todos'); }} style={{ background: 'var(--bg-input)', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px' }}>
            {uniqueBuildings.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>PISO</span>
          <select value={filterFloor} onChange={e => setFilterFloor(e.target.value)} style={{ background: 'var(--bg-input)', color: '#fff', border: 'none', padding: '5px', borderRadius: '4px' }}>
            {uniqueFloors.map(f => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>

        <div style={{ marginLeft: 'auto', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          Mostrando {filteredDevices.length} de {devices.length}
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-label">Dispositivos</div>
          <div className="stat-value">{devices.length}</div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label" style={{ color: 'var(--success)' }}>En Línea</div>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {devices.filter(d => d.status === 'online').length}
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label" style={{ color: 'var(--primary)' }}>Al Aire</div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {devices.filter(d => d.status === 'online' && d.is_playing).length}
          </div>
        </div>
        <div className="stat-card glass-panel">
          <div className="stat-label" style={{ color: 'var(--danger)' }}>En Silencio</div>
          <div className="stat-value" style={{ color: 'var(--danger)' }}>
            {devices.filter(d => d.status === 'online' && (d.is_muted || d.volume === 0)).length}
          </div>
        </div>
      </div>

      <div className="device-list">
        {sortedGroups.map(group => (
          <div key={group} style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem', color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1px', fontSize: '0.9rem' }}>{group}</h3>
            {groupedDevices[group].map((device) => (
              <DeviceCard
                key={device.id}
                device={device}
                sendCommand={sendCommand}
                startEditing={startEditing}
                editingId={editingId}
                editName={editName}
                setEditName={setEditName}
                editCampus={editCampus} setEditCampus={setEditCampus}
                editBuilding={editBuilding} setEditBuilding={setEditBuilding}
                editFloor={editFloor} setEditFloor={setEditFloor}
                saveName={saveName}
                settings={settings}
              />
            ))}
          </div>
        ))}

        {filteredDevices.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)', fontStyle: 'italic', background: 'rgba(255,255,255,0.02)', borderRadius: '12px' }}>
            <p>No se encontraron dispositivos con estos filtros.</p>
          </div>
        )}
      </div>
    </div >
  );
}

export default App;
