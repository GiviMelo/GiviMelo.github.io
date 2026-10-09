'use strict';
const root = document.getElementById('lucas-workspace');
const terminalInput = document.getElementById('terminal-input');
const output = document.getElementById('terminal-output');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
let language = 'pt';
let historyIndex = 0;
const commandHistory = [];
const files = {home:'README.md',about:'about.md',projects:'projects/',experience:'experience.json',contact:'contact.js'};
let scrollFrame=0;
const easeInOutCubic=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
function cancelNavigationScroll(){cancelAnimationFrame(scrollFrame);scrollFrame=0;}
function sectionScrollTop(target){
  const nav=document.querySelector('.section-nav');
  const offset=target.id==='home'?0:(nav?nav.getBoundingClientRect().height:0)+24;
  return Math.max(0,Math.min(target.getBoundingClientRect().top+window.scrollY-offset,document.documentElement.scrollHeight-window.innerHeight));
}
function navigate(section) {
  const target=document.getElementById(section);if(!target)return;
  cancelNavigationScroll();
  const start=window.scrollY,destination=sectionScrollTop(target),distance=destination-start;
  window.history.replaceState(null,'','#'+section);
  if(reducedMotion||Math.abs(distance)<2){window.scrollTo({top:destination,behavior:'instant'});return;}
  const duration=Math.min(1300,Math.max(650,Math.abs(distance)*.35));
  let started;
  function step(now){
    if(started===undefined)started=now;
    const progress=Math.min(1,(now-started)/duration);
    window.scrollTo({top:start+distance*easeInOutCubic(progress),behavior:'instant'});
    if(progress<1)scrollFrame=requestAnimationFrame(step);else{scrollFrame=0;window.scrollTo({top:sectionScrollTop(target),behavior:'instant'});}
  }
  scrollFrame=requestAnimationFrame(step);
}
window.addEventListener('wheel',cancelNavigationScroll,{passive:true});
window.addEventListener('touchstart',cancelNavigationScroll,{passive:true});
window.addEventListener('pointerdown',cancelNavigationScroll,{passive:true});
window.addEventListener('keydown',e=>{if(['ArrowUp','ArrowDown','PageUp','PageDown','Home','End',' '].includes(e.key))cancelNavigationScroll()});
document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',e=>{
  if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey||e.button!==0)return;
  const section=link.getAttribute('href').slice(1);
  if(document.getElementById(section)){e.preventDefault();navigate(section);}
}));

