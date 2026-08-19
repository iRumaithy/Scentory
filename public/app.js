const PERFUMES=[{"id":"imagination","name":"Imagination","brand":"Louis Vuitton","year":2021,"rating":4.52,"image":"assets/perfumes_clean/imagination.png","accords":{"Citrus":92,"Amber":79,"Fresh":76,"Tea":71,"Spicy":58},"notes":{"top":["Citron","Calabrian Bergamot","Sicilian Orange"],"middle":["Nigerian Ginger","Cinnamon","Neroli"],"base":["Black Tea","Ambroxan","Guaiac Wood"]},"tags":["Summer","Day","Fresh"],"similar":["hacivat","bal-afrique"]},{"id":"dhi","name":"Dior Homme Intense","brand":"Dior","year":2011,"rating":4.46,"image":"assets/perfumes_clean/dhi.png","accords":{"Iris":95,"Powdery":90,"Woody":72,"Amber":64,"Floral":48},"notes":{"top":["Lavender"],"middle":["Iris","Ambrette","Pear"],"base":["Virginia Cedar","Vetiver"]},"tags":["Winter","Evening","Elegant"],"similar":["layton","jazz-club"]},{"id":"oud-wood","name":"Oud Wood","brand":"Tom Ford","year":2007,"rating":4.3,"image":"assets/perfumes_clean/oud-wood.png","accords":{"Woody":96,"Oud":88,"Spicy":76,"Warm":64,"Aromatic":51},"notes":{"top":["Rosewood","Cardamom","Pepper"],"middle":["Oud","Sandalwood","Vetiver"],"base":["Vanilla","Tonka Bean","Amber"]},"tags":["Autumn","Evening","Woody"],"similar":["reflection","naxos"]},{"id":"naxos","name":"Naxos","brand":"Xerjoff","year":2015,"rating":4.55,"image":"assets/perfumes_clean/naxos.png","accords":{"Honey":94,"Tobacco":87,"Sweet":83,"Vanilla":76,"Aromatic":66},"notes":{"top":["Lavender","Bergamot","Lemon"],"middle":["Honey","Cinnamon","Cashmeran"],"base":["Tobacco","Vanilla","Tonka Bean"]},"tags":["Winter","Evening","Sweet"],"similar":["layton","jazz-club"]},{"id":"aventus","name":"Aventus","brand":"Creed","year":2010,"rating":4.34,"image":"assets/perfumes_clean/aventus.png","accords":{"Fruity":91,"Woody":83,"Fresh":72,"Smoky":61,"Citrus":58},"notes":{"top":["Bergamot","Blackcurrant","Apple","Pineapple"],"middle":["Birch","Patchouli","Jasmine"],"base":["Musk","Oakmoss","Ambergris","Vanilla"]},"tags":["All Season","Day","Versatile"],"similar":["hacivat","bleu"]},{"id":"br540","name":"Baccarat Rouge 540","brand":"Maison Francis Kurkdjian","year":2015,"rating":4.28,"image":"assets/perfumes_clean/br540.png","accords":{"Amber":94,"Woody":82,"Warm":74,"Fresh":55,"Floral":47},"notes":{"top":["Saffron","Jasmine"],"middle":["Amberwood","Ambergris"],"base":["Fir Resin","Cedar"]},"tags":["All Season","Evening","Signature"],"similar":["naxos","layton"]},{"id":"bleu","name":"Bleu de Chanel EDP","brand":"Chanel","year":2014,"rating":4.39,"image":"assets/perfumes_clean/bleu.png","accords":{"Woody":91,"Citrus":80,"Aromatic":77,"Fresh":73,"Amber":55},"notes":{"top":["Grapefruit","Lemon","Mint"],"middle":["Ginger","Nutmeg","Jasmine"],"base":["Incense","Vetiver","Cedar","Sandalwood"]},"tags":["All Season","Office","Versatile"],"similar":["aventus","hacivat"]},{"id":"layton","name":"Layton","brand":"Parfums de Marly","year":2016,"rating":4.47,"image":"assets/perfumes_clean/layton.png","accords":{"Warm":91,"Vanilla":87,"Aromatic":78,"Spicy":74,"Fresh":51},"notes":{"top":["Apple","Lavender","Bergamot"],"middle":["Jasmine","Violet","Geranium"],"base":["Vanilla","Cardamom","Sandalwood","Pepper"]},"tags":["Winter","Evening","Sweet"],"similar":["naxos","dhi"]},{"id":"reflection","name":"Reflection Man","brand":"Amouage","year":2007,"rating":4.34,"image":"assets/perfumes_clean/reflection.png","accords":{"Floral":88,"Woody":82,"Aromatic":71,"Fresh":62,"Powdery":49},"notes":{"top":["Rosemary","Pink Pepper","Petitgrain"],"middle":["Jasmine","Neroli","Orris"],"base":["Sandalwood","Vetiver","Cedar","Patchouli"]},"tags":["Spring","Day","Elegant"],"similar":["oud-wood","bleu"]},{"id":"hacivat","name":"Hacivat","brand":"Nishane","year":2017,"rating":4.4,"image":"assets/perfumes_clean/hacivat.png","accords":{"Woody":92,"Mossy":87,"Citrus":81,"Fruity":68,"Fresh":61},"notes":{"top":["Pineapple","Grapefruit","Bergamot"],"middle":["Cedar","Patchouli","Jasmine"],"base":["Oakmoss","Woody Notes"]},"tags":["Summer","Day","Strong"],"similar":["aventus","bleu"]},{"id":"bal-afrique","name":"Bal d'Afrique","brand":"Byredo","year":2009,"rating":4.18,"image":"assets/perfumes_clean/bal-afrique.png","accords":{"Citrus":86,"Woody":78,"Floral":67,"Fresh":62,"Aromatic":48},"notes":{"top":["Amalfi Lemon","Bergamot","African Marigold"],"middle":["Violet","Cyclamen","Jasmine"],"base":["Vetiver","Musk","Amber","Cedar"]},"tags":["Spring","Day","Fresh"],"similar":["imagination","reflection"]},{"id":"jazz-club","name":"Jazz Club","brand":"Maison Margiela","year":2013,"rating":4.31,"image":"assets/perfumes_clean/jazz-club.png","accords":{"Tobacco":91,"Rum":85,"Vanilla":80,"Warm":72,"Woody":61},"notes":{"top":["Pink Pepper","Neroli","Lemon"],"middle":["Rum","Java Vetiver","Clary Sage"],"base":["Tobacco Leaf","Vanilla","Styrax"]},"tags":["Winter","Night","Cozy"],"similar":["naxos","dhi"]}];
const NOTE_MAP={"Citron":"lemon.jpg","Calabrian Bergamot":"bergamot.jpg","Sicilian Orange":"orange-resin.jpg","Nigerian Ginger":"ginger.jpg","Cinnamon":"cinnamon.jpg","Neroli":"jasmine.jpg","Black Tea":"patchouli.jpg","Ambroxan":"ambroxan.jpg","Guaiac Wood":"sandalwood.jpg","Lavender":"lavender.jpg","Iris":"iris.jpg","Ambrette":"muskcotton.jpg","Pear":"greenfruit.jpg","Virginia Cedar":"cedar.jpg","Vetiver":"vetiver.jpg","Rosewood":"sandalwood.jpg","Cardamom":"cardamom.jpg","Pepper":"pepper.jpg","Oud":"resin.jpg","Sandalwood":"sandalwood.jpg","Vanilla":"vanilla_remote","Tonka Bean":"vanilla_remote","Amber":"resin.jpg","Bergamot":"bergamot.jpg","Lemon":"lemon.jpg","Honey":"amberwood.jpg","Cashmeran":"sandalwood.jpg","Tobacco":"tobacco_remote","Blackcurrant":"redberries.jpg","Apple":"greenfruit.jpg","Pineapple":"greenfruit.jpg","Birch":"cedar.jpg","Patchouli":"patchouli.jpg","Jasmine":"jasmine.jpg","Musk":"muskcotton.jpg","Oakmoss":"patchouli.jpg","Ambergris":"ambroxan.jpg","Saffron":"sichuan.jpg","Amberwood":"amberwood.jpg","Fir Resin":"resin.jpg","Cedar":"cedar.jpg","Grapefruit":"grapefruit.jpg","Mint":"mint.jpg","Ginger":"ginger.jpg","Nutmeg":"nutmeg.jpg","Incense":"incense.jpg","Violet":"lavender.jpg","Geranium":"jasmine.jpg","Rosemary":"patchouli.jpg","Pink Pepper":"pink-pepper.jpg","Petitgrain":"patchouli.jpg","Orris":"iris.jpg","Woody Notes":"sandalwood.jpg","Amalfi Lemon":"lemon.jpg","African Marigold":"jasmine.jpg","Cyclamen":"jasmine.jpg","Rum":"rum_remote","Java Vetiver":"vetiver.jpg","Clary Sage":"patchouli.jpg","Tobacco Leaf":"tobacco_remote","Styrax":"resin.jpg"};
const REMOTE_NOTES={"Vanilla":"https://www.maisonmargiela-fragrances.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-maisonmargiela-us-Library/default/dwcc69b625/images/pdp/MM008/mm_replica_edt_jazz_club_ingredients_vanilla_3605521932105_rvb_1x1%20%282%29.jpg?q=70&sfrm=jpg&sh=326&sm=cut&sw=326","Tonka Bean":"https://www.maisonmargiela-fragrances.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-maisonmargiela-us-Library/default/dwcc69b625/images/pdp/MM008/mm_replica_edt_jazz_club_ingredients_vanilla_3605521932105_rvb_1x1%20%282%29.jpg?q=70&sfrm=jpg&sh=326&sm=cut&sw=326","Rum":"https://www.maisonmargiela-fragrances.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-maisonmargiela-us-Library/default/dwc89daaf8/images/pdp/MM008/mm_replica_edt_jazz_club_ingredients_rum_3605521932105_rvb_1x1%20%281%29.jpg?q=70&sfrm=jpg&sh=326&sm=cut&sw=326","Tobacco":"https://www.maisonmargiela-fragrances.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-maisonmargiela-us-Library/default/dw2dcf9573/images/pdp/MM008/mm_replica_edt_jazz_club_ingredients_tobacco_3605521932105_rvb_1x1%20%281%29.jpg?q=70&sfrm=jpg&sh=326&sm=cut&sw=326","Tobacco Leaf":"https://www.maisonmargiela-fragrances.us/dw/image/v2/AANG_PRD/on/demandware.static/-/Sites-maisonmargiela-us-Library/default/dw2dcf9573/images/pdp/MM008/mm_replica_edt_jazz_club_ingredients_tobacco_3605521932105_rvb_1x1%20%281%29.jpg?q=70&sfrm=jpg&sh=326&sm=cut&sw=326"};
const REMOTE_FALLBACK={"Vanilla":"resin.jpg","Tonka Bean":"nutmeg.jpg","Rum":"amberwood.jpg","Tobacco":"cedar.jpg","Tobacco Leaf":"cedar.jpg"};
const LIST_LABELS={favorite:'المفضلة',try:'أريد تجربتها',buy:'أريد شراءها',owned:'أملكها'};
const ACCORD_COLORS={
  Citrus:['#f0d342','#2b2300'],Woody:['#a36031','#fff5eb'],Aromatic:['#3e988c','#051d1b'],Fresh:['#55b99e','#08251e'],
  Spicy:['#dd5630','#fff4ef'],Warm:['#cf703e','#fff4ec'],Amber:['#c26d1d','#fff4e7'],Vanilla:['#dac190','#32240e'],
  Tobacco:['#8a603b','#fff5e8'],Rum:['#9c603d','#fff3ea'],Honey:['#deb13a','#352600'],Iris:['#a886ca','#21132f'],
  Powdery:['#baa0cc','#20152a'],Floral:['#c97aa2','#2c1320'],Oud:['#67432e','#f9ede4'],Fruity:['#df6d77','#2b1014'],
  Smoky:['#6e7180','#fff'],Mossy:['#68844c','#13240b'],Sweet:['#c678a6','#2a1222']
};
const STORAGE_KEY='scentory-b-v1';
const DEFAULT={lists:{favorite:[],try:[],buy:[],owned:[]},activeList:'favorite',selected:'bleu'};
let state=loadState();
let currentView='discover';
let activeFilter='all';

