import { buildShapeClouds, ParticleWorld } from './particles.js';
const story=document.querySelector('.world-story'),stage=document.querySelector('.world-stage'),canvas=document.querySelector('#particle-world');
const scenes=[...document.querySelectorAll('.scene')],sources=[...document.querySelectorAll('.art-sources>svg')];
const practice=document.querySelector('.practice-story'),cards=[...document.querySelectorAll('.learning-card-motion')];
const portrait=matchMedia('(max-width:760px) and (orientation:portrait)'),reduced=matchMedia('(prefers-reduced-motion:reduce)');
const root=document.documentElement,animations=[];
const clamp=(value,min=0,max=1)=>Math.min(max,Math.max(min,value));
const smooth=value=>value*value*(3-2*value);
const back=value=>1+2.1*(value-1)**3+1.1*(value-1)**2;
function chapterPosition(progress,total=7){const raw=clamp(progress)*(total-1),index=Math.min(Math.floor(raw),total-2);return index+smooth(clamp((raw-index-.24)/.52));}
let dimensions={top:0,distance:1,practiceTop:0,practiceDistance:1,width:1,height:1};
let world=null,clouds=null,worldVisible=true,raf=0,previousTime=0,startTime=performance.now(),position=0,nativeMotion=false;
let currentChapter=-1,currentPractice=-1,scrollFrame=0,resizeFrame=0;
const fallback=document.querySelector('.art-fallback');
for(let i=0;i<scenes.length;i++){const svg=sources[i].cloneNode(true);svg.removeAttribute('id');scenes[i].querySelector('.scene-still').append(svg);}
function sceneState(progress,index){
 const d=chapterPosition(progress)-index;
 const enter=smooth(clamp((d+.70)/.55)),exit=smooth(clamp((d-.15)/.55));
 return{opacity:1-smooth(clamp((Math.abs(d)-.18)/.24)),enter,exit,d};
}
function lineState(progress,index,line){const {d}=sceneState(progress,index);const enter=smooth(clamp((d+.70-line*.035)/.55)),exit=smooth(clamp((d-.15-line*.025)/.55));return{transform:`translate3d(0,${(1-enter)*112-exit*112}%,0) rotateX(${(1-enter)*-28+exit*28}deg)`};}
function cardState(progress,index){
 if(portrait.matches){const d=index-chapterPosition(progress,3);return{transform:`translate3d(${d*113}%,${Math.abs(d)*9}px,${-Math.abs(d)*140}px) rotateY(${-d*25}deg) rotateZ(${d*7}deg) scale(${1-Math.min(Math.abs(d)*.065,.2)})`,opacity:1-smooth(clamp((Math.abs(d)-.32)/.68))};}
 const raw=clamp((progress-.08-index*.055)/.40),enter=back(raw),side=index-1;
 return{transform:`translate3d(${(1-enter)*side*52}vw,${(1-enter)*(65+index*7)}vh,${-(1-enter)*index*120}px) rotateY(${(1-enter)*side*34}deg) rotateZ(${(1-enter)*side*15}deg) scale(${.74+enter*.26})`,opacity:smooth(raw)};
}
const worldProgress=()=>clamp((scrollY-dimensions.top)/dimensions.distance);
const practiceProgress=()=>clamp((scrollY-dimensions.practiceTop)/dimensions.practiceDistance);
function installNativeAnimation(element,timeline,sample){const frames=Array.from({length:241},(_,i)=>({...sample(i/240),offset:i/240}));animations.push(element.animate(frames,{timeline,rangeStart:'contain 0%',rangeEnd:'contain 100%',fill:'both',easing:'linear'}));}
function setupAnimations(){
 animations.splice(0).forEach(animation=>animation.cancel());nativeMotion=false;
 for(const scene of scenes){scene.style.removeProperty('opacity');for(const node of scene.querySelectorAll('.line-inner,.scene-details'))node.style.removeProperty('transform');}
 for(const card of cards){card.style.removeProperty('transform');card.style.removeProperty('opacity');}
 if(reduced.matches){root.dataset.motionEngine='reduced';return;}
 if(typeof ViewTimeline==='function'){
  try{
   const timeline=new ViewTimeline({subject:story,axis:'block'}),cardTimeline=new ViewTimeline({subject:practice,axis:'block'});
   scenes.forEach((scene,index)=>{
    installNativeAnimation(scene,timeline,p=>({opacity:sceneState(p,index).opacity}));
    scene.querySelectorAll('.line-inner').forEach((line,lineIndex)=>installNativeAnimation(line,timeline,p=>lineState(p,index,lineIndex)));
    installNativeAnimation(scene.querySelector('.scene-details'),timeline,p=>{const{enter,exit}=sceneState(p,index);return{transform:`translate3d(0,${(1-enter)*25-exit*22}px,0)`};});
   });
   cards.forEach((card,index)=>installNativeAnimation(card,cardTimeline,p=>cardState(p,index)));
   installNativeAnimation(document.querySelector('.atmosphere'),timeline,p=>({transform:`translate3d(${Math.sin(p*Math.PI*2)*4}%,${Math.cos(p*Math.PI*2)*3}%,0) rotate(${p*12}deg)`}));
   if(typeof ScrollTimeline==='function')animations.push(document.querySelector('.reading-progress').animate({transform:['scaleX(0)','scaleX(1)']},{timeline:new ScrollTimeline({source:document.documentElement}),fill:'both'}));
   nativeMotion=true;root.dataset.motionEngine='native-scroll';return;
  }catch(error){animations.splice(0).forEach(animation=>animation.cancel());console.warn('Using the scroll animation fallback.',error);}
 }
 root.dataset.motionEngine='fallback';renderFallback();
}
function renderFallback(){
 if(reduced.matches||nativeMotion)return;
 const p=worldProgress(),cp=practiceProgress();
 scenes.forEach((scene,index)=>{const state=sceneState(p,index);scene.style.opacity=state.opacity;scene.querySelectorAll('.line-inner').forEach((line,i)=>line.style.transform=lineState(p,index,i).transform);scene.querySelector('.scene-details').style.transform=`translate3d(0,${(1-state.enter)*25-state.exit*22}px,0)`;});
 cards.forEach((card,index)=>Object.assign(card.style,cardState(cp,index)));
 document.querySelector('.reading-progress').style.transform=`scaleX(${scrollY/Math.max(1,document.documentElement.scrollHeight-innerHeight)})`;
}
function updateMetadata(){
 root.classList.toggle('on-paper',scrollY>=dimensions.practiceTop-70&&scrollY<dimensions.practiceTop+dimensions.practiceDistance+innerHeight-70);
 const index=Math.round(chapterPosition(worldProgress()));
 if(index!==currentChapter){
  currentChapter=index;root.dataset.chapter=String(index);
  scenes.forEach((scene,i)=>{const hidden=!reduced.matches&&i!==index;scene.inert=hidden;scene.setAttribute('aria-hidden',String(hidden));scene.classList.toggle('is-current',i===index);});
  document.querySelectorAll('[data-chapter-link]').forEach((button,i)=>i===index?button.setAttribute('aria-current','step'):button.removeAttribute('aria-current'));
  document.querySelector('#chapter-count').textContent=`${String(index+1).padStart(2,'0')} / 07`;
  if(!world||root.classList.contains('webgl-fallback')){const svg=sources[index].cloneNode(true);svg.removeAttribute('id');fallback.replaceChildren(svg);}
 }
 const cardIndex=Math.round(chapterPosition(practiceProgress(),3));
 if(cardIndex!==currentPractice){currentPractice=cardIndex;cards.forEach((card,i)=>{card.inert=!reduced.matches&&portrait.matches&&i!==cardIndex;card.style.zIndex=String(i===cardIndex?3:1);});document.querySelectorAll('[data-practice-link]').forEach((button,i)=>i===cardIndex?button.setAttribute('aria-current','step'):button.removeAttribute('aria-current'));}
}
function measure(){
 const stageRect=stage.getBoundingClientRect();
 dimensions={top:story.getBoundingClientRect().top+scrollY,distance:Math.max(1,story.offsetHeight-innerHeight),practiceTop:practice.getBoundingClientRect().top+scrollY,practiceDistance:Math.max(1,practice.offsetHeight-innerHeight),width:stageRect.width,height:innerHeight};
 if(world)world.resize(dimensions.width,dimensions.height,portrait.matches);
 updateMetadata();renderFallback();
}
function useSvgFallback(){root.classList.add('webgl-fallback');root.dataset.renderer='svg';world=null;currentChapter=-1;updateMetadata();syncLoop();}
function initializeWorld(){
 if(reduced.matches){root.dataset.renderer='reduced';return;}
 if(world)return;
 try{clouds ||= buildShapeClouds(sources);world=new ParticleWorld(canvas,clouds);canvas.dataset.particles='5600';root.dataset.renderer='webgl';root.classList.remove('webgl-fallback');world.resize(dimensions.width,dimensions.height,portrait.matches);}
 catch(error){console.warn('Using the vector artwork fallback.',error);useSvgFallback();}
}
function frame(now){
 raf=0;if(!world||!worldVisible||document.hidden||reduced.matches||document.querySelector('#account-dialog').open)return;
 const delta=previousTime?Math.min((now-previousTime)/1000,.1):1/60;previousTime=now;
 const target=chapterPosition(worldProgress());position+=(target-position)*(1-Math.exp(-delta*18));if(Math.abs(position-target)<.00001)position=target;
 world.render((now-startTime)/1000,position,Math.min(1,(now-startTime)/1050));
 raf=requestAnimationFrame(frame);
}
function syncLoop(){const running=world&&worldVisible&&!document.hidden&&!reduced.matches&&!document.querySelector('#account-dialog').open;if(running){if(!raf)raf=requestAnimationFrame(frame);}else{cancelAnimationFrame(raf);raf=0;previousTime=0;}}
function gotoChapter(index){if(reduced.matches){scenes[index].scrollIntoView({behavior:'auto'});return;}scrollTo({top:dimensions.top+dimensions.distance*index/(scenes.length-1),behavior:'smooth'});}
function onPreferenceChange(){cancelAnimationFrame(raf);raf=0;currentChapter=-1;currentPractice=-1;setupAnimations();measure();initializeWorld();if(reduced.matches){scenes.forEach(scene=>{scene.inert=false;scene.setAttribute('aria-hidden','false');});cards.forEach(card=>card.inert=false);}else root.dataset.renderer=world?'webgl':'svg';position=chapterPosition(worldProgress());syncLoop();}
measure();setupAnimations();initializeWorld();updateMetadata();syncLoop();
new IntersectionObserver(([entry])=>{worldVisible=entry.isIntersecting;syncLoop();}).observe(stage);
new MutationObserver(syncLoop).observe(document.querySelector('#account-dialog'),{attributes:true,attributeFilter:['open']});
canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();useSvgFallback();});
addEventListener('scroll',()=>{if(scrollFrame)return;scrollFrame=requestAnimationFrame(()=>{scrollFrame=0;updateMetadata();renderFallback();});},{passive:true});
addEventListener('resize',()=>{if(resizeFrame)return;resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;measure();});},{passive:true});
portrait.addEventListener('change',onPreferenceChange);reduced.addEventListener('change',onPreferenceChange);
document.addEventListener('visibilitychange',()=>{root.classList.toggle('page-hidden',document.hidden);syncLoop();});
document.fonts.ready.then(measure);
document.querySelectorAll('[data-chapter-link]').forEach(button=>button.addEventListener('click',()=>gotoChapter(Number(button.dataset.chapterLink))));
document.querySelectorAll('a[href="#discover"]').forEach(link=>link.addEventListener('click',event=>{event.preventDefault();gotoChapter(1);}));
document.querySelectorAll('[data-practice-link]').forEach(button=>button.addEventListener('click',()=>scrollTo({top:dimensions.practiceTop+dimensions.practiceDistance*Number(button.dataset.practiceLink)/2,behavior:reduced.matches?'auto':'smooth'})));
const ambientObserver=new IntersectionObserver(entries=>entries.forEach(({target,isIntersecting})=>target.classList.toggle('motion-paused',!isIntersecting)),{rootMargin:'100px'});ambientObserver.observe(document.querySelector('.closing'));

