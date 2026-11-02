import { VideoPlayer } from './video-player.js';

const root = document.documentElement;
const chapters = [...document.querySelectorAll('.chapter')];
const panels = [...document.querySelectorAll('[data-panel]')];
const rail = [...document.querySelectorAll('.chapter-nav a')];
const checkpoints = [0, 144, 289, 434, 579, 724, 869];
const labels = ['Welcome to the majlis', 'Islamic knowledge', 'Technology & content', 'Business & finance', 'Health & fitness', 'The community hub', 'A place for you'];
const interests = ['MAJALIS', 'Islamic knowledge', 'Technology and content creation', 'Business and finance', 'Health and fitness', 'The community hub', 'MAJALIS'];
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const portrait = matchMedia('(max-width: 760px) and (orientation: portrait)');
const sceneWindow = document.querySelector('.scene-window');
const poster = document.querySelector('.scene-poster');
const roomLabel = document.querySelector('#room-label');
const progressBar = document.querySelector('.reading-progress span');
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = value => { const t = clamp(value); return t * t * (3 - 2 * t); };
let dimensions = [];
let maxScroll = 1;
let targetScroll = scrollY;
let currentScroll = scrollY;
let previousTime = 0;
let previousFrame = 0;
let raf = 0;
let activeChapter = -1;
let posterIndex = -1;
let lastPaint = false;
let modalOpen = false;
let resizeFrame = 0;
const panelStates = new Map();

function wake() {
  if (!raf && !document.hidden && !modalOpen) raf = requestAnimationFrame(tick);
}
const player = new VideoPlayer(document.querySelector('#room-canvas'), wake);

function measure() {
  dimensions = chapters.map(section => ({ top: section.getBoundingClientRect().top + scrollY, height: section.offsetHeight }));
  maxScroll = Math.max(1, document.documentElement.scrollHeight - innerHeight);
  targetScroll = Math.max(0, Math.min(maxScroll, scrollY));
  currentScroll = targetScroll;
  player.resize(sceneWindow.getBoundingClientRect());
  lastPaint = false;
  panelStates.clear();
  wake();
}

function sample(position) {
  let index = 0;
  while (index < dimensions.length - 1 && position >= dimensions[index + 1].top) index++;
  const distance = index === 6 ? Math.max(1, maxScroll - dimensions[index].top) : dimensions[index].height;
  const local = clamp((position - dimensions[index].top) / distance);
  if (index === 0 || reduced.matches) return { index, local, frame: checkpoints[index], incoming: 1, outgoing: 0 };
  const travel = smooth(local / .49);
  return { index, local, frame: checkpoints[index - 1] + (checkpoints[index] - checkpoints[index - 1]) * travel,
    incoming: smooth((local - .39) / .17), outgoing: 1 - smooth(local / .18) };
}

function showPanel(index, opacity) {
  const panel = panels[index];
  const visible = opacity > .003;
  const interactive = opacity > .65;
  const state = `${opacity.toFixed(3)}:${portrait.matches}`;
  if (panelStates.get(index) === state) return;
  panelStates.set(index, state);
  panel.classList.toggle('is-live', visible);
  panel.classList.toggle('is-interactive', interactive);
  if (!interactive && panel.contains(document.activeElement) && !modalOpen) rail[Math.max(0, activeChapter)].focus({ preventScroll: true });
  panel.inert = !interactive;
  panel.setAttribute('aria-hidden', String(!interactive));
  panel.style.opacity = opacity.toFixed(3);
  const offset = (1 - opacity) * 18;
  const scale = 1 - (1 - opacity) * .018;
  if (portrait.matches) panel.style.transform = `translate3d(0,${offset}px,0) scale(${scale})`;
  else panel.style.transform = `translate3d(${index === 6 ? '-50%' : '0'},calc(-50% + ${offset}px),0) scale(${scale})`;
}

function setPoster(index) {
  if (index === posterIndex) return;
  posterIndex = index;
  poster.src = new URL(`./assets/tour/stills/scene-${index}.webp`, import.meta.url).href;
}

function render(position) {
  const state = sample(position);
  const current = state.index === 0 || reduced.matches ? state.index : state.local > .37 ? state.index : state.index - 1;
  if (current !== activeChapter) {
    activeChapter = current;
    root.dataset.chapter = String(current);
    roomLabel.textContent = labels[current];
    rail.forEach((link, index) => index === current ? link.setAttribute('aria-current', 'step') : link.removeAttribute('aria-current'));
  }
  panels.forEach((_, index) => showPanel(index,
    index === state.index ? state.incoming : index === state.index - 1 ? state.outgoing : 0));
  progressBar.style.transform = `scaleX(${clamp(position / maxScroll)})`;
  setPoster(current);
  if (reduced.matches) {
    root.classList.remove('frames-ready');
    previousFrame = state.frame;
    return;
  }
  const direction = state.frame >= previousFrame ? 1 : -1;
  player.warm(checkpoints[current], checkpoints[Math.min(current + 1, 6)]);
  player.request(state.frame, direction);
  const painted = player.draw(state.frame);
  root.classList.toggle('frames-ready', painted);
  lastPaint = painted;
  previousFrame = state.frame;
}

