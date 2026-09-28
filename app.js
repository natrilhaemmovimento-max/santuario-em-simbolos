
const $=s=>document.querySelector(s);
let symbols=[];
let activeCat='Todos';
const favKey='santuario-favs-v1',doneKey='santuario-done-v1';
let favs=new Set(JSON.parse(localStorage.getItem(favKey)||'[]'));
let done=new Set(JSON.parse(localStorage.getItem(doneKey)||'[]'));
let deferredInstall=null;
let currentUtterance=null;
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstall=e;});

function save(){
 localStorage.setItem(favKey,JSON.stringify([...favs]));
 localStorage.setItem(doneKey,JSON.stringify([...done]));
}
function nav(active='home'){
 return `<nav class="bottomnav">
  <button data-nav="home" class="${active==='home'?'active':''}">🏠<br>Início</button>
  <button data-nav="symbols" class="${active==='symbols'?'active':''}">🧩<br>Símbolos</button>
  <button data-nav="favorites" class="${active==='favorites'?'active':''}">⭐<br>Favoritos</button>
  <button data-nav="more" class="${active==='more'?'active':''}">☰<br>Mais</button>
 </nav>`;
}
function bindNav(){
 document.querySelectorAll('[data-nav]').forEach(b=>b.onclick=()=>{
  const n=b.dataset.nav;
  if(n==='home') home();
  if(n==='symbols') listPage();
  if(n==='favorites') favoritesPage();
  if(n==='more') morePage();
 });
}
function card(s){
 return `<article class="card">
   <button class="fav ${favs.has(s.id)?'on':''}" data-fav="${s.id}" aria-label="Favorito">★</button>
   <div data-open="${s.id}">
    <img src="${s.image}" alt="${s.title}">
    <div class="card-body">
      <div class="cat">${s.category}</div>
      <h3>${s.title}</h3>
      <small>${s.reference}</small>
    </div>
   </div>
 </article>`;
}
function progress(){
 const pct=symbols.length?Math.round(done.size/symbols.length*100):0;
 return `<div class="progressbox"><strong>${done.size} de ${symbols.length} concluídos</strong>
 <div class="progressbar"><i style="width:${pct}%"></i></div></div>`;
}
function bindCards(){
 document.querySelectorAll('[data-open]').forEach(el=>el.onclick=()=>studyPage(el.dataset.open));
 document.querySelectorAll('[data-fav]').forEach(el=>el.onclick=e=>{
  e.stopPropagation(); const id=el.dataset.fav;
  favs.has(id)?favs.delete(id):favs.add(id);save(); el.classList.toggle('on');
 });
}
function home(){
 stopAudio();
 const featured=symbols.slice(0,12);
 $('#app').innerHTML=`<div class="app">
  <section class="hero">
   <img src="assets/cover.jpg" alt="Santuário">
   <div class="hero-copy">
    <h1>Santuário em Símbolos</h1>
    <p>O plano da salvação revelado na Bíblia</p>
    <div class="hero-actions">
     <button data-start>Explorar os 60 estudos</button>
     <button class="secondary" data-share>Compartilhar</button>
    </div>
   </div>
  </section>
  ${progress()}
  <h2 style="font-family:Georgia,serif;color:var(--gold2)">Símbolos em destaque</h2>
  <div class="grid">${featured.map(card).join('')}</div>
 </div>${nav('home')}`;
 bindNav();bindCards();
 $('[data-start]').onclick=()=>listPage();
 $('[data-share]').onclick=()=>shareApp();
}
function listPage(){
 stopAudio();
 const cats=['Todos',...new Set(symbols.map(s=>s.category))];
 $('#app').innerHTML=`<div class="app">
  <h1 style="color:var(--gold2);font-family:Georgia,serif">Todos os símbolos</h1>
  <div class="toolbar"><input id="q" class="search" placeholder="Buscar símbolo, texto ou tema..."><div class="counter">${symbols.length}</div></div>
  <div class="chips">${cats.map(c=>`<button class="chip ${c===activeCat?'active':''}" data-cat="${c}">${c}</button>`).join('')}</div>
  <div id="grid" class="grid"></div>
 </div>${nav('symbols')}`;
 bindNav();
 const render=()=>{
  const q=$('#q').value.toLowerCase().trim();
  const list=symbols.filter(s=>(activeCat==='Todos'||s.category===activeCat)&&
   `${s.title} ${s.reference} ${s.what} ${s.represents} ${s.how} ${s.terms}`.toLowerCase().includes(q));
  $('#grid').innerHTML=list.length?list.map(card).join(''):`<div class="empty">Nenhum símbolo encontrado.</div>`;
  $('.counter').textContent=list.length;bindCards();
 };
 $('#q').oninput=render;
 document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{activeCat=b.dataset.cat;listPage();});
 render();
}
function studyPage(id){
 stopAudio();
 const s=symbols.find(x=>x.id===id); if(!s)return;
 $('#app').innerHTML=`<div class="app">
  <section class="study-head"><img src="${s.image}" alt="${s.title}">
   <div class="study-title"><h1>${s.title}</h1><p>${s.category} • ${s.reference}</p></div>
  </section>
  <div class="study-actions">
   <button data-back>← Voltar</button>
   <button data-favstudy>${favs.has(s.id)?'★ Favorito':'☆ Favoritar'}</button>
   <button data-listen>🔊 Ouvir</button>
   <button data-stop>⏹ Parar</button>
   <button data-done>${done.has(s.id)?'✓ Concluído':'○ Marcar concluído'}</button>
  </div>
  <div class="audio-status" id="audioStatus"></div>
  <section class="block"><h2>O que era?</h2><p>${s.what}</p></section>
  <section class="block"><h2>O que representa?</h2><p>${s.represents}</p></section>
  <section class="block"><h2>Como chegamos a essa conclusão?</h2><p>${s.how}</p></section>
  <section class="block terms"><h2>Termos que fazem diferença</h2><p>${s.terms}</p></section>
  <section class="block"><h2>Cristo revelado nesse símbolo</h2><p>${s.christ}</p></section>
  <section class="block"><h2>Aplicação espiritual</h2><p>${s.application}</p></section>
 </div>${nav('')}`;
 bindNav();
 $('[data-back]').onclick=()=>history.length>1?history.back():listPage();
 $('[data-favstudy]').onclick=()=>{favs.has(s.id)?favs.delete(s.id):favs.add(s.id);save();studyPage(s.id);};
 $('[data-done]').onclick=()=>{done.has(s.id)?done.delete(s.id):done.add(s.id);save();studyPage(s.id);};
 $('[data-listen]').onclick=()=>speakStudy(s);
 $('[data-stop]').onclick=()=>stopAudio(true);
}
function favoritesPage(){
 stopAudio();
 const list=symbols.filter(s=>favs.has(s.id));
 $('#app').innerHTML=`<div class="app"><h1 style="color:var(--gold2);font-family:Georgia,serif">Favoritos</h1>
 ${list.length?`<div class="grid">${list.map(card).join('')}</div>`:`<div class="empty">Você ainda não favoritou nenhum símbolo.</div>`}
 </div>${nav('favorites')}`;
 bindNav();bindCards();
}
function morePage(){
 stopAudio();
 $('#app').innerHTML=`<div class="app">
  <h1 style="color:var(--gold2);font-family:Georgia,serif">Mais</h1>
  ${progress()}
  <div class="more-card"><h2>📲 Instalar no celular</h2><p>Use o app como aplicativo, direto da tela inicial.</p><button class="primary" data-install>Instalar app</button></div>
  <div class="more-card"><h2>💙 Compartilhar com alguém</h2><p>Envie o Santuário em Símbolos para um amigo ou familiar.</p><button class="primary" data-share>Compartilhar</button></div>
  <div class="more-card"><h2>Sobre o projeto</h2><p>60 estudos visuais para compreender o Santuário, sua ligação com Cristo e o ministério celestial.</p></div>
 </div>${nav('more')}`;
 bindNav(); $('[data-install]').onclick=installApp; $('[data-share]').onclick=shareApp;
}
async function installApp(){
 if(deferredInstall){deferredInstall.prompt();await deferredInstall.userChoice;deferredInstall=null;return;}
 alert('No Chrome, abra o menu ⋮ e escolha “Instalar app” ou “Adicionar à tela inicial”.');
}
async function shareApp(){
 const data={title:'Santuário em Símbolos',text:'O plano da salvação revelado na Bíblia.',url:location.origin+'/'};
 try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(data.url);alert('Link copiado.');}}catch(e){}
}
function normalizeSpeech(t){
 return String(t)
 .replace(/\b144\.000\b/g,'cento e quarenta e quatro mil')
 .replace(/\b1\.260\b/g,'mil duzentos e sessenta')
 .replace(/\b666\b/g,'seiscentos e sessenta e seis')
 .replace(/(\d{1,3}):(\d{1,3})(?:-(\d{1,3}))?/g,(_,c,v,v2)=>`capítulo ${c}, versículo${v2?'s':''} ${v}${v2?' a '+v2:''}`);
}
function speakStudy(s){
 stopAudio();
 const txt=normalizeSpeech(`${s.title}. Referência: ${s.reference}. O que era. ${s.what}. O que representa. ${s.represents}. Como chegamos a essa conclusão. ${s.how}. Termos importantes. ${s.terms}. Cristo revelado. ${s.christ}. Aplicação espiritual. ${s.application}.`);
 if(!('speechSynthesis'in window)){alert('Seu navegador não oferece leitura em voz alta.');return;}
 currentUtterance=new SpeechSynthesisUtterance(txt);currentUtterance.lang='pt-BR';currentUtterance.rate=.95;
 currentUtterance.onstart=()=>{$('#audioStatus').textContent='🔊 Lendo o estudo...';};
 currentUtterance.onend=()=>{$('#audioStatus').textContent='✓ Leitura concluída.';currentUtterance=null;};
 speechSynthesis.speak(currentUtterance);
}
function stopAudio(show=false){
 if('speechSynthesis'in window)speechSynthesis.cancel();currentUtterance=null;
 if(show&&$('#audioStatus'))$('#audioStatus').textContent='⏹ Leitura parada.';
}
window.addEventListener('hashchange',()=>{const m=location.hash.match(/^#study=(.+)$/);if(m)studyPage(m[1]);});
fetch('content/simbolos.json').then(r=>r.json()).then(d=>{symbols=d;home();});
