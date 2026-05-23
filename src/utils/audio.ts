// Web Audio API Synthesizer for spatial sound design

let audioCtx: AudioContext | null = null;
let tickOsc: OscillatorNode | null = null;
let tickGain: GainNode | null = null;
let tickInterval: number | null = null;
let tickAlternate = false;

const initAudio = () => {
  if (!audioCtx && typeof window !== 'undefined') {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

// Map screen X to panning value (-1 to 1)
const calculatePan = (clientX?: number) => {
  if (typeof window === 'undefined' || clientX === undefined) return 0;
  return (clientX / window.innerWidth) * 2 - 1;
};

export const playClick = (clientX?: number) => {
  initAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner();
  
  panner.pan.value = calculatePan(clientX);
  
  // Soft, mechanical click
  osc.type = 'sine';
  osc.frequency.setValueAtTime(800, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.03);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.3, t + 0.005);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
  
  osc.connect(gain);
  gain.connect(panner);
  panner.connect(audioCtx.destination);
  
  osc.start(t);
  osc.stop(t + 0.04);
};

export const playHum = () => {
  // Legacy playHum function for compatibility, replacing with startHum/stopHum
  initAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  
  const osc1 = audioCtx.createOscillator();
  const osc2 = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  
  osc1.type = 'sine';
  osc2.type = 'triangle';
  osc1.frequency.setValueAtTime(110, t);
  osc2.frequency.setValueAtTime(112, t);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.4, t + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 3.0);
  
  osc1.connect(gain);
  osc2.connect(gain);
  gain.connect(audioCtx.destination);
  
  osc1.start(t);
  osc2.start(t);
  osc1.stop(t + 3.0);
  osc2.stop(t + 3.0);
};

export const playTap = (clientX?: number) => {
  initAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  const panner = audioCtx.createStereoPanner();
  
  panner.pan.value = calculatePan(clientX);
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(2200, t);
  osc.frequency.exponentialRampToValueAtTime(600, t + 0.05);
  
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.2, t + 0.002);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);
  
  osc.connect(gain);
  gain.connect(panner);
  panner.connect(audioCtx.destination);
  
  osc.start(t);
  osc.stop(t + 0.06);
};

export const playRewind = () => {
  initAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  
  // Tape rewinding sound simulation
  const bufferSize = audioCtx.sampleRate * 0.5; // 0.5 seconds
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noiseSource = audioCtx.createBufferSource();
  noiseSource.buffer = buffer;
  
  const filter = audioCtx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(5000, t);
  filter.frequency.exponentialRampToValueAtTime(800, t + 0.5);
  filter.Q.value = 3;
  
  const gain = audioCtx.createGain();
  gain.gain.setValueAtTime(0.1, t);
  gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
  
  noiseSource.connect(filter);
  filter.connect(gain);
  gain.connect(audioCtx.destination);
  
  noiseSource.start(t);
};

export const startTicking = () => {
  initAudio();
  if (!audioCtx) return;
  
  const playTick = () => {
    if (!audioCtx) return;
    const t = audioCtx.currentTime;
    
    // Calculate panning value from -1 (left) to +1 (right) based on current second
    const second = new Date().getSeconds();
    const panVal = (second / 60) * 2 - 1;
    
    // Toggle state for ticking alternation (tick-tock)
    tickAlternate = !tickAlternate;
    const baseFreq = tickAlternate ? 1200 : 950;
    
    // 1. Resonant watch case body (gentle decaying sine wave)
    const osc = audioCtx.createOscillator();
    const oscGain = audioCtx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(150, t + 0.015);
    
    oscGain.gain.setValueAtTime(0, t);
    oscGain.gain.linearRampToValueAtTime(0.012, t + 0.001); // extremely quiet body resonance
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    
    osc.connect(oscGain);
    
    // 2. Escapement mechanism strike (tiny burst of bandpass-filtered noise)
    const bufferSize = audioCtx.sampleRate * 0.008; // 8ms burst
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    const filter = audioCtx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(tickAlternate ? 3200 : 2700, t);
    filter.Q.value = 8; // high Q for resonant metallic tap
    
    const noiseGain = audioCtx.createGain();
    noiseGain.gain.setValueAtTime(0, t);
    noiseGain.gain.linearRampToValueAtTime(0.008, t + 0.0005); // very soft click
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.006);
    
    noise.connect(filter);
    filter.connect(noiseGain);
    
    // Routing Node Fallback (with Spatial Audio panner)
    if (audioCtx.createStereoPanner) {
      const panner = audioCtx.createStereoPanner();
      panner.pan.setValueAtTime(panVal, t);
      
      oscGain.connect(panner);
      noiseGain.connect(panner);
      panner.connect(audioCtx.destination);
    } else {
      oscGain.connect(audioCtx.destination);
      noiseGain.connect(audioCtx.destination);
    }
    
    osc.start(t);
    osc.stop(t + 0.02);
    noise.start(t);
  };
  
  if (!tickInterval && typeof window !== 'undefined') {
    tickInterval = window.setInterval(playTick, 1000);
    playTick();
  }
};

export const stopTicking = () => {
  if (tickInterval && typeof window !== 'undefined') {
    clearInterval(tickInterval);
    tickInterval = null;
  }
};

export const playAlarm = () => {
  initAudio();
  if (!audioCtx) return;
  const t = audioCtx.currentTime;
  
  // A beautiful bell chime with multiple harmonics (Tibetan bowl style)
  const frequencies = [300, 450, 600, 900, 1200];
  const gains = [0.15, 0.08, 0.05, 0.03, 0.01];
  
  frequencies.forEach((f, index) => {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(f, t);
    
    // Slight vibrato / detuning over time
    osc.frequency.linearRampToValueAtTime(f + (Math.random() * 4 - 2), t + 3.0);
    
    gainNode.gain.setValueAtTime(0, t);
    gainNode.gain.linearRampToValueAtTime(gains[index], t + 0.05); // quick fade in
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + 4.0 - (index * 0.5)); // slow fade out
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start(t);
    osc.stop(t + 4.0);
  });
};