function tick(time) {
  raf = 0;
  if (document.hidden || modalOpen) { previousTime = 0; return; }
  const delta = previousTime ? Math.min(64, time - previousTime) : 16.67;
  previousTime = time;
  if (reduced.matches) currentScroll = targetScroll;
  else currentScroll += (targetScroll - currentScroll) * (1 - Math.exp(-delta / 62));
  if (Math.abs(targetScroll - currentScroll) < .08) currentScroll = targetScroll;
  render(currentScroll);
  if (Math.abs(targetScroll - currentScroll) > .08) wake();
  else previousTime = 0;
}

function jump(index, instant = false) {
  const entry = dimensions[index];
  if (!entry) return;
  const available = index === 6 ? maxScroll - entry.top : entry.height;
  const top = index === 0 ? 0 : entry.top + available * .66;
  scrollTo({ top: Math.min(maxScroll, top), behavior: instant || reduced.matches ? 'instant' : 'smooth' });
  history.replaceState(null, '', `#${chapters[index].id}`);
}

document.querySelectorAll('a[href^="#"]').forEach(link => {
  const index = chapters.findIndex(section => `#${section.id}` === link.getAttribute('href'));
  if (index >= 0) link.addEventListener('click', event => {
    event.preventDefault();
    if (link.classList.contains('skip-link')) {
      jump(index, true);
      targetScroll = currentScroll = scrollY;
      render(currentScroll);
      const heading = chapters[index].querySelector('h1,h2');
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    } else jump(index);
  });
});
addEventListener('scroll', () => { targetScroll = Math.max(0, Math.min(maxScroll, scrollY)); wake(); }, { passive: true });
addEventListener('resize', () => {
  if (resizeFrame) return;
  resizeFrame = requestAnimationFrame(() => { resizeFrame = 0; measure(); });
}, { passive: true });
reduced.addEventListener('change', () => {
  root.classList.toggle('reduced-motion', reduced.matches);
  if (reduced.matches) player.clear();
  measure();
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) { cancelAnimationFrame(raf); raf = 0; previousTime = 0; }
  else { targetScroll = scrollY; player.pumpWarm(); wake(); }
});
addEventListener('pagehide', () => player.clear());
addEventListener('pageshow', () => measure());

// Native dialogs handle focus containment and Escape. There are no account forms.
let dialogTrigger = null;
let interest = 'MAJALIS';
function openDialog(dialog, trigger) {
  dialogTrigger = trigger;
  modalOpen = true;
  cancelAnimationFrame(raf); raf = 0; previousTime = 0;
  document.body.classList.add('dialog-open');
  dialog.showModal();
}
const account = document.querySelector('#account-dialog');
function setAccountMode(mode) {
  const login = mode === 'login';
  document.querySelector('#account-title').innerHTML = login ? 'Welcome<br /><em>back.</em>' : 'Make yourself<br /><em>at home.</em>';
  document.querySelector('#account-description').textContent = login ? 'Member sign-in opens with the community launch. For now, take a look around and find your space.' : 'This is an early look at MAJALIS. Accounts will open with the community launch.';
  document.querySelector('#account-interest').textContent = `Your interest: ${interest}`;
  account.querySelectorAll('[data-mode]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
}
document.querySelectorAll('[data-account]').forEach(button => button.addEventListener('click', () => {
  interest = button.dataset.interest || interests[Math.max(0, activeChapter)];
  setAccountMode(button.dataset.account);
  openDialog(account, button);
}));
account.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => setAccountMode(button.dataset.mode)));
document.querySelectorAll('[data-guidelines]').forEach(button => button.addEventListener('click', () => openDialog(document.querySelector('#guidelines-dialog'), button)));
const film = document.querySelector('#film-dialog');
const video = film.querySelector('video');
document.querySelectorAll('[data-film]').forEach(button => button.addEventListener('click', () => {
  video.src = video.dataset.src;
  openDialog(film, button);
  video.play().catch(() => {});
}));
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelectorAll('[data-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const box = dialog.getBoundingClientRect();
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) dialog.close();
  });
  dialog.addEventListener('close', () => {
    if (dialog === film) { video.pause(); video.removeAttribute('src'); video.load(); }
    modalOpen = false;
    document.body.classList.remove('dialog-open');
    dialogTrigger?.focus({ preventScroll: true });
    targetScroll = scrollY;
    wake();
  });
});

root.classList.add('is-mounted');
root.classList.toggle('reduced-motion', reduced.matches);
measure();
const initial = chapters.findIndex(section => `#${section.id}` === location.hash);
if (initial > 0) requestAnimationFrame(() => jump(initial, true));
window.__majalis = {
  snapshot: () => ({ chapter: activeChapter, targetScroll, currentScroll, frame: previousFrame, reduced: reduced.matches,
    running: Boolean(raf), maxScroll, sections: dimensions.map((d, i) => ({ ...d, id: chapters[i].id })), ...player.snapshot() }),
  jump: index => jump(index, true),
};