function writeLine(text) {
  const line = document.createElement('div');
  line.textContent = text;
  output.append(line);
  while (output.children.length > 30) output.firstElementChild.remove();
  output.scrollTop = output.scrollHeight;
}
function setLanguage(value) {
  language=value;
  const en=value==='en';
  document.documentElement.lang=en?'en':'pt-BR';
  document.querySelectorAll('[data-pt][data-en]').forEach(el=>el.textContent=el.dataset[value]);
  root.querySelector('.greeting').textContent=en?'Hello, I’m':'Olá, eu sou';
  root.querySelector('.role').innerHTML=en?'Computer Science Student<br><span class="caret">_</span>':'Estudante de Ciência<br>da Computação<span class="caret">_</span>';
  root.querySelector('.description').textContent=en?'Here are some projects I’ve worked on at university and the technologies I’m learning.':'Aqui estão alguns projetos que fiz na faculdade e as tecnologias que estou estudando.';
  root.querySelector('.primary').textContent=en?'Explore projects':'Explorar projetos';
  root.querySelector('.secondary').textContent=en?'Let’s talk':'Vamos conversar';
  root.querySelector('.lang').textContent=en?'EN / PT':'PT / EN';
  root.querySelector('.status-language').textContent=en?'EN-US':'PT-BR';
  terminalInput.setAttribute('aria-label',en?'Terminal command':'Comando do terminal');
  syncTerminalLabel();
}
const toggle=document.getElementById('terminal-toggle');
function syncTerminalLabel(){toggle.textContent=toggle.getAttribute('aria-expanded')==='true'?(language==='en'?'Collapse':'Recolher'):(language==='en'?'Expand':'Expandir')}
toggle.onclick=()=>{const expanded=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(expanded));document.getElementById('terminal-body').hidden=!expanded;syncTerminalLabel()};
root.querySelector('.lang').onclick=()=>setLanguage(language==='pt'?'en':'pt');
root.querySelectorAll('[data-page],[data-go]').forEach(button=>button.onclick=()=>navigate(button.dataset.page||button.dataset.go));
// Only explicitly supported portfolio commands are interpreted.
const aliases = Object.freeze({help:'help',ajuda:'help',home:'home',inicio:'home',about:'about',sobre:'about',projects:'projects',projetos:'projects',experience:'experience',experiencia:'experience',experiencias:'experience',contact:'contact',contato:'contact',github:'github',lang:'lang',idioma:'lang',clear:'clear',limpar:'clear',ls:'ls',listar:'ls',whoami:'whoami',quemsou:'whoami'});
const normalize = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
function completions(value) {
  const text=normalize(value.trimStart()).replace(/\s+/g,' ');
  const tokens=text.split(' ');
  if(tokens.length>2)return [];
  if(tokens.length===2){
    if(aliases[tokens[0]]!=='lang')return [];
    return ['pt','en'].filter(l=>l.startsWith(tokens[1])).map(l=>tokens[0]+' '+l);
  }
  return Object.keys(aliases).filter(command=>command.startsWith(text));
}
function commonPrefix(options) {
  let prefix=options[0]||'';
  for(const option of options)while(!option.startsWith(prefix))prefix=prefix.slice(0,-1);
  return prefix;
}
function runCommand(raw) {
  const input=raw.trim();if(!input)return;
  writeLine('$ '+input);
  if(commandHistory.at(-1)!==input)commandHistory.push(input);
  if(commandHistory.length>50)commandHistory.shift();
  historyIndex=commandHistory.length;
  const parts=normalize(input).split(/\s+/),name=aliases[parts[0]];
  if(name==='lang'&&parts.length===2&&['pt','en'].includes(parts[1])){
    setLanguage(parts[1]);writeLine(parts[1]==='en'?'Language: English':'Idioma: Português');return;
  }
  if(parts.length!==1||!name){writeLine(language==='en'?'Unknown command. Type help.':'Comando não encontrado. Digite ajuda.');return;}
  if(name==='help')writeLine(language==='en'?'home / início · about / sobre · projects / projetos\nexperience / experiências · contact / contato · github\nlang pt|en / idioma pt|en · clear / limpar\nls / listar · whoami / quemsou\nEnter runs a command. ↑ / ↓ browse history. Tab completes or lists suggestions.':'início / home · sobre / about · projetos / projects\nexperiências / experience · contato / contact · github\nidioma pt|en / lang pt|en · limpar / clear\nlistar / ls · quemsou / whoami\nEnter executa. ↑ / ↓ percorrem o histórico. Tab completa ou mostra sugestões.');
  else if(Object.hasOwn(files,name)){writeLine((language==='en'?'Opening ':'Abrindo ')+files[name]);navigate(name);}
  else if(name==='ls')writeLine(Object.values(files).join('   '));
  else if(name==='whoami')writeLine(language==='en'?'Lucas Melo · Computer Science · PUC Minas':'Lucas Melo · Ciência da Computação · PUC Minas');
  else if(name==='clear')output.replaceChildren();
  else if(name==='github'){
    const link=document.createElement('a');link.href='https://github.com/GiviMelo';link.target='_blank';link.rel='noopener';link.textContent=language==='en'?'Open GitHub / GiviMelo':'Abrir GitHub / GiviMelo';const line=document.createElement('div');line.append(link);output.append(line);link.focus();
  }
  else if(name==='lang')writeLine(language==='en'?'Use lang pt or lang en.':'Use idioma pt ou idioma en.');
}
document.getElementById('terminal-form').onsubmit=e=>{e.preventDefault();const raw=terminalInput.value;terminalInput.value='';runCommand(raw)};
let historyDraft='';
terminalInput.addEventListener('keydown',e=>{
  if(e.isComposing)return;
  if(e.key==='ArrowUp'){
    e.preventDefault();if(historyIndex===commandHistory.length)historyDraft=terminalInput.value;
    historyIndex=Math.max(0,historyIndex-1);terminalInput.value=commandHistory[historyIndex]||historyDraft;
  }
  if(e.key==='ArrowDown'){
    e.preventDefault();historyIndex=Math.min(commandHistory.length,historyIndex+1);
    terminalInput.value=historyIndex===commandHistory.length?historyDraft:commandHistory[historyIndex];
  }
  // Empty input and Shift+Tab preserve normal keyboard navigation.
  if(e.key==='Tab'&&!e.shiftKey&&terminalInput.value.trim()){
    const options=completions(terminalInput.value);e.preventDefault();
    if(options.length===1){terminalInput.value=options[0]+(aliases[options[0]]==='lang'?' ':'');}
    else if(options.length>1){
      const prefix=commonPrefix(options);
      if(prefix.length>normalize(terminalInput.value).length)terminalInput.value=prefix;
      writeLine((language==='en'?'Suggestions: ':'Sugestões: ')+options.join('  '));
    }else writeLine(language==='en'?'No matching commands. Type help.':'Nenhum comando correspondente. Digite ajuda.');
  }
});

const observer=new IntersectionObserver(entries=>{for(const entry of entries){if(!entry.isIntersecting)continue;const section=entry.target.id;root.querySelector('#filename').textContent=files[section];root.querySelector('#crumb').textContent=files[section];root.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('selected',b.dataset.page===section))}},{rootMargin:'-15% 0px -55% 0px'});
['home','about','projects','experience','contact'].forEach(id=>observer.observe(document.getElementById(id)));
if(window.gsap&&window.ScrollTrigger&&!reducedMotion){
  gsap.registerPlugin(ScrollTrigger);
  gsap.from('.hero-copy',{opacity:0,y:20,duration:.8});
  gsap.from('.scene',{opacity:0,scale:.93,duration:1,delay:.2});
  const timeline=gsap.timeline({scrollTrigger:{trigger:'.hero-stage',start:'top top',end:'bottom 15%',scrub:true}});
  timeline.to('#lucas-workspace .titlebar,#lucas-workspace .activity,#lucas-workspace .explorer,#lucas-workspace .tabs,#lucas-workspace .breadcrumb,#lucas-workspace footer',{opacity:0,duration:1},0);
  timeline.to('#lucas-workspace',{borderColor:'transparent',boxShadow:'0 0 0 transparent',backgroundColor:'#09090b',duration:1},0);
  document.querySelectorAll('.content-section').forEach(section=>gsap.from(section.children,{opacity:0,y:20,duration:.6,stagger:.07,scrollTrigger:{trigger:section,start:'top 85%',once:true}}));
}

// Keep project chronology when new entries are added.
const projectTimeline=document.querySelector('.timeline');
if(projectTimeline){[...projectTimeline.children].sort((a,b)=>Number(a.dataset.order)-Number(b.dataset.order)).forEach(item=>projectTimeline.append(item));}
