import core, {requireUser, sameOrigin} from './index.js';
import {cleanState, freshState} from '../public/core.mjs';
import {ICON_DATA} from './icon-data.mjs';

const json=(body,status=200)=>Response.json(body,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});

async function archiveUser(request,env){
  if(!env.SITE_AUTH)return requireUser(request,env.DB);
  // These headers are inserted by Sites' authenticated dispatch. Never use
  // caller-supplied identity headers on the ordinary Cloudflare deployment.
  const uid=request.headers.get('oai-authenticated-user-id');
  const email=request.headers.get('oai-authenticated-user-email');
  if(!uid||!email)return null;
  const id='sites:'+uid;
  let name='مالك المكتبة';
  const encoded=request.headers.get('oai-authenticated-user-full-name');
  if(encoded&&request.headers.get('oai-authenticated-user-full-name-encoding')==='percent-encoded-utf-8'){
    try{name=decodeURIComponent(encoded).slice(0,80)||name;}catch{}
  }
  await env.DB.prepare(`INSERT INTO users (id,username,username_key,password_hash,password_salt,created_at) VALUES (?,?,?,?,?,?)
    ON CONFLICT(id) DO UPDATE SET username=excluded.username`).bind(id,name,id,'sites-managed','sites-managed',Date.now()).run();
  return {id,username:name,authMethod:'sites',signOutPath:'/signout-with-chatgpt?return_to=%2F'};
}

async function stateRoute(request,env){
  if(!env.DB)return json({error:'خدمة المزامنة غير متاحة الآن.'},503);
  if(request.method!=='GET'&&request.method!=='POST')return json({error:'الطريقة غير مسموحة'},405);
  if(request.method==='POST'&&!sameOrigin(request))return json({error:'طلب غير مسموح'},403);
  const user=await archiveUser(request,env);
  if(!user)return json({error:'يجب تسجيل الدخول'},401);
  const row=await env.DB.prepare('SELECT payload, revision FROM personal_archives WHERE user_id = ?').bind(user.id).first();
  if(request.method==='GET'){
    if(row)return json({state:cleanState(JSON.parse(row.payload)),revision:Number(row.revision)});
    if(env.SITE_AUTH)return json({state:freshState(),revision:0});
    // Read the existing account's lists/reviews without changing or deleting them.
    const legacyResponse=await core.fetch(new Request(new URL('/api/library',request.url),{headers:request.headers}),env);
    if(!legacyResponse.ok)return legacyResponse;
    const legacy=await legacyResponse.json();
    return json({state:cleanState({...freshState(),...legacy}),revision:0});
  }
  if(!(request.headers.get('Content-Type')||'').includes('application/json'))return json({error:'يجب إرسال JSON'},415);
  const text=await request.text();
  if(new TextEncoder().encode(text).length>1024*1024)return json({error:'المكتبة أكبر من الحد المسموح للمزامنة'},413);
  let body;try{body=JSON.parse(text);}catch{return json({error:'بيانات غير صالحة'},400);}
  const expected=Number(body.baseRevision);
  if(!Number.isSafeInteger(expected)||expected<0||!body.state||typeof body.state!=='object')return json({error:'بيانات غير صالحة'},400);
  if(expected!==Number(row?.revision||0))return json({error:'تغيّرت مكتبتك على جهاز آخر. ادمج النسختين قبل الحفظ.',revision:Number(row?.revision||0)},409);
  const state=cleanState(body.state);
  const result=await env.DB.prepare(`INSERT INTO personal_archives (user_id,payload,revision,updated_at) VALUES (?,?,1,?)
    ON CONFLICT(user_id) DO UPDATE SET payload=excluded.payload,revision=personal_archives.revision+1,updated_at=excluded.updated_at
    WHERE personal_archives.revision=? RETURNING revision`).bind(user.id,JSON.stringify(state),Date.now(),expected).first();
  if(!result)return json({error:'تغيّرت مكتبتك على جهاز آخر. ادمج النسختين قبل الحفظ.'},409);
  return json({ok:true,revision:Number(result.revision)});
}

export default {
  async fetch(request,env,ctx){
    const path=new URL(request.url).pathname;
    if(env.SITE_AUTH&&path==='/api/auth/me'){
      try{return json({user:await archiveUser(request,env)});}catch{return json({error:'تعذر تحميل حساب المكتبة'},503);}
    }
    if(env.SITE_AUTH&&path.startsWith('/api/auth/'))return json({error:'تدير المنصة تسجيل الدخول إلى هذه النسخة الخاصة.'},405);
    if(path.startsWith('/icons/')){
      const size=path.match(/^\/icons\/(180|192|512)\.png$/)?.[1];
      if(!size)return new Response('Not found',{status:404});
      const bytes=Uint8Array.from(atob(ICON_DATA[size]),c=>c.charCodeAt(0));
      return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=86400','X-Content-Type-Options':'nosniff'}});
    }
    if(path==='/api/state'){
      try{return await stateRoute(request,env);}catch(e){console.error('archive_request_failed',e.message);return json({error:'تعذرت مزامنة المكتبة. نسختك المحلية محفوظة.'},500);}
    }
    if(path==='/api/health'){
      try{await env.DB.prepare('SELECT revision FROM personal_archives LIMIT 1').first();return json({ok:true,database:'ready',version:'2.0.0'});}
      catch{return json({ok:false,database:'unavailable'},503);}
    }
    if(path==='/api/catalog/search')return json({error:'يعمل البحث الآن بالكتالوج الموثق داخل التطبيق.'},410);
    const response=await core.fetch(request,env,ctx);
    const headers=new Headers(response.headers);
    headers.set('X-Content-Type-Options','nosniff');headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    if(path==='/sw.js')headers.set('Cache-Control','no-cache');
    if(path.startsWith('/api/'))headers.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
  }
};