const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function loadState(){try{return Object.assign(structuredClone(DEFAULT),JSON.parse(localStorage.getItem(STORAGE_KEY)||'{}'))}catch{return structuredClone(DEFAULT)}}
function saveState(){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));updateCounts()}
function byId(id){return PERFUMES.find(p=>p.id===id)}
function isIn(list,id){return state.lists[list]?.includes(id)}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),1500)}
function accordStyle(name){return ACCORD_COLORS[name]||['#72828b','#fff']}
function noteSrc(note){
  if(REMOTE_NOTES[note]) return REMOTE_NOTES[note];
  const v=NOTE_MAP[note]||'resin.jpg';
  if(v.endsWith('_remote')) return REMOTE_NOTES[note]||'assets/notes/resin.jpg';
  return 'assets/notes/'+v;
}
function noteFallback(note){
  return 'assets/notes/'+(REMOTE_FALLBACK[note]||NOTE_MAP[note]||'resin.jpg').replace('_remote','resin.jpg');
}
function imageTag(src,alt,cls=''){return `<img class="${cls}" src="${src}" alt="${alt}" loading="lazy">`}
function stars(){return '★★★★★'}

function card(p){
  return `<article class="perfume-card ${state.selected===p.id?'selected':''}" data-open="${p.id}">
    <button class="card-heart ${isIn('favorite',p.id)?'on':''}" data-fav="${p.id}" aria-label="المفضلة">♡</button>
    <div class="card-image">${imageTag(p.image,p.brand+' '+p.name)}</div>
    <div class="card-copy"><h3>${p.name.toUpperCase()}</h3><div class="brand">${p.brand}</div>
      <div class="card-footer"><strong>${p.rating.toFixed(1)}</strong><span class="star">★</span><small>(${formatVotes(p.votes)})</small></div>
    </div></article>`;
}
function formatVotes(n){if(n>=1000)return (n/1000).toFixed(n>=10000?0:1)+'k';return String(n)}
function bindCards(scope=document){
  scope.querySelectorAll('[data-open]').forEach(el=>el.addEventListener('click',e=>{if(e.target.closest('[data-fav]'))return;selectPerfume(el.dataset.open,true)}));
  scope.querySelectorAll('[data-fav]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();toggleList('favorite',btn.dataset.fav)}));
}

function renderDiscover(){
  const q=$('#searchInput').value.trim().toLowerCase();
  let arr=PERFUMES.filter(p=>{
    const hay=[p.name,p.brand,...Object.keys(p.accords),...Object.values(p.notes).flat(),...p.tags].join(' ').toLowerCase();
    const filterOk=activeFilter==='all'||Object.keys(p.accords).includes(activeFilter)||p.tags.includes(activeFilter);
    return (!q||hay.includes(q))&&filterOk;
  });
  const sort=$('#sortSelect').value;
  if(sort==='rating')arr.sort((a,b)=>b.rating-a.rating);
  if(sort==='year')arr.sort((a,b)=>b.year-a.year);
  if(sort==='name')arr.sort((a,b)=>a.name.localeCompare(b.name));
  $('#resultCount').textContent=arr.length;
  $('#perfumeGrid').innerHTML=arr.map(card).join('');
  bindCards($('#perfumeGrid'));
  $('#bannerBottles').innerHTML=PERFUMES.slice(0,5).map(p=>imageTag(p.image,p.name)).join('');
}
function toggleList(list,id){
  const arr=state.lists[list]||[];
  const on=arr.includes(id);
  state.lists[list]=on?arr.filter(x=>x!==id):[...arr,id];
  saveState();renderAll();
  toast(on?`تمت الإزالة من ${LIST_LABELS[list]}`:`تمت الإضافة إلى ${LIST_LABELS[list]}`);
}
function updateCounts(){
  for(const k of Object.keys(LIST_LABELS)){const el=$('#count-'+k);if(el)el.textContent=state.lists[k].length}
}

function selectPerfume(id,openMobile=false){
  state.selected=id;saveState();renderDetail();renderDiscover();renderLibrary();
  if(openMobile&&matchMedia('(max-width:1020px)').matches)$('#detailPanel').classList.add('open');
}
function renderDetail(){
  const p=byId(state.selected)||PERFUMES[0]; const sims=p.similar.map(byId).filter(Boolean);
  const noteGroup=(title,arr)=>`<div class="note-group"><span class="note-group-title">${title}</span><div class="note-strip">${arr.map(n=>`<div class="note-item"><div class="note-thumb"><img src="${noteSrc(n)}" data-fallback="${noteFallback(n)}" alt="${n}"></div><span title="${n}">${n}</span></div>`).join('')}</div></div>`;
  $('#detailContent').innerHTML=`<button class="detail-mobile-close" id="closeDetail">×</button><article class="detail-card">
    <div class="detail-top">
      <div class="detail-product">${imageTag(p.image,p.brand+' '+p.name)}</div>
      <div><div class="detail-brand">${p.brand.toUpperCase()}</div><h2 class="detail-name">${p.name.toUpperCase()}</h2><div class="detail-type">Eau de Parfum</div>
        <div class="detail-tags"><span>${p.year}</span>${p.tags.slice(0,2).map(t=>`<span>${t}</span>`).join('')}</div>
        <div class="detail-rating"><strong>${p.rating.toFixed(1)}</strong><span>${stars()}</span><small>(${p.votes.toLocaleString('en-US')})</small></div>
      </div>
    </div>
    <div class="detail-actions">
      <button class="favorite ${isIn('favorite',p.id)?'on':''}" data-list="favorite">♡ ${LIST_LABELS.favorite}</button>
      <button class="${isIn('try',p.id)?'on':''}" data-list="try">♧ ${LIST_LABELS.try}</button>
      <button class="${isIn('buy',p.id)?'on':''}" data-list="buy">▢ ${LIST_LABELS.buy}</button>
      <button class="${isIn('owned',p.id)?'on':''}" data-list="owned">✓ ${LIST_LABELS.owned}</button>
    </div>
    <div class="detail-section"><div class="section-label"><h3>MAIN ACCORDS</h3><small>الأكوردات الرئيسية</small></div>
      ${Object.entries(p.accords).map(([a,v])=>{const [c,fg]=accordStyle(a);return `<div class="accord-row"><div class="accord-track"><div class="accord-fill" style="width:${Math.max(18,v)}%;background:${c};--label-color:${fg}">${a}</div></div><small>${v}%</small></div>`}).join('')}
    </div>
    <div class="detail-section"><div class="section-label"><h3>NOTES</h3><small>النوتات</small></div>
      ${noteGroup('TOP NOTES',p.notes.top)}${noteGroup('MIDDLE NOTES',p.notes.middle)}${noteGroup('BASE NOTES',p.notes.base)}
    </div>
    <div class="detail-section"><div class="section-label"><h3>REMinds me of</h3><small>يشبه</small></div><div class="similar-strip">
      ${sims.map((s,i)=>`<button class="similar-card" data-sim="${s.id}">${imageTag(s.image,s.name)}<b>${s.name}</b><small>${i?60:68}% Similar</small></button>`).join('')}
    </div></div>
  </article>`;
  $('#detailContent').querySelectorAll('[data-list]').forEach(b=>b.addEventListener('click',()=>toggleList(b.dataset.list,p.id)));
  $('#detailContent').querySelectorAll('[data-sim]').forEach(b=>b.addEventListener('click',()=>selectPerfume(b.dataset.sim,true)));
  $('#detailContent').querySelectorAll('.note-thumb img').forEach(img=>img.addEventListener('error',()=>{if(img.dataset.fallback&&img.src!==img.dataset.fallback)img.src=img.dataset.fallback}));
  const close=$('#closeDetail');if(close)close.addEventListener('click',()=>$('#detailPanel').classList.remove('open'));
}

function renderLibrary(){
  $('#libraryTabs').innerHTML=Object.entries(LIST_LABELS).map(([k,v])=>`<button class="${state.activeList===k?'active':''}" data-library="${k}">${v} (${state.lists[k].length})</button>`).join('');
  $('#libraryTabs').querySelectorAll('[data-library]').forEach(b=>b.addEventListener('click',()=>{state.activeList=b.dataset.library;saveState();renderLibrary()}));
  const arr=state.lists[state.activeList].map(byId).filter(Boolean);
  $('#libraryGrid').innerHTML=arr.map(card).join('');bindCards($('#libraryGrid'));$('#libraryEmpty').classList.toggle('hidden',arr.length>0);
}

function renderCollections(){
  const counts={};
  PERFUMES.forEach(p=>{Object.keys(p.accords).slice(0,4).forEach(a=>counts[a]=(counts[a]||0)+1);p.tags.slice(0,1).forEach(t=>counts[t]=(counts[t]||0)+1)});
  const top=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,12);
  $('#collectionsGrid').innerHTML=top.map(([name,n])=>`<button class="collection-card" data-collection="${name}"><small>SMART COLLECTION</small><strong>${name}</strong><em>${n} عطر</em></button>`).join('');
  $('#collectionsGrid').querySelectorAll('[data-collection]').forEach(b=>b.addEventListener('click',()=>openCollection(b.dataset.collection)));
}
function openCollection(name){
  $('#collectionsGrid').classList.add('hidden');$('#collectionResult').classList.remove('hidden');$('#collectionTitle').textContent=name;
  const arr=PERFUMES.filter(p=>p.accords[name]||p.tags.includes(name));$('#collectionGrid').innerHTML=arr.map(card).join('');bindCards($('#collectionGrid'));
}

