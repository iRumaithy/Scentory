// Build a self-contained Worker for the private Sites beta. Production keeps
// Wrangler Static Assets and the same API module. No private API is cached.
import {readFile,writeFile,mkdir,readdir,rm,copyFile} from 'node:fs/promises';
import {resolve,extname,relative} from 'node:path';
import {build} from 'esbuild';
const root=process.cwd(),dist=resolve(root,'dist');
const manifest=JSON.parse(await readFile(resolve(root,'.openai/hosting.json'),'utf8'));
if(!manifest.project_id||manifest.d1!=='DB')throw new Error('A registered private Site with DB binding is required.');
await rm(dist,{recursive:true,force:true});await mkdir(resolve(dist,'server'),{recursive:true});await mkdir(resolve(dist,'.openai/drizzle/meta'),{recursive:true});
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
const essential=['index.html','styles.css','app.js','core.mjs','catalog.json','manifest.webmanifest','sw.js','assets/icon.svg'];
const oldImages=(await readdir(resolve(root,'public/assets/perfumes_clean'))).filter(f=>f.endsWith('.png')).map(f=>'assets/perfumes_clean/'+f);
const assets={};for(const f of [...essential,...oldImages]){const buf=await readFile(resolve(root,'public',f));const binary=['.png','.webp'].includes(extname(f));assets['/'+f]={type:types[extname(f)]||'application/octet-stream',data:binary?buf.toString('base64'):buf.toString('utf8'),binary};}
assets['/']=assets['/index.html'];
const entry=`import app from './src/index-v200.js';
const assets=${JSON.stringify(assets)};
function serve(request){const path=new URL(request.url).pathname;const item=assets[path];if(!item)return new Response('Not found',{status:404});const data=item.binary?Uint8Array.from(atob(item.data),c=>c.charCodeAt(0)):item.data;return new Response(request.method==='HEAD'?null:data,{headers:{'Content-Type':item.type,'Cache-Control':path==='/'||path==='/index.html'||path==='/sw.js'?'no-cache':'public, max-age=3600'}});}
export default {fetch(request,env,ctx){return app.fetch(request,{...env,SITE_AUTH:true,ASSETS:{fetch:serve}},ctx)}};`;
await build({stdin:{contents:entry,resolveDir:root,sourcefile:'scentory-sites-entry.mjs'},bundle:true,format:'esm',platform:'neutral',target:'es2022',external:['node:crypto'],outfile:resolve(dist,'server/index.js'),minify:true,legalComments:'none'});
await copyFile(resolve(root,'.openai/hosting.json'),resolve(dist,'.openai/hosting.json'));
const sqls=[];for(const file of ['0001_auth_library.sql','0003_personal_archive.sql'])sqls.push(await readFile(resolve(root,'migrations',file),'utf8'));
const sql=sqls.join('\n').split(/;\s*(?:\n|$)/).map(x=>x.trim()).filter(Boolean).join(';\n--> statement-breakpoint\n')+';\n';
await writeFile(resolve(dist,'.openai/drizzle/0000_scentory_archive.sql'),sql);
await writeFile(resolve(dist,'.openai/drizzle/meta/_journal.json'),JSON.stringify({version:'7',dialect:'sqlite',entries:[{idx:0,version:'6',when:1792454400000,tag:'0000_scentory_archive',breakpoints:true}]},null,2)+'\n');
const output=await readFile(resolve(dist,'server/index.js'),'utf8');
if(!output.includes('fetch('))throw new Error('Missing Worker fetch export');
console.log('Private Worker built:',output.length,'bytes,',Object.keys(assets).length,'assets, bounded schema migration.');
