/**
 * Звук и музика, генерирани изцяло с Web Audio API – без външни файлове.
 * Музиката е секвенсер с планиране напред (lookahead), а ефектите са кратки синтезирани звуци.
 */

const NOTE_INDEX = { C: 0, 'C#': 1, Db: 1, D: 2, 'D#': 3, Eb: 3, E: 4, F: 5, 'F#': 6, Gb: 6, G: 7, 'G#': 8, Ab: 8, A: 9, 'A#': 10, Bb: 10, B: 11 };

function freq(note) {
  if (!note || note === 'R') return 0;
  const m = /^([A-G][#b]?)(\d)$/.exec(note);
  if (!m) return 0;
  const midi = NOTE_INDEX[m[1]] + (parseInt(m[2], 10) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

const parse = (str) =>
  str
    .trim()
    .split(/\s+/)
    .map((tok) => {
      const [n, d] = tok.split(':');
      return [n, parseFloat(d || '1')];
    });

const SONGS = {
  jingle: {
    tempo: 132,
    wave: 'triangle',
    bell: true,
    melody: parse(`
      E5 E5 E5:2 E5 E5 E5:2 E5 G5 C5:1.5 D5:0.5 E5:4
      F5 F5 F5:1.5 F5:0.5 F5 E5 E5 E5:0.5 E5:0.5 E5 D5 D5 E5 D5:2 G5:2
      E5 E5 E5:2 E5 E5 E5:2 E5 G5 C5:1.5 D5:0.5 E5:4
      F5 F5 F5:1.5 F5:0.5 F5 E5 E5 E5:0.5 E5:0.5 G5 G5 F5 D5 C5:4`),
    bass: 'C3 C3 C3 C3 F3 C3 D3 G3 C3 C3 C3 C3 F3 C3 G3 C3',
    beatsPerBar: 4,
  },
  wish: {
    tempo: 150,
    wave: 'square',
    bell: true,
    melody: parse(`
      R:2 G4 C5 C5:0.5 D5:0.5 C5:0.5 B4:0.5 A4 A4 A4 D5 D5:0.5 E5:0.5 D5:0.5 C5:0.5
      B4 G4 G4 E5 E5:0.5 F5:0.5 E5:0.5 D5:0.5 C5 A4 G4:0.5 G4:0.5 A4 D5 B4 C5:2 R`),
    bass: 'C3 C3 F3 F3 D3 G3 G3 E3 A3 F3 G3 C3',
    beatsPerBar: 3,
  },
  deck: {
    tempo: 140,
    wave: 'triangle',
    bell: false,
    melody: parse(`
      G5:1.5 F5:0.5 E5 D5 C5 D5 E5 C5 D5:0.5 E5:0.5 F5:0.5 D5:0.5 E5:1.5 D5:0.5 C5 B4 C5:2
      G5:1.5 F5:0.5 E5 D5 C5 D5 E5 C5 D5:0.5 E5:0.5 F5:0.5 D5:0.5 E5:1.5 D5:0.5 C5 B4 C5:2
      D5:1.5 E5:0.5 F5 D5 E5:1.5 F5:0.5 G5 D5 E5:0.5 F#5:0.5 G5 A5:0.5 B5:0.5 C6 B5 A5 G5:2`),
    bass: 'C3 C3 G3 C3 C3 C3 G3 C3 G3 C3 D3 G3',
    beatsPerBar: 4,
  },
  tree: {
    tempo: 92,
    wave: 'sine',
    bell: true,
    melody: parse(`
      D4 G4:0.75 G4:0.25 G4:1.5 A4:0.5 B4:0.75 B4:0.25 B4:1.5 B4:0.5 A4:0.5 B4:0.5 C5 F#4 A4 G4:2 R
      D5 D5:0.5 B4:0.5 E5:1.5 D5:0.5 D5:0.5 C5:0.5 C5:1.5 C5:0.5 C5:0.5 A4:0.5 D5:1.5 C5:0.5 C5:0.5 B4:0.5 B4:2 R`),
    bass: 'G2 G2 G2 D3 G2 G2 C3 G2 E3 D3 A2 G2',
    beatsPerBar: 3,
  },
  carol: {
    tempo: 168,
    wave: 'square',
    bell: true,
    melody: parse(`
      Bb4 A4:0.5 Bb4:0.5 G4 Bb4 A4:0.5 Bb4:0.5 G4 Bb4 A4:0.5 Bb4:0.5 G4 Bb4 A4:0.5 Bb4:0.5 G4
      D5 C5:0.5 D5:0.5 Bb4 D5 C5:0.5 D5:0.5 Bb4 D5 C5:0.5 D5:0.5 Bb4 D5 C5:0.5 D5:0.5 Bb4
      G5 G5:0.5 G5:0.5 F5:0.5 Eb5:0.5 D5 D5:0.5 D5:0.5 C5:0.5 Bb4:0.5 C5 C5:0.5 C5:0.5 D5:0.5 C5:0.5 G4:3`),
    bass: 'G2 G2 G2 G2 G2 G2 G2 G2 Eb3 D3 C3 G2',
    beatsPerBar: 3,
  },
};

export const LEVEL_SONGS = { menu: 'jingle', 1: 'jingle', 2: 'wish', 3: 'deck', 4: 'tree', 5: 'carol', 6: 'deck', victory: 'wish' };

class AudioManager {
  constructor() {
    this.ctx = null;
    this.settings = { music: true, sfx: true, musicVolume: 0.5, sfxVolume: 0.7 };
    this.currentSong = null;
    this.timer = null;
    this.noiseBuffer = null;
  }

  /** Аудиото може да се стартира само след действие на потребителя. */
  unlock() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain();
      this.master.connect(this.ctx.destination);
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.applyVolumes();
      const len = this.ctx.sampleRate;
      this.noiseBuffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      if (this.pendingSong) {
        const s = this.pendingSong;
        this.pendingSong = null;
        this.playMusic(s);
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
  }

  setSettings(s) {
    const wasMusic = this.settings.music;
    this.settings = { ...this.settings, ...s };
    this.applyVolumes();
    if (!this.settings.music && this.timer) this.stopScheduler();
    if (this.settings.music && !wasMusic && this.currentSong) {
      const song = this.currentSong;
      this.currentSong = null;
      this.playMusic(song);
    }
  }

  applyVolumes() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.musicGain.gain.setTargetAtTime(this.settings.music ? this.settings.musicVolume * 0.32 : 0, now, 0.05);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx ? this.settings.sfxVolume * 0.6 : 0, now, 0.02);
  }

  /* ----------------------------- музика ----------------------------- */

  playMusic(name) {
    if (!this.ctx) {
      this.pendingSong = name;
      return;
    }
    if (this.currentSong === name && this.timer) return;
    this.stopScheduler();
    this.currentSong = name;
    if (!this.settings.music) return;
    const song = SONGS[name];
    if (!song) return;
    this.song = song;
    this.noteIndex = 0;
    this.bassIndex = 0;
    this.beat = 0;
    this.nextNoteTime = this.ctx.currentTime + 0.1;
    this.nextBassTime = this.nextNoteTime;
    this.bass = song.bass.split(/\s+/);
    this.timer = setInterval(() => this.schedule(), 40);
  }

  stopMusic() {
    this.stopScheduler();
    this.currentSong = null;
  }

  stopScheduler() {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  schedule() {
    if (!this.ctx || !this.song) return;
    const spb = 60 / this.song.tempo;
    const ahead = this.ctx.currentTime + 0.25;
    while (this.nextNoteTime < ahead) {
      const [n, d] = this.song.melody[this.noteIndex];
      const f = freq(n);
      if (f) {
        this.tone(f, this.nextNoteTime, d * spb * 0.9, this.song.wave, 0.22, this.musicGain);
        if (this.song.bell) this.tone(f * 2, this.nextNoteTime, 0.35, 'sine', 0.05, this.musicGain);
      }
      this.nextNoteTime += d * spb;
      this.noteIndex = (this.noteIndex + 1) % this.song.melody.length;
      if (this.noteIndex === 0) {
        // синхронизация на баса в началото на всеки цикъл
        this.nextBassTime = this.nextNoteTime;
        this.bassIndex = 0;
      }
    }
    while (this.nextBassTime < ahead) {
      const n = this.bass[this.bassIndex];
      const barLen = this.song.beatsPerBar * spb;
      const f = freq(n);
      if (f) {
        this.tone(f, this.nextBassTime, spb * 0.8, 'triangle', 0.2, this.musicGain);
        for (let b = 1; b < this.song.beatsPerBar; b++) {
          this.tone(f * 1.5, this.nextBassTime + b * spb, spb * 0.4, 'sine', 0.08, this.musicGain);
        }
        // звънче на всеки такт
        this.noise(this.nextBassTime, 0.05, 0.035, 8000, this.musicGain);
      }
      this.nextBassTime += barLen;
      this.bassIndex = (this.bassIndex + 1) % this.bass.length;
    }
  }

  /* ------------------------------ синтез ----------------------------- */

  tone(f, start, dur, type = 'sine', vol = 0.3, dest = this.sfxGain, slideTo = null) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(f, start);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + dur);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol, start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(dest);
    osc.start(start);
    osc.stop(start + dur + 0.05);
  }

  noise(start, dur, vol = 0.2, filterFreq = 1200, dest = this.sfxGain, type = 'highpass') {
    const ctx = this.ctx;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuffer;
    const filter = ctx.createBiquadFilter();
    filter.type = type;
    filter.frequency.value = filterFreq;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, start);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(filter);
    filter.connect(g);
    g.connect(dest);
    src.start(start, Math.random() * 0.5);
    src.stop(start + dur + 0.05);
  }

  arpeggio(notes, step, type = 'triangle', vol = 0.25, dur = 0.25) {
    const t = this.ctx.currentTime;
    notes.forEach((n, i) => this.tone(freq(n), t + i * step, dur, type, vol));
  }

  play(name) {
    if (!this.ctx || !this.settings.sfx) return;
    const t = this.ctx.currentTime;
    switch (name) {
      case 'jump':
        this.tone(330, t, 0.18, 'square', 0.12, this.sfxGain, 720);
        break;
      case 'superjump':
        this.tone(260, t, 0.3, 'square', 0.12, this.sfxGain, 1100);
        break;
      case 'land':
        this.noise(t, 0.08, 0.12, 600, this.sfxGain, 'lowpass');
        break;
      case 'gift':
        this.arpeggio(['C6', 'E6', 'G6'], 0.05, 'triangle', 0.2, 0.2);
        this.noise(t, 0.12, 0.05, 9000);
        break;
      case 'candy':
        this.tone(1320, t, 0.1, 'sine', 0.18);
        this.tone(1760, t + 0.05, 0.12, 'sine', 0.14);
        break;
      case 'star':
        this.arpeggio(['E6', 'G6', 'B6', 'E7'], 0.045, 'sine', 0.2, 0.3);
        this.noise(t, 0.2, 0.04, 10000);
        break;
      case 'powerup':
        this.arpeggio(['C5', 'E5', 'G5', 'C6', 'E6', 'G6'], 0.05, 'square', 0.1, 0.18);
        break;
      case 'life':
        this.arpeggio(['G5', 'C6', 'E6', 'G6', 'C7'], 0.07, 'triangle', 0.2, 0.25);
        break;
      case 'hurt':
        this.tone(440, t, 0.35, 'sawtooth', 0.15, this.sfxGain, 110);
        break;
      case 'die':
        this.arpeggio(['G4', 'E4', 'C4', 'G3'], 0.13, 'square', 0.13, 0.22);
        break;
      case 'splash':
        this.noise(t, 0.5, 0.3, 900, this.sfxGain, 'lowpass');
        this.tone(200, t, 0.3, 'sine', 0.15, this.sfxGain, 60);
        break;
      case 'shieldBreak':
        this.noise(t, 0.25, 0.2, 3000);
        this.tone(900, t, 0.25, 'triangle', 0.15, this.sfxGain, 300);
        break;
      case 'crack':
        this.noise(t, 0.12, 0.2, 2500);
        break;
      case 'break':
        this.noise(t, 0.3, 0.25, 1800);
        this.tone(1200, t, 0.15, 'triangle', 0.08, this.sfxGain, 400);
        break;
      case 'creak':
        this.tone(1600, t, 0.4, 'sine', 0.05, this.sfxGain, 1500);
        break;
      case 'stomp':
        this.noise(t, 0.15, 0.25, 800, this.sfxGain, 'lowpass');
        this.tone(500, t, 0.12, 'square', 0.1, this.sfxGain, 900);
        break;
      case 'bounce':
        this.tone(200, t, 0.3, 'sine', 0.25, this.sfxGain, 900);
        break;
      case 'rumble':
        this.noise(t, 1.8, 0.4, 300, this.sfxGain, 'lowpass');
        break;
      case 'magic':
        this.arpeggio(['A5', 'C#6', 'E6', 'A6', 'C#7'], 0.06, 'sine', 0.18, 0.4);
        break;
      case 'door':
        this.noise(t, 0.6, 0.18, 2000);
        this.arpeggio(['E5', 'G#5', 'B5'], 0.1, 'triangle', 0.15, 0.3);
        break;
      case 'locked':
        this.tone(180, t, 0.15, 'square', 0.1);
        this.tone(150, t + 0.12, 0.2, 'square', 0.1);
        break;
      case 'checkpoint':
        this.arpeggio(['G5', 'B5', 'D6', 'G6'], 0.08, 'triangle', 0.2, 0.35);
        break;
      case 'portalUnlock':
        this.arpeggio(['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'], 0.07, 'sine', 0.22, 0.6);
        this.noise(t, 0.8, 0.05, 9000);
        break;
      case 'levelComplete':
        this.arpeggio(['C5', 'C5', 'C5', 'C5', 'Ab4', 'Bb4', 'C5', 'Bb4', 'C5'], 0.11, 'square', 0.14, 0.3);
        this.arpeggio(['C4', 'C4', 'C4', 'C4', 'Ab3', 'Bb3', 'C4', 'Bb3', 'C4'], 0.11, 'triangle', 0.14, 0.3);
        break;
      case 'wrong':
        this.tone(220, t, 0.25, 'sawtooth', 0.1, this.sfxGain, 160);
        break;
      case 'correct':
        this.arpeggio(['E5', 'G5', 'C6'], 0.08, 'triangle', 0.2, 0.3);
        break;
      case 'click':
        this.tone(880, t, 0.06, 'triangle', 0.12);
        break;
      case 'pause':
        this.tone(660, t, 0.1, 'sine', 0.15, this.sfxGain, 440);
        break;
      default:
        break;
    }
  }
}

export const audio = new AudioManager();
export default audio;
