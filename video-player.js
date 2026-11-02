// Native forward/reverse playback follows the scroll target without per-frame seeks.
const FILES = ['01-study.mp4', '02-technology.mp4', '03-business.mp4', '04-fitness.mp4', '05-community.mp4', '06-overview.mp4'];
const FPS = 24, LENGTH = 145, LAST = 869;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export class VideoPlayer {
  constructor(canvas, wake) {
    this.host = canvas.parentElement;
    this.wake = wake;
    this.pool = new Map();
    this.frame = this.goal = 0;
    this.goalChanged = performance.now();
    this.navigationSpeed = 1;
    this.maxPlaybackRate = 8;
    this.direction = 1;
    this.active = this.visible = null;
    this.warmKey = '';
    this.rect = { width: 864, height: 496 };
    this.focal = [.5, .5, 1];
    this.focalStyle = '';
    this.quality = 'standard';
    this.suspended = false;
    this.blocked = false;
    this.unavailable = false;
    this.timer = 0;
    this.slowFrames = 0;
    this.stats = { seeks: 0, plays: 0, presented: 0, errors: 0, released: 0, qualityChanges: 0, seekTimes: [] };
    document.documentElement.classList.add('video-engine');
    navigator.mediaCapabilities?.decodingInfo?.({ type: 'file', video: {
      contentType: 'video/mp4; codecs="avc1.64001f"', width: 1280, height: 720,
      bitrate: 11000000, framerate: 24,
    } }).then(info => {
      if (!info.supported || !info.smooth) this.useCompatibility();
    }).catch(() => {});
  }

  ensure(index, direction) {
    const key = `${this.quality}:${index}:${direction}`;
    if (this.pool.has(key)) return this.pool.get(key);
    const video = document.createElement('video');
    Object.assign(video, { className: 'room-video', muted: true, defaultMuted: true,
      playsInline: true, preload: 'auto', disablePictureInPicture: true });
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('aria-hidden', 'true');
    const record = { key, index, direction, video, disposed: false, hasFrame: false,
      aligned: false, aligning: false, playPending: false, started: 0, callback: 0, lastTime: 0, lastPresented: 0 };
    this.pool.set(key, record);
    this.layout(record);
    video.addEventListener('loadeddata', () => { record.hasFrame = true; this.wake(); });
    video.addEventListener('seeked', () => {
      if (record.disposed) return;
      record.aligning = false;
      record.aligned = record.hasFrame = true;
      if (record.started) {
        this.stats.seekTimes.push(performance.now() - record.started);
        if (this.stats.seekTimes.length > 32) this.stats.seekTimes.shift();
      }
      record.started = 0;
      if (record === this.active) { this.frame = this.worldFrame(record, video.currentTime); this.show(record); }
      this.wake();
    });
    video.addEventListener('ended', () => {
      if (record === this.active) this.frame = index * LENGTH + (direction > 0 ? 144 : 0);
      this.wake();
    });
    video.addEventListener('timeupdate', () => {
      if (!video.requestVideoFrameCallback) this.present(record, video.currentTime);
    });
    video.addEventListener('error', () => {
      if (record.disposed) return;
      this.stats.errors++;
      if (this.quality === 'standard') this.useCompatibility();
      else { this.unavailable = true; this.clear(); this.wake(); }
    });
    if (video.requestVideoFrameCallback) {
      const presented = (_, meta) => {
        if (record.disposed) return;
        const now = performance.now();
        // Measure actual missed presentations at modest playback speed. Decoder
        // processingDuration includes pipeline buffering and is not a CPU benchmark.
        if (record === this.active && !video.paused && !video.seeking && video.playbackRate <= 1.5 && record.lastPresented) {
          const stalled = now - record.lastPresented > 140 && Math.abs(meta.mediaTime - record.lastTime) > .14;
          this.slowFrames = Math.max(0, this.slowFrames + (stalled ? 1 : -.25));
        }
        record.lastPresented = now;
        record.lastTime = meta.mediaTime;
        this.present(record, meta.mediaTime);
        if (this.slowFrames >= 5 && this.quality === 'standard') this.useCompatibility();
        if (!record.disposed) record.callback = video.requestVideoFrameCallback(presented);
      };
      record.callback = video.requestVideoFrameCallback(presented);
    }
    this.host.prepend(video);
    const folder = this.quality === 'compat' ? (direction > 0 ? 'compat' : 'compat-reverse') : (direction > 0 ? 'clips' : 'reverse');
    video.src = new URL(`./assets/tour/${folder}/${FILES[index]}`, import.meta.url).href;
    video.load();
    this.trim(record);
    return record;
  }

  worldFrame(record, time) {
    return record.index * LENGTH + clamp(record.direction > 0 ? time * FPS : 144 - time * FPS, 0, 144);
  }

  present(record, time) {
    if (record !== this.active || !record.aligned || record.aligning || record.disposed) return;
    this.stats.presented++;
    // A final frame callback can arrive after `ended`, carrying an older frame.
    // Keep the exact endpoint so fast reverse playback advances to the next clip.
    this.frame = record.video.ended ? record.index * LENGTH + (record.direction > 0 ? 144 : 0) :
      this.worldFrame(record, time);
    this.show(record);
    // Stop as soon as the presented camera passes the scroll target.
    if ((this.goal - this.frame) * record.direction < .6) record.video.pause();
    this.wake();
  }

  align(record, frame) {
    if (record.aligning || record.video.readyState < 2) return;
    const local = clamp(frame - record.index * LENGTH, 0, 144);
    const time = (record.direction > 0 ? local : 144 - local) / FPS + .00001;
    if (Math.abs(record.video.currentTime - time) < .002) {
      record.aligned = true;
      this.frame = this.worldFrame(record, record.video.currentTime);
      this.show(record);
      return;
    }
    record.video.pause();
    record.aligned = false;
    record.aligning = true;
    record.started = performance.now();
    this.stats.seeks++;
    record.video.currentTime = time;
  }

  request(position) {
    const goal = Math.round(clamp(position, 0, LAST));
    if (goal !== this.goal) this.goalChanged = performance.now();
    this.goal = goal;
    const stable = performance.now() - this.goalChanged > 100;
    if (this.unavailable) { this.frame = this.goal; return; }
    if (this.suspended) return;
    if (this.active?.aligned && !this.active.aligning && this.active.video.ended) {
      this.frame = this.active.index * LENGTH + (this.active.direction > 0 ? 144 : 0);
    }
    const delta = this.goal - this.frame;
    if (stable && this.active?.aligned && this.active.video.paused && Math.abs(delta) < 4.5 &&
        Math.floor(this.goal / LENGTH) === this.active.index) {
      if (Math.abs(delta) > .03) this.align(this.active, this.goal);
      return;
    }
    // A tiny dead band avoids alternating directions between adjacent source frames.
    const direction = Math.abs(delta) > 1.1 ? Math.sign(delta) : this.direction;
    let index = clamp(Math.floor(this.frame / LENGTH), 0, 5);
    if (direction > 0 && this.frame >= index * LENGTH + 143.5 && this.goal > index * LENGTH + 144.5 && index < 5) {
      index++; this.frame = index * LENGTH;
    } else if (direction < 0 && this.frame <= index * LENGTH + .5 && this.goal < index * LENGTH - .5 && index > 0) {
      index--; this.frame = index * LENGTH + 144;
    }
    const record = this.ensure(index, direction);
    if (record !== this.active) {
      this.active?.video.pause();
      this.active = record;
      record.aligned = false;
      this.trim();
    }
    this.direction = direction;
    if (record.video.readyState < 2 || record.aligning) return;
    if (!record.aligned) { this.align(record, this.frame); return; }
    const remaining = (this.goal - this.frame) * direction;
    if (remaining <= 1.1) {
      record.video.pause();
      // One final alignment preserves the exact requested endpoint after playback.
      if (stable && Math.abs(this.goal - this.frame) > .03 && Math.floor(this.goal / LENGTH) === index) this.align(record, this.goal);
      if (!stable && !this.timer) this.timer = setTimeout(() => { this.timer = 0; this.wake(); }, 120);
      return;
    }
    if (this.blocked) {
      // Autoplay restrictions still leave a usable scroll tour and explicit film control.
      this.seekFallback();
      return;
    }
    const rate = clamp(remaining / FPS * 3.5 * this.navigationSpeed, .8,
      Math.min(4 * this.navigationSpeed, this.maxPlaybackRate));
    if (Math.abs(record.video.playbackRate - rate) > .08) {
      try { record.video.playbackRate = rate; }
      catch { this.maxPlaybackRate = 4; record.video.playbackRate = Math.min(4, rate); }
    }
    if (record.video.paused && !record.playPending) {
      record.playPending = true;
      this.stats.plays++;
      record.video.play().catch(error => {
        if (error.name === 'NotAllowedError') { this.blocked = true; this.useCompatibility(); }
      }).finally(() => { record.playPending = false; this.wake(); });
    }
    // Also wake in browsers without frame callbacks, or while a video is buffering.
    if (!this.timer) this.timer = setTimeout(() => { this.timer = 0; this.wake(); }, 120);
    this.preloadNext(index, direction);
  }

  seekFallback() {
    const index = Math.min(5, Math.floor(this.goal / LENGTH));
    const record = this.ensure(index, 1);
    if (this.active !== record) { this.active?.video.pause(); this.active = record; }
    if (!record.aligning) this.align(record, this.goal);
  }

  preloadNext(index, direction) {
    if (navigator.connection?.saveData) return;
    const next = index + direction;
    if (next < 0 || next > 5) return;
    this.warmKey = `${this.quality}:${next}:${direction}`;
    this.ensure(next, direction);
  }

  show(record) {
    if (!record.hasFrame || !record.aligned || record.disposed) return;
    if (this.visible !== record) {
      for (const item of this.pool.values()) item.video.classList.toggle('is-current', item === record);
      this.visible = record;
      this.trim();
    }
  }

  draw() { return Boolean(this.visible?.hasFrame); }
  warm() {} // Playback preloads the next camera move, never the entire tour.
  pumpWarm() { this.wake(); }
  setNavigationSpeed(speed = 1) { this.navigationSpeed = clamp(speed, 1, 2); }
  pause() { this.suspended = true; this.active?.video.pause(); clearTimeout(this.timer); this.timer = 0; }
  resume() { this.suspended = false; this.wake(); }
  unlock() {
    if (!this.blocked) return;
    this.blocked = false;
    // Run inside the real pointer/touch gesture for browsers with stricter policies.
    this.active?.video.play().catch(() => { this.blocked = true; });
    this.resume();
  }

  snap(frame) {
    this.active?.video.pause();
    this.goal = this.frame = clamp(frame, 0, LAST);
    this.active = null;
    this.wake();
  }

  useCompatibility() {
    if (this.quality === 'compat') return;
    this.quality = 'compat';
    this.stats.qualityChanges++;
    document.documentElement.classList.add('compat-motion');
    this.active?.video.pause();
    this.active = null;
    this.wake();
  }

  layout(record) {
    const scale = Math.max(this.rect.width / 864, this.rect.height / 496);
    const width = 864 * scale, height = 496 * scale;
    Object.assign(record.video.style, { width: `${width}px`, height: `${height}px`,
      left: `${(this.rect.width - width) / 2}px`, top: `${(this.rect.height - height) / 2}px` });
  }

  focus(x, y, zoom) {
    this.focal = [x, y, zoom];
    const { width, height } = this.rect;
    const scale = Math.max(width / 864, height / 496);
    const worldWidth = 864 * scale * zoom, worldHeight = 496 * scale * zoom;
    const left = clamp(width / 2 - worldWidth * x, width - worldWidth, 0);
    const top = clamp(height / 2 - worldHeight * y, height - worldHeight, 0);
    const tx = left - (width - worldWidth) / 2, ty = top - (height - worldHeight) / 2;
    const transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) scale(${zoom.toFixed(4)})`;
    if (transform !== this.focalStyle) {
      this.focalStyle = transform;
      this.host.style.transform = transform;
    }
  }

  resize(rect) {
    this.rect = rect;
    if (navigator.connection?.saveData || navigator.hardwareConcurrency <= 4) this.useCompatibility();
    for (const record of this.pool.values()) this.layout(record);
    this.focus(...this.focal);
  }

  trim(protectedRecord) {
    for (const [key, record] of this.pool) {
      if (this.pool.size <= 3) break;
      if (record !== protectedRecord && record !== this.active && record !== this.visible && key !== this.warmKey) this.release(key);
    }
  }

  release(key) {
    const record = this.pool.get(key);
    if (!record) return;
    record.disposed = true;
    record.video.pause();
    if (record.callback) record.video.cancelVideoFrameCallback?.(record.callback);
    record.video.removeAttribute('src'); record.video.load(); record.video.remove();
    this.pool.delete(key);
    this.stats.released++;
  }

  clear() {
    this.setNavigationSpeed();
    clearTimeout(this.timer); this.timer = 0;
    for (const key of [...this.pool.keys()]) this.release(key);
    this.active = this.visible = null;
  }

  snapshot() {
    const record = this.active, seeks = this.stats.seekTimes;
    return { ...this.stats, seekTimes: undefined, engine: 'native-playback', quality: this.quality,
      seekMean: seeks.length ? seeks.reduce((a, b) => a + b, 0) / seeks.length : 0,
      activeVideos: this.pool.size, videoLimit: 3, sourceFrame: this.frame, targetFrame: this.goal,
      sourceFrames: LAST + 1, moving: Boolean(record && (!record.video.paused || record.aligning)),
      blocked: this.blocked, unavailable: this.unavailable, direction: this.direction, rate: record?.video.playbackRate ?? 0,
      navigationSpeed: this.navigationSpeed,
      videoSize: record ? [record.video.videoWidth, record.video.videoHeight] : [0, 0] };
  }
}
