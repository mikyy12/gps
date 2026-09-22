import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = process.cwd();
const requiredDocs = ['README.md','INDEX.md','BASELINE.md','AI_CONTEXT.md','AGENT_PROTOCOL.md','CHANGELOG.md'];

function exists(p){ return fs.existsSync(path.join(root,p)); }
function read(p){ return fs.readFileSync(path.join(root,p),'utf8'); }
function gitTs(p){
  try { const out=execFileSync('git',['log','-1','--format=%ct','--',p],{cwd:root,encoding:'utf8'}).trim(); return Number(out)||0; }
  catch { return 0; }
}
function hasFiles(dir, exts){
  if(!exists(dir)) return false;
  const stack=[path.join(root,dir)];
  while(stack.length){ const d=stack.pop(); for(const e of fs.readdirSync(d,{withFileTypes:true})){ const p=path.join(d,e.name); if(e.isDirectory()) stack.push(p); else if(exts.some(x=>e.name.endsWith(x))) return true; } }
  return false;
}

if(!exists('docs/architecture/module-map.md')){ console.error('Missing module-map.md'); process.exit(1); }
const text=read('docs/architecture/module-map.md');
const modules=[...text.matchAll(/<!-- MODULE path=([^ ]+) doc=([^ ]+) name=([^ ]+) -->/g)].map(m=>({modulePath:m[1],doc:m[2],name:m[3]}));

const discovered=[];
if(exists('src/app/page.tsx')) discovered.push('src/app/page.tsx');
if(exists('src/app')) for(const e of fs.readdirSync(path.join(root,'src/app'),{withFileTypes:true})) if(e.isDirectory() && hasFiles(`src/app/${e.name}`,['.ts','.tsx'])) discovered.push(`src/app/${e.name}`);
if(exists('src/components')) for(const e of fs.readdirSync(path.join(root,'src/components'),{withFileTypes:true})) if(e.isDirectory() && hasFiles(`src/components/${e.name}`,['.ts','.tsx'])) discovered.push(`src/components/${e.name}`);
if(exists('src/lib')) for(const e of fs.readdirSync(path.join(root,'src/lib'),{withFileTypes:true})) if(e.isDirectory() && hasFiles(`src/lib/${e.name}`,['.ts','.tsx'])) discovered.push(`src/lib/${e.name}`);
if(exists('src/proxy.ts')) discovered.push('src/proxy.ts');
if(exists('supabase/migrations')) discovered.push('supabase/migrations');

const mapped=new Set(modules.map(m=>m.modulePath));
const missingMappings=[...new Set(discovered)].filter(p=>!mapped.has(p));
const missingDocs=modules.filter(m=>!exists(m.doc));
const stale=[];
for(const m of modules){ if(!exists(m.doc)||!exists(m.modulePath)) continue; const code=gitTs(m.modulePath); const docTs=gitTs(m.doc); if(code>docTs) stale.push({...m,code,docTs}); }
const requiredMissing=requiredDocs.filter(p=>!exists(p));
const coverage=discovered.length ? ((discovered.length-missingMappings.length)/discovered.length)*100 : 100;
const freshness=modules.length ? ((modules.length-stale.length)/modules.length)*100 : 100;
const requiredScore=((requiredDocs.length-requiredMissing.length)/requiredDocs.length)*100;
const score=Math.round(coverage*.6+freshness*.2+requiredScore*.2);

console.log(`Documentation health: ${score}/100`);
console.log(`Module coverage: ${coverage.toFixed(1)}% (${discovered.length-missingMappings.length}/${discovered.length})`);
console.log(`Freshness: ${freshness.toFixed(1)}% (${modules.length-stale.length}/${modules.length})`);
if(stale.length) console.log('Docs older than code:', stale.map(x=>`${x.name}:${x.doc}`).join(', '));
if(missingMappings.length) console.error('Undocumented module paths:', missingMappings.join(', '));
if(missingDocs.length) console.error('Missing mapped docs:', missingDocs.map(x=>x.doc).join(', '));
if(requiredMissing.length) console.error('Missing required docs:', requiredMissing.join(', '));
if(missingMappings.length||missingDocs.length||requiredMissing.length) process.exit(1);
