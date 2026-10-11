'use strict';
/* Macro Journal – personal calorie tracker. Plain JS, data in localStorage. */
const KEY='macroJournal.v1';
const MEALS=['Breakfast','Lunch','Dinner','Snacks'];
const DEF={settings:{cal:2000,p:150,c:200,f:65,done:false},custom:[],recent:[],entries:{},weights:[]};
let S=load();
let view={tab:'diary',date:todayStr()};

function load(){try{const j=JSON.parse(localStorage.getItem(KEY));if(j)return Object.assign(structuredClone(DEF),j,{settings:Object.assign({},DEF.settings,j.settings)})}catch(e){}return structuredClone(DEF)}
function save(){localStorage.setItem(KEY,JSON.stringify(S))}
function pad(n){return String(n).padStart(2,'0')}
function dstr(d){return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())}
function todayStr(){return dstr(new Date())}
function shift(s,n){const [y,m,d]=s.split('-').map(Number);return dstr(new Date(y,m-1,d+n))}
function pretty(s){const t=todayStr();if(s===t)return'Today';if(s===shift(t,-1))return'Yesterday';if(s===shift(t,1))return'Tomorrow';const [y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'})}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const r1=n=>Math.round(n*10)/10, r0=Math.round;
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
const num=v=>{const n=parseFloat(v);return isFinite(n)&&n>=0?n:0};
const $=s=>document.querySelector(s);

/* ---- logic ---- */
function dayEntries(d){return S.entries[d]||[]}
function totals(d){const t={cal:0,p:0,c:0,f:0};for(const e of dayEntries(d)){t.cal+=e.cal*e.qty;t.p+=e.p*e.qty;t.c+=e.c*e.qty;t.f+=e.f*e.qty}return t}
function addEntry(d,e){(S.entries[d]=S.entries[d]||[]).push(Object.assign({id:uid()},e));pushRecent(e);save()}
function pushRecent(e){const key=e.name+'|'+(e.brand||'');S.recent=S.recent.filter(r=>r.name+'|'+(r.brand||'')!==key);S.recent.unshift({name:e.name,brand:e.brand||'',bases:e.bases||[{unit:e.unit,cal:e.cal,p:e.p,c:e.c,f:e.f,qty:1}]});S.recent=S.recent.slice(0,30)}
function copyDay(from,to){const src=dayEntries(from);src.forEach(e=>(S.entries[to]=S.entries[to]||[]).push(Object.assign({},e,{id:uid()})));save();return src.length}

/* ---- UI helpers ---- */
function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(toast.h);toast.h=setTimeout(()=>t.hidden=true,2400)}
function ring(val,goal,size,stroke,color,inner){const r=(size-stroke)/2,C=2*Math.PI*r,pct=goal>0?Math.min(val/goal,1):0,over=goal>0&&val>goal;
 return `<div class="ring" style="width:${size}px;height:${size}px"><svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--track)" stroke-width="${stroke}"/><circle class="arc" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${over?'var(--over)':color}" stroke-width="${stroke}" stroke-linecap="round" stroke-dasharray="${C*pct} ${C}"/></svg><div class="in">${inner}</div></div>`}
function openModal(html){const m=$('#modal');m.innerHTML=`<div class="sheet">${html}</div>`;m.hidden=false}
function closeModal(){$('#modal').hidden=true;$('#modal').innerHTML=''}

/* ---- views ---- */
function render(){
 document.querySelectorAll('#tabs button').forEach(b=>b.classList.toggle('on',b.dataset.tab===view.tab));
 $('#tabs').style.display=S.settings.done?'flex':'none';
 const app=$('#app');
 if(!S.settings.done){app.innerHTML=setupView();return}
 app.innerHTML={diary:diaryView,foods:foodsView,weight:weightView,settings:settingsView}[view.tab]();
}
function setupView(){const s=S.settings;return `<div class="card"><h1>Welcome 👋</h1><p class="mut">Set your daily targets. You can change them anytime in Settings.</p>${goalFields(s)}<p><button class="btn" data-act="saveSetup" style="width:100%">Start tracking</button></p></div>`}
function goalFields(s){return `<label>Daily calories (kcal)</label><input id="g-cal" type="number" inputmode="numeric" value="${s.cal}">
<div class="grid3"><div><label>Protein (g)</label><input id="g-p" type="number" inputmode="numeric" value="${s.p}"></div><div><label>Carbs (g)</label><input id="g-c" type="number" inputmode="numeric" value="${s.c}"></div><div><label>Fat (g)</label><input id="g-f" type="number" inputmode="numeric" value="${s.f}"></div></div>
<p class="mut" id="g-hint"></p>`}
function readGoals(){S.settings.cal=num($('#g-cal').value)||2000;S.settings.p=num($('#g-p').value);S.settings.c=num($('#g-c').value);S.settings.f=num($('#g-f').value)}

function diaryView(){
 const d=view.date,t=totals(d),g=S.settings,left=g.cal-t.cal;
 const mac=(k,label,col)=>`<div class="macro">${ring(t[k],g[k],54,7,col,`<span class="big">${r0(g[k]-t[k])<0?'+'+r0(t[k]-g[k]):r0(g[k]-t[k])}</span>`)}<div><b>${label}</b><div class="mut">${r0(t[k])} / ${g[k]} g</div></div></div>`;
 let h=`<div class="datenav"><button data-act="day" data-n="-1" aria-label="Previous day">‹</button><div class="d" data-act="today">${pretty(d)}<div class="mut">${d}</div></div><button data-act="day" data-n="1" aria-label="Next day">›</button></div>
 <div class="card"><div class="rings">${ring(t.cal,g.cal,132,14,'var(--acc)',`<div class="big" id="remaining">${r0(Math.abs(left))}</div><div class="mut">${left>=0?'kcal left':'kcal over'}</div>`)}
 <div class="macros">${mac('p','Protein','var(--p)')}${mac('c','Carbs','var(--c)')}${mac('f','Fat','var(--f)')}</div></div>
 <div class="mut" style="margin-top:10px">Eaten <b id="eaten">${r0(t.cal)}</b> of ${g.cal} kcal</div></div>`;
 for(const m of MEALS){
  const es=dayEntries(d).filter(e=>e.meal===m),mk=es.reduce((a,e)=>a+e.cal*e.qty,0);
  h+=`<div class="card meal" data-meal="${m}"><div class="row"><h3>${m}</h3><span class="mut">${r0(mk)} kcal</span><span class="sp"></span><button class="add" data-act="add" data-meal="${m}">+ Add</button></div>`+
  es.map(e=>`<div class="entry" data-act="editEntry" data-id="${e.id}"><div class="n"><b>${esc(e.name)}</b><span class="mut">${r1(e.qty)} × ${esc(e.unit)} · P${r0(e.p*e.qty)} C${r0(e.c*e.qty)} F${r0(e.f*e.qty)}</span></div><span class="k">${r0(e.cal*e.qty)}</span></div>`).join('')+`</div>`;
 }
 h+=`<div class="row" style="justify-content:center"><button class="btn sec sm" data-act="copyPrev">Copy previous day here</button></div>`;
 return h;
}
function foodsView(){
 return `<div class="row"><h2>My foods</h2><span class="sp"></span><button class="btn sm" data-act="newFood">+ New</button></div>`+
 `<div class="card">${S.custom.length?S.custom.map(f=>`<div class="item" data-act="editFood" data-id="${f.id}"><div class="n"><b>${esc(f.name)}</b><span class="mut">${esc(f.serving)} · P${f.p} C${f.c} F${f.f}</span></div><span class="k">${f.cal}</span></div>`).join(''):'<div class="empty">No custom foods yet.<br>Create ones you eat often.</div>'}</div>`;
}
function weightView(){
 const w=[...S.weights].sort((a,b)=>b.date.localeCompare(a.date));
 let chart='';
 if(w.length>=2){const p=[...w].reverse().slice(-30),min=Math.min(...p.map(x=>x.kg)),max=Math.max(...p.map(x=>x.kg)),rg=max-min||1;
  const pts=p.map((x,i)=>`${(i/(p.length-1))*300},${70-((x.kg-min)/rg)*60}`).join(' ');
  chart=`<svg viewBox="0 0 300 76" style="width:100%;height:90px"><polyline points="${pts}" fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round"/></svg>`}
 return `<h2>Weight</h2><div class="card"><div class="grid2"><div><label>Date</label><input id="w-date" type="date" value="${todayStr()}"></div><div><label>Weight (kg)</label><input id="w-kg" type="number" step="0.1" inputmode="decimal"></div></div><p><button class="btn" data-act="addWeight">Log weight</button></p>${chart}</div>
 <div class="card">${w.length?w.map(x=>`<div class="item"><div class="n"><b>${x.kg} kg</b><span class="mut">${x.date}</span></div><button class="add" data-act="delWeight" data-date="${x.date}">Delete</button></div>`).join(''):'<div class="empty">No weigh-ins yet.</div>'}</div>`;
}
function settingsView(){
 return `<h2>Settings</h2><div class="card"><h3>Daily goals</h3>${goalFields(S.settings)}<p><button class="btn" data-act="saveGoals">Save goals</button></p></div>
 <div class="card"><h3>Data</h3><p class="mut">Everything is stored only on this device.</p><div class="row"><button class="btn sec sm" data-act="export">Export JSON</button><button class="btn sec sm" data-act="import">Import JSON</button><input id="imp" type="file" accept="application/json" hidden></div></div>
 <div class="card"><button class="btn danger sm" data-act="wipe">Erase all data</button></div>`;
}

/* ---- add food modal ---- */
let addCtx=null;
function openAdd(meal){addCtx={meal,mode:'recent',results:[],msg:''};drawAdd()}
function drawAdd(){
 const c=addCtx,tabs=[['recent','Recent'],['search','Search'],['mine','My foods'],['barcode','Barcode'],['quick','Quick add']];
 let body='';
 if(c.mode==='recent'||c.mode==='mine'){
  const list=c.mode==='recent'?S.recent:S.custom.map(f=>({name:f.name,brand:'',bases:[{unit:f.serving,cal:f.cal,p:f.p,c:f.c,f:f.f,qty:1}]}));
  c.results=list;
  body=list.length?list.map((f,i)=>itemRow(f,i)).join(''):`<div class="empty">${c.mode==='recent'?'Nothing logged yet.':'No custom foods yet — use Quick add or the Foods tab.'}</div>`;
 }else if(c.mode==='search'){
  body=`<div class="row"><input id="q" placeholder="Search foods (e.g. greek yogurt)" value="${esc(c.q||'')}"><button class="btn" data-act="doSearch">Go</button></div><div id="res">${c.msg?`<div class="empty">${esc(c.msg)}</div>`:c.results.map((f,i)=>itemRow(f,i)).join('')}</div>`;
 }else if(c.mode==='barcode'){
  body=`<div class="row"><input id="bc" inputmode="numeric" placeholder="Barcode number" value="${esc(c.q||'')}"><button class="btn" data-act="doBarcode">Look up</button></div><div id="res">${c.msg?`<div class="empty">${esc(c.msg)}</div>`:c.results.map((f,i)=>itemRow(f,i)).join('')}</div>`;
 }else{
  body=foodForm({},true);
 }
 openModal(`<div class="row"><h3>Add to ${c.meal}</h3><span class="sp"></span><button class="add" data-act="close">Close</button></div><div class="seg">${tabs.map(([k,l])=>`<button data-act="amode" data-m="${k}" class="${c.mode===k?'on':''}">${l}</button>`).join('')}</div>${body}`);
 if(c.mode==='search'||c.mode==='barcode'){const i=$(c.mode==='search'?'#q':'#bc');i&&i.focus()}
}
function itemRow(f,i){const b=f.bases[0];return `<div class="item" data-act="pick" data-i="${i}"><div class="n"><b>${esc(f.name)}</b><span class="mut">${esc(f.brand||'')}${f.brand?' · ':''}${esc(b.unit)}</span></div><span class="k">${r0(b.cal*b.qty)}</span></div>`}
function foodForm(f,quick){
 return `<label>Name</label><input id="f-name" value="${esc(f.name||'')}" placeholder="e.g. Homemade granola">
 <label>Serving description</label><input id="f-serving" value="${esc(f.serving||'1 serving')}">
 <div class="grid2"><div><label>Calories</label><input id="f-cal" type="number" inputmode="decimal" value="${f.cal??''}"></div><div><label>Protein (g)</label><input id="f-p" type="number" inputmode="decimal" value="${f.p??''}"></div><div><label>Carbs (g)</label><input id="f-c" type="number" inputmode="decimal" value="${f.c??''}"></div><div><label>Fat (g)</label><input id="f-f" type="number" inputmode="decimal" value="${f.f??''}"></div></div>
 <div class="row" style="margin-top:14px">${quick?`<label class="row" style="margin:0"><input type="checkbox" id="f-save" checked style="width:auto"> Save to My foods</label><span class="sp"></span><button class="btn" data-act="quickAdd">Add</button>`:`<button class="btn" data-act="saveFood" data-id="${f.id||''}">Save</button>${f.id?`<button class="btn danger" data-act="delFood" data-id="${f.id}">Delete</button>`:''}<button class="btn sec" data-act="close">Cancel</button>`}</div>`;
}
function readFood(){const name=$('#f-name').value.trim();if(!name){toast('Enter a name');return null}return{name,serving:$('#f-serving').value.trim()||'1 serving',cal:num($('#f-cal').value),p:num($('#f-p').value),c:num($('#f-c').value),f:num($('#f-f').value)}}

function openPortion(food,meal,existing){
 const sel=existing?Math.max(0,food.bases.findIndex(b=>b.unit===existing.unit)):0;
 portionCtx={food,meal,existing,sel};
 const b=food.bases[sel],q=existing?existing.qty:b.qty;
 openModal(`<div class="row"><h3>${esc(food.name)}</h3><span class="sp"></span><button class="add" data-act="close">Close</button></div><div class="mut">${esc(food.brand||'')}</div>
 <div class="grid2"><div><label>Quantity</label><input id="pq" type="number" step="any" inputmode="decimal" value="${q}"></div><div><label>Unit</label><select id="pu">${food.bases.map((x,i)=>`<option value="${i}" ${i===sel?'selected':''}>${esc(x.unit)}</option>`).join('')}</select></div></div>
 <label>Meal</label><select id="pm">${MEALS.map(m=>`<option ${m===meal?'selected':''}>${m}</option>`).join('')}</select>
 <div class="card" id="pprev"></div>
 <div class="row"><button class="btn" data-act="confirmPortion">${existing?'Save':'Add to diary'}</button>${existing?'<button class="btn danger" data-act="delEntry">Delete</button>':''}</div>`);
 updatePreview();
}
let portionCtx=null;
function updatePreview(){const x=portionCtx.food.bases[+$('#pu').value],q=num($('#pq').value);$('#pprev').innerHTML=`<b>${r0(x.cal*q)} kcal</b> <span class="mut">· P ${r1(x.p*q)} · C ${r1(x.c*q)} · F ${r1(x.f*q)}</span>`}

/* ---- Open Food Facts ---- */
const OFF='https://world.openfoodfacts.org';
function parseOFF(p){
 const n=p.nutriments||{};const k100=n['energy-kcal_100g']??(n['energy_100g']!=null?n['energy_100g']/4.184:null);
 if(!p.product_name||k100==null)return null;
 const per=(v)=>(Number(v)||0)/100;
 const g={unit:'g',cal:k100/100,p:per(n.proteins_100g),c:per(n.carbohydrates_100g),f:per(n.fat_100g),qty:100};
 const bases=[g],sq=parseFloat(p.serving_quantity);
 if(sq>0)bases.unshift({unit:`serving (${p.serving_size||sq+' g'})`,cal:g.cal*sq,p:g.p*sq,c:g.c*sq,f:g.f*sq,qty:1});
 return{name:p.product_name,brand:(p.brands||'').split(',')[0],bases};
}
async function offFetch(url){
 if(!navigator.onLine)throw new Error('offline');
 const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),12000);
 try{const r=await fetch(url,{signal:ctl.signal});if(!r.ok)throw new Error('http');return await r.json()}finally{clearTimeout(t)}
}
const offErr='Can’t reach Open Food Facts (offline or unavailable). Your diary still works — use Recent, My foods or Quick add.';
async function doSearch(){
 const q=$('#q').value.trim();if(!q)return;addCtx.q=q;$('#res').innerHTML='<div class="empty">Searching…</div>';
 try{const j=await offFetch(`${OFF}/cgi/search.pl?search_terms=${encodeURIComponent(q)}&search_simple=1&action=process&json=1&page_size=25&fields=product_name,brands,nutriments,serving_size,serving_quantity`);
  addCtx.results=(j.products||[]).map(parseOFF).filter(Boolean);addCtx.msg=addCtx.results.length?'':'No results with nutrition data.'}
 catch(e){addCtx.results=[];addCtx.msg=offErr}
 const keep=$('#q').value;drawAdd();$('#q').value=keep;
}
async function doBarcode(){
 const q=$('#bc').value.replace(/\D/g,'');if(!q)return;addCtx.q=q;$('#res').innerHTML='<div class="empty">Looking up…</div>';
 try{const j=await offFetch(`${OFF}/api/v2/product/${q}.json?fields=product_name,brands,nutriments,serving_size,serving_quantity`);
  const f=j.status===1?parseOFF(j.product):null;addCtx.results=f?[f]:[];addCtx.msg=f?'':'Product not found or has no nutrition data.'}
 catch(e){addCtx.results=[];addCtx.msg=offErr}
 drawAdd();
}