(() => {
  const dialog = document.querySelector('#account-dialog');
  if (!dialog) return;
  const heading = dialog.querySelector('#account-heading');
  const description = dialog.querySelector('#account-description');
  const modeLabel = dialog.querySelector('#account-mode-label');
  const switchLabel = dialog.querySelector('#account-switch-label');
  const switchButton = dialog.querySelector('.account-switch');
  const copy = {
    signup: {
      label: 'Sign up',
      heading: 'Your next chapter starts here.',
      description: 'Sign-up is coming soon. This prototype previews the MAJALIS experience; member accounts are not available yet.',
      switchLabel: 'Already a member?',
      switchMode: 'login',
      switchText: 'Log in',
    },
    login: {
      label: 'Log in',
      heading: 'Welcome back to MAJALIS.',
      description: 'Member login is coming soon. Account access is not enabled in this prototype yet.',
      switchLabel: 'New to MAJALIS?',
      switchMode: 'signup',
      switchText: 'Sign up',
    },
  };

  document.querySelectorAll('[data-account-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const content = copy[button.dataset.accountMode] || copy.signup;
      modeLabel.textContent = content.label;
      heading.textContent = content.heading;
      description.textContent = content.description;
      switchLabel.textContent = content.switchLabel;
      switchButton.dataset.accountMode = content.switchMode;
      switchButton.textContent = content.switchText;
      if (!dialog.open) dialog.showModal();
    });
  });
  dialog.querySelector('[data-account-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('keydown', (event) => {
    if (event.key !== 'Tab') return;
    const controls = [...dialog.querySelectorAll('button:not([disabled]), a[href]')];
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
  // Close before the existing discovery anchor handler scrolls the page.
  dialog.querySelector('[data-account-browse]').addEventListener('click', () => dialog.close(), { capture: true });
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
})();