function renderDNA(){
  const ids=[...new Set([...state.lists.favorite,...state.lists.owned])];const totals={};
  ids.map(byId).filter(Boolean).forEach(p=>Object.entries(p.accords).forEach(([a,v])=>totals[a]=(totals[a]||0)+v));
  const ranked=Object.entries(totals).sort((a,b)=>b[1]-a[1]).slice(0,8);const max=ranked[0]?.[1]||1;
  $('#dnaCount').textContent=ids.length;
  $('#dnaBars').innerHTML=ranked.length?ranked.map(([a,v])=>{const [c]=accordStyle(a);const pct=Math.round(v/max*100);return `<div class="dna-row"><header><span>${a}</span><b>${pct}%</b></header><div class="dna-track"><div class="dna-fill" style="width:${pct}%;background:${c}"></div></div></div>`}).join(''):'<div class="empty-state"><p>أضف عطورًا إلى المفضلة أو «أملكها» لبدء التحليل.</p></div>';
  $('#dnaInsight').innerHTML=ranked.length?`ذوقك يميل حاليًا إلى <b style="color:#efcf90">${ranked[0][0]}</b>${ranked[1]?` ثم <b style="color:#efcf90">${ranked[1][0]}</b>`:''}. يزداد التحليل دقة كلما كبرت مكتبتك.`:'ابدأ ببناء مكتبتك، وسيظهر هنا تحليل مرئي لذوقك العطري.';
}
function renderCompare(){
  const opts=PERFUMES.map(p=>`<option value="${p.id}">${p.name} — ${p.brand}</option>`).join('');
  [['compareA','bleu'],['compareB','imagination'],['compareC','oud-wood']].forEach(([id,val])=>{const e=$('#'+id);if(!e.dataset.ready){e.innerHTML=opts;e.value=val;e.dataset.ready='1';e.addEventListener('change',renderCompare)}});
  const items=[$('#compareA').value,$('#compareB').value,$('#compareC').value].map(byId);
  $('#compareGrid').innerHTML=items.map(p=>`<article class="compare-card">${imageTag(p.image,p.name)}<h3>${p.name}</h3><div class="metric">${p.brand}</div><div class="metric">★ ${p.rating.toFixed(2)} — ${p.year}</div>${Object.entries(p.accords).slice(0,5).map(([a,v])=>`<div class="metric">${a} — ${v}%</div>`).join('')}<div class="metric">${[...p.notes.top,...p.notes.middle,...p.notes.base].slice(0,6).join(' • ')}</div></article>`).join('');
}
function switchView(view){
  currentView=view;$$('.view').forEach(v=>v.classList.toggle('active',v.id==='view-'+view));
  $$('.nav-link[data-view],.mobile-nav-btn[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===view));
  if(view==='library')renderLibrary();if(view==='collections')renderCollections();if(view==='dna')renderDNA();if(view==='compare')renderCompare();
  scrollTo({top:0,behavior:'smooth'});
}
function renderAll(){updateCounts();renderDiscover();renderDetail();renderLibrary();renderCollections();renderDNA();renderCompare()}

function init(){
  renderAll();
  $$('.filter-chip').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;$$('.filter-chip').forEach(x=>x.classList.toggle('active',x===b));renderDiscover()}));
  $('#searchInput').addEventListener('input',renderDiscover);$('#sortSelect').addEventListener('change',renderDiscover);
  $('#clearSearch').addEventListener('click',()=>{$('#searchInput').value='';renderDiscover();$('#searchInput').focus()});
  $$('.nav-link[data-view],.mobile-nav-btn[data-view]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.list)state.activeList=b.dataset.list;switchView(b.dataset.view);if(b.dataset.focusSearch)$('#searchInput').focus()}));
  $$('[data-view-jump]').forEach(b=>b.addEventListener('click',()=>switchView(b.dataset.viewJump)));
  $('#backCollections').addEventListener('click',()=>{$('#collectionsGrid').classList.remove('hidden');$('#collectionResult').classList.add('hidden')});
  $('#profileButton').addEventListener('click',()=>toast('تسجيل الدخول والمزامنة سنربطهما مع Cloudflare D1 في المرحلة التالية.'));
  $('#quickProfile').addEventListener('click',()=>toast('الحفظ محلي حاليًا — سنفعّل الحساب والمزامنة بعد ربط Cloudflare.'));
  $('#themeToggle').addEventListener('click',()=>toast('تم اعتماد التصميم الداكن الفاخر كهوية أساسية.'));
  $('#mobileFilters').addEventListener('click',()=>document.querySelector('.filter-row').scrollIntoView({behavior:'smooth',block:'center'}));
  $('#detailPanel').addEventListener('click',e=>{if(matchMedia('(max-width:1020px)').matches&&e.target===$('#detailPanel'))$('#detailPanel').classList.remove('open')});
}
document.addEventListener('DOMContentLoaded',init);
