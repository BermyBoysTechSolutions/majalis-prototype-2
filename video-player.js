// Preserve the saved clips. Hardware video decoding avoids per-frame image downloads.
const FILES = ['01-study.mp4', '02-technology.mp4', '03-business.mp4', '04-fitness.mp4', '05-community.mp4', '06-overview.mp4'];
const TOTAL = 870;
export class VideoPlayer {
  constructor(canvas, wake) {
    this.host = canvas.parentElement;
    this.wake = wake;
    this.pool = new Map();
    this.target = 0;
    this.targetIndex = 0;
    this.visibleIndex = -1;
    this.warmIndex = 0;
    this.frame = 0;
    this.rect = { width: 864, height: 496 };
    this.stats = { requests: 0, decoded: 0, released: 0, errors: 0, draws: 0, paintRequests: 0, fallbacks: 0, seekTimes: [] };
    document.documentElement.classList.add('video-engine');
  }

  ensure(index) {
    if (this.pool.has(index)) return this.pool.get(index);
    const video = document.createElement('video');
    video.className = 'room-video';
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.setAttribute('aria-hidden', 'true');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    const record = { video, index, hasFrame: false, disposed: false, started: 0, callback: 0, presented: index * 145 };
    this.pool.set(index, record);
    video.addEventListener('loadeddata', () => {
      if (record.disposed) return;
      record.hasFrame = true;
      this.wake();
    });
    video.addEventListener('seeked', () => {
      if (record.disposed) return;
      this.stats.decoded++;
      if (record.started) {
        this.stats.seekTimes.push(performance.now() - record.started);
        if (this.stats.seekTimes.length > 256) this.stats.seekTimes.shift();
      }
      record.started = 0;
      record.hasFrame = true;
      if (index === this.targetIndex) this.show(record);
      this.wake();
    });
    video.addEventListener('error', () => { if (!record.disposed) { this.stats.errors++; this.wake(); } });
    if (video.requestVideoFrameCallback) {
      const presented = (_, meta) => {
        if (record.disposed) return;
        record.presented = index * 145 + meta.mediaTime * 24;
        this.stats.draws++;
        record.callback = video.requestVideoFrameCallback(presented);
      };
      record.callback = video.requestVideoFrameCallback(presented);
    }
    this.host.prepend(video);
    this.layout(record);
    const file = index === 0 && this.mobile ? '01-study-mobile.mp4' : FILES[index];
    video.src = new URL(`./assets/tour/clips/${file}`, import.meta.url).href;
    video.load();
    this.trim();
    return record;
  }

  layout(record) {
    // All frames use the approved compilation's framing, while retaining source pixels.
    const scale = Math.max(this.rect.width / 864, this.rect.height / 496);
    const width = 864 * scale, height = 496 * scale;
    Object.assign(record.video.style, { width: `${width}px`, height: `${height}px`,
      left: `${(this.rect.width - width) / 2}px`, top: `${(this.rect.height - height) / 2}px` });
  }

  resize(rect) {
    const mobile = innerWidth <= 760 || (matchMedia('(pointer: coarse)').matches && innerWidth < 1100);
    if (this.mobile !== undefined && this.mobile !== mobile) this.clear();
    this.mobile = mobile;
    this.rect = rect;
    for (const record of this.pool.values()) this.layout(record);
  }

  request(position) {
    const frame = Math.round(Math.max(0, Math.min(TOTAL - 1, position)));
    this.targetIndex = Math.min(5, Math.floor(frame / 145));
    // Aim just inside a source frame to avoid timestamp rounding to its predecessor.
    this.target = (frame - this.targetIndex * 145) / 24 + .00001;
    const record = this.ensure(this.targetIndex);
    const video = record.video;
    if (video.readyState < 2 || video.seeking) return;
    if (Math.abs(video.currentTime - this.target) < 1 / 240) { this.show(record); return; }
    record.started = performance.now();
    this.stats.requests++;
    video.currentTime = this.target;
  }

  show(record) {
    if (!record.hasFrame || record.disposed) return;
    if (this.visibleIndex !== record.index) {
      for (const entry of this.pool.values()) entry.video.classList.toggle('is-current', entry === record);
      this.visibleIndex = record.index;
    }
    this.frame = record.presented;
  }

  draw() {
    this.stats.paintRequests++;
    const current = this.pool.get(this.targetIndex);
    const ready = Boolean(current?.hasFrame && (this.visibleIndex === this.targetIndex || !current.video.seeking));
    if (ready) this.show(current);
    else this.stats.fallbacks++;
    return ready || this.visibleIndex >= 0;
  }

  warm(fromFrame, toFrame) {
    if (navigator.connection?.saveData || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    this.warmIndex = Math.min(5, Math.floor(toFrame / 145));
    this.ensure(this.warmIndex);
  }

  pumpWarm() {}

  trim() {
    while (this.pool.size > 3) {
      const candidate = [...this.pool.keys()].filter(index => index !== this.targetIndex && index !== this.visibleIndex && index !== this.warmIndex)
        .sort((a, b) => Math.abs(b - this.targetIndex) - Math.abs(a - this.targetIndex))[0];
      if (candidate === undefined) break;
      this.release(candidate);
    }
  }

  release(index) {
    const record = this.pool.get(index);
    if (!record) return;
    record.disposed = true;
    record.video.pause();
    if (record.callback && record.video.cancelVideoFrameCallback) record.video.cancelVideoFrameCallback(record.callback);
    record.video.removeAttribute('src');
    record.video.load();
    record.video.remove();
    this.pool.delete(index);
    this.stats.released++;
  }

  clear() {
    for (const index of [...this.pool.keys()]) this.release(index);
    this.visibleIndex = -1;
  }

  snapshot() {
    const seeks = this.stats.seekTimes;
    const record = this.pool.get(this.targetIndex);
    return { ...this.stats, seekTimes: undefined,
      seekMean: seeks.length ? seeks.reduce((a, b) => a + b, 0) / seeks.length : 0,
      engine: 'hardware-video', activeVideos: this.pool.size, videoLimit: 3,
      pending: record?.video.seeking ? 1 : 0, sourceFrame: record?.presented ?? -1,
      sourceFrames: TOTAL, currentTime: record?.video.currentTime ?? 0,
      videoSize: record ? [record.video.videoWidth, record.video.videoHeight] : [0, 0] };
  }
}
