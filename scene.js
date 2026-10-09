/* Givi's skills graph: local Canvas, no Spline or WebGL dependency. */
(()=>{
 const host=document.querySelector('#lucas-workspace .scene'),canvas=host.querySelector('canvas');
 const ctx=canvas.getContext('2d'),controls=host.querySelector('.skill-labels'),note=host.querySelector('.scene-note');
 const motion=matchMedia('(prefers-reduced-motion: reduce)');
 const groups=[
  {name:'Java',pt:'Orientação a objetos e estruturas de dados.',en:'Object-oriented programming and data structures.',topics:['Classes','Objetos','Listas']},
  {name:'JavaScript',pt:'Lógica e interações nas interfaces web.',en:'Logic and interactions in web interfaces.',topics:['DOM','Eventos','JSON']},
  {name:'HTML',pt:'Estrutura e organização das páginas.',en:'Page structure and organization.',topics:['Semântica','Formulários','Links']},
  {name:'CSS',pt:'Estilos, layouts e responsividade.',en:'Styling, layouts and responsive design.',topics:['Grid','Flexbox','Responsividade']},
  {name:'Git',pt:'Versionamento dos meus projetos.',en:'Version control for my projects.',topics:['Commits','Branches','GitHub']},
  {name:'C++',pt:'Algoritmos e resolução de problemas.',en:'Algorithms and problem solving.',topics:['Algoritmos','Vetores','Funções']},
  {name:'C',pt:'Fundamentos de programação e manipulação de dados.',en:'Programming fundamentals and data handling.',topics:['Structs','Ponteiros','Recursividade']}
 ];
 const topicEnglish={"Objetos": "Objects", "Listas": "Lists", "Eventos": "Events", "Semântica": "Semantics", "Formulários": "Forms", "Responsividade": "Responsive design", "Algoritmos": "Algorithms", "Vetores": "Arrays", "Funções": "Functions", "Ponteiros": "Pointers", "Recursividade": "Recursion"};
 const nodes=[{x:.5,y:.5,vx:0,vy:0,r:7,name:'Givi',group:-1,kind:'center'}],edges=[];
 groups.forEach((g,i)=>{
  const angle=-Math.PI/2+i*Math.PI*2/groups.length;
  const x=.5+Math.cos(angle)*.29,y=.5+Math.sin(angle)*.29;
  const index=nodes.length;nodes.push({x,y,vx:0,vy:0,r:4,name:g.name,group:i,kind:'skill',anchorX:x,anchorY:y});edges.push({a:0,b:index,length:.29,group:i});
  g.topics.forEach((name,j)=>{
   const a=angle+(j-1)*.7;const lx=x+Math.cos(a)*.1,ly=y+Math.sin(a)*.1;
   nodes.push({x:lx,y:ly,vx:0,vy:0,r:2,name,enName:topicEnglish[name]||name,group:i,kind:'topic',anchorX:lx,anchorY:ly});edges.push({a:index,b:nodes.length-1,length:.1,group:i});
  });
 });
 let size=1,selected=-1,hover=-1,drag=-1,pointerId=null,paused=motion.matches,visible=true,raf=0,last=0,t=0,rotation=0,angularVelocity=0,previousFrame=null;
 const orbitSpeed=Math.PI*2/300; // One gentle orbit every five minutes.
 function rotatePoint(p,angle=rotation){const x=p.x-.5,y=p.y-.5,c=Math.cos(angle),s=Math.sin(angle);return {x:.5+x*c-y*s,y:.5+x*s+y*c}}
 controls.replaceChildren();controls.hidden=false;
 const buttons=groups.map((g,i)=>{const b=document.createElement('button');b.type='button';b.className='graph-skill';b.textContent=g.name;b.setAttribute('aria-pressed','false');b.onclick=()=>select(selected===i?-1:i);b.onpointerenter=()=>{hover=i;render()};b.onpointerleave=()=>{hover=-1;render()};b.onfocus=()=>{hover=i;render()};b.onblur=()=>{hover=-1;render()};controls.append(b);return b});
 const tools=document.createElement('div');tools.className='graph-tools';
 const pause=document.createElement('button');pause.type='button';tools.append(pause);host.append(tools);
 const detail=document.createElement('p');detail.className='graph-detail';detail.setAttribute('aria-live','polite');host.append(detail);
 const en=()=>document.documentElement.lang.startsWith('en');
 function text(){note.textContent=en()?'Drag the nodes · select a skill':'Arraste os pontos · selecione uma skill';pause.textContent=paused?(en()?'Resume motion':'Retomar movimento'):(en()?'Pause motion':'Pausar movimento');pause.setAttribute('aria-pressed',String(paused));detail.textContent=selected<0?'':groups[selected].name+' · '+groups[selected][en()?'en':'pt'];canvas.setAttribute('aria-label',en()?'Givi skills graph. Select a skill using the buttons below.':'Grafo de competências de Givi. Selecione uma skill pelos botões abaixo.')}
 function select(i){selected=i;buttons.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));text();render()}
 pause.onclick=()=>{paused=!paused;text();start()};
 motion.addEventListener('change',()=>{paused=motion.matches;text();start()});
 new MutationObserver(()=>{text();render()}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});text();
 function physics(){
  const force=nodes.map(()=>({x:0,y:0}));
  for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
   const dx=nodes[j].x-nodes[i].x,dy=nodes[j].y-nodes[i].y,d2=Math.max(.0004,dx*dx+dy*dy),d=Math.sqrt(d2),f=Math.min(.00008,.0000012/d2);
   force[i].x-=dx/d*f;force[i].y-=dy/d*f;force[j].x+=dx/d*f;force[j].y+=dy/d*f;
  }
  for(const edge of edges){const a=nodes[edge.a],b=nodes[edge.b],dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.hypot(dx,dy)),f=(d-edge.length)*.005;force[edge.a].x+=dx/d*f;force[edge.a].y+=dy/d*f;force[edge.b].x-=dx/d*f;force[edge.b].y-=dy/d*f}
  nodes.forEach((n,i)=>{if(i===0||i===drag)return;
   const drift=paused?0:.006;
   force[i].x+=(n.anchorX+Math.sin(t*.3+i)*drift-n.x)*.007;
   force[i].y+=(n.anchorY+Math.cos(t*.25+i)*drift-n.y)*.007;
   n.vx=(n.vx+force[i].x)*.83;n.vy=(n.vy+force[i].y)*.83;
   n.x=Math.max(.08,Math.min(.92,n.x+n.vx));n.y=Math.max(.08,Math.min(.92,n.y+n.vy));
  });
 }
 // Settle before the first render, including reduced-motion devices.
 for(let i=0;i<150;i++)physics();
 function label(value,x,y,color){ctx.font='12px monospace';const w=ctx.measureText(value).width;ctx.fillStyle=color;ctx.fillText(value,Math.max(8,Math.min(size-w-8,x-w/2)),Math.max(14,Math.min(size-8,y)))}
 function render(){
  if(!ctx)return;const ratio=Math.min(devicePixelRatio||1,2);ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,size,size);
  const active=hover>=0?hover:selected;
  edges.forEach(e=>{const a=rotatePoint(nodes[e.a]),b=rotatePoint(nodes[e.b]);ctx.beginPath();ctx.moveTo(a.x*size,a.y*size);ctx.lineTo(b.x*size,b.y*size);ctx.strokeStyle=active===e.group?'#a78bfa99':active>=0?'#77748219':'#77748240';ctx.lineWidth=active===e.group?1.1:.65;ctx.stroke()});
  nodes.forEach(node=>{const n={...node,...rotatePoint(node)};const bright=n.kind==='center'||n.group===active;ctx.beginPath();ctx.arc(n.x*size,n.y*size,n.r*(bright&&n.kind!=='center'?1.2:1),0,Math.PI*2);ctx.fillStyle=n.kind==='center'?'#a78bfa':bright?'#c4b5fd':n.kind==='skill'?'#aaa3b8':'#787280';ctx.shadowColor='#8b5cf6';ctx.shadowBlur=bright?12:0;ctx.fill();ctx.shadowBlur=0;
   if(n.kind==='center')label(n.name,n.x*size,n.y*size+25,'#ede9fe');
   else if(n.kind==='skill')label(n.name,n.x*size,n.y*size-12,bright?'#e0d3ff':'#bbb4c9');
   else if(n.group===active)label(en()?n.enName:n.name,n.x*size,n.y*size+17,'#aaa1bc');
  });
 }
 function resize(){size=Math.max(1,host.clientWidth);const ratio=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(size*ratio);canvas.height=Math.round(size*ratio);render()}
 new ResizeObserver(resize).observe(host);resize();
 function coordinates(e){const box=canvas.getBoundingClientRect();return {x:(e.clientX-box.left)/box.width,y:(e.clientY-box.top)/box.height}}
 function nearest(p){let found=-1,distance=24/size;nodes.forEach((n,i)=>{const d=Math.hypot(p.x-rotatePoint(n).x,p.y-rotatePoint(n).y);if(d<distance){distance=d;found=i}});return found}
 let moved=false,origin=null;
 canvas.style.touchAction='pan-y';
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0)return;const p=coordinates(e),i=nearest(p);if(i<0)return;drag=i;angularVelocity=0;pointerId=e.pointerId;moved=false;origin=p;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{const p=coordinates(e);if(drag>=0){if(Math.hypot(p.x-origin.x,p.y-origin.y)>5/size)moved=true;if(drag!==0){const local=rotatePoint(p,-rotation);nodes[drag].x=Math.max(.08,Math.min(.92,local.x));nodes[drag].y=Math.max(.08,Math.min(.92,local.y));nodes[drag].vx=0;nodes[drag].vy=0}render()}else{const i=nearest(p);hover=i>=0?nodes[i].group:-1;canvas.style.cursor=i>=0?'grab':'default';render()}});
 function release(e){if(drag<0)return;const i=drag;drag=-1;if(!moved&&e.type==='pointerup')select(nodes[i].group);if(pointerId!==null&&canvas.hasPointerCapture(pointerId))canvas.releasePointerCapture(pointerId);pointerId=null;render()}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);canvas.addEventListener('pointerleave',()=>{if(drag<0){hover=-1;render()}});
 function frame(time){
  raf=0;if(!visible||document.hidden||paused)return;
  const dt=previousFrame===null?0:Math.min(.05,(time-previousFrame)/1000);previousFrame=time;t+=dt;
  const target=drag>=0||hover>=0?0:orbitSpeed;
  angularVelocity+=(target-angularVelocity)*(1-Math.exp(-dt*5));
  if(drag<0)rotation=(rotation+angularVelocity*dt)%(Math.PI*2);
  if(time-last>30){physics();last=time}render();raf=requestAnimationFrame(frame);
 }
 function start(){cancelAnimationFrame(raf);raf=0;previousFrame=null;angularVelocity=0;render();if(visible&&!document.hidden&&!paused)raf=requestAnimationFrame(frame)}
 new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;start()},{rootMargin:'80px'}).observe(host);document.addEventListener('visibilitychange',start);start();
})();