/* ---- events ---- */
document.addEventListener('click',async ev=>{
 const tab=ev.target.closest('#tabs button');if(tab){view.tab=tab.dataset.tab;render();window.scrollTo(0,0);return}
 if(ev.target.id==='modal'){closeModal();return}
 const el=ev.target.closest('[data-act]');if(!el)return;const a=el.dataset.act,D=el.dataset;
 switch(a){
  case'saveSetup':readGoals();S.settings.done=true;save();render();break;
  case'saveGoals':readGoals();save();toast('Goals saved');render();break;
  case'day':view.date=shift(view.date,+D.n);render();break;
  case'today':view.date=todayStr();render();break;
  case'add':openAdd(D.meal);break;
  case'close':closeModal();break;
  case'amode':addCtx.mode=D.m;addCtx.msg='';addCtx.results=[];addCtx.q='';drawAdd();break;
  case'doSearch':doSearch();break;
  case'doBarcode':doBarcode();break;
  case'pick':openPortion(addCtx.results[+D.i],addCtx.meal);break;
  case'quickAdd':{const f=readFood();if(!f)break;if($('#f-save').checked)S.custom.push(Object.assign({id:uid()},f));
   addEntry(view.date,{meal:addCtx.meal,name:f.name,unit:f.serving,qty:1,cal:f.cal,p:f.p,c:f.c,f:f.f});closeModal();render();toast('Added');break}
  case'confirmPortion':{const{food,meal,existing}=portionCtx,x=food.bases[+$('#pu').value],q=num($('#pq').value),m=$('#pm').value;if(!q){toast('Enter a quantity');break}
   const data={meal:m,name:food.name,brand:food.brand,unit:x.unit,qty:q,cal:x.cal,p:x.p,c:x.c,f:x.f,bases:food.bases};
   if(existing){Object.assign(existing,data)}else addEntry(view.date,data);save();closeModal();render();toast(existing?'Updated':'Added');break}
  case'editEntry':{const e=dayEntries(view.date).find(x=>x.id===D.id);if(e)openPortion({name:e.name,brand:e.brand,bases:e.bases||[{unit:e.unit,cal:e.cal,p:e.p,c:e.c,f:e.f,qty:1}]},e.meal,e);break}
  case'delEntry':{const e=portionCtx.existing;S.entries[view.date]=dayEntries(view.date).filter(x=>x.id!==e.id);save();closeModal();render();toast('Deleted');break}
  case'copyPrev':{const n=copyDay(shift(view.date,-1),view.date);toast(n?`Copied ${n} entries`:'Nothing to copy');render();break}
  case'newFood':openModal(`<h3>New food</h3>${foodForm({})}`);break;
  case'editFood':openModal(`<h3>Edit food</h3>${foodForm(S.custom.find(f=>f.id===D.id))}`);break;
  case'saveFood':{const f=readFood();if(!f)break;if(D.id)Object.assign(S.custom.find(x=>x.id===D.id),f);else S.custom.push(Object.assign({id:uid()},f));save();closeModal();render();break}
  case'delFood':S.custom=S.custom.filter(f=>f.id!==D.id);save();closeModal();render();break;
  case'addWeight':{const kg=num($('#w-kg').value),d=$('#w-date').value;if(!kg||!d){toast('Enter date and weight');break}S.weights=S.weights.filter(w=>w.date!==d);S.weights.push({date:d,kg});save();render();break}
  case'delWeight':S.weights=S.weights.filter(w=>w.date!==D.date);save();render();break;
  case'export':{const a2=document.createElement('a');a2.href=URL.createObjectURL(new Blob([JSON.stringify(S,null,1)],{type:'application/json'}));a2.download='macro-journal-'+todayStr()+'.json';a2.click();break}
  case'import':$('#imp').click();break;
  case'wipe':if(confirm('Erase ALL data on this device?')){localStorage.removeItem(KEY);S=load();view.date=todayStr();render()}break;
 }
});
document.addEventListener('input',ev=>{
 if(ev.target.id==='pq'||ev.target.id==='pu'){if(ev.target.id==='pu'){const b=portionCtx.food.bases[+ev.target.value];$('#pq').value=b.qty}updatePreview()}
});
document.addEventListener('change',ev=>{
 if(ev.target.id==='imp'){const f=ev.target.files[0];if(!f)return;f.text().then(t=>{try{const j=JSON.parse(t);S=Object.assign(structuredClone(DEF),j);save();render();toast('Imported')}catch(e){toast('Invalid file')}})}
});
document.addEventListener('keydown',ev=>{if(ev.key==='Enter'){if(ev.target.id==='q')doSearch();if(ev.target.id==='bc')doBarcode()}});

render();
window.MJ={get state(){return S},totals,todayStr};
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
