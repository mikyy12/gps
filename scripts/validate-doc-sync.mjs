import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root=process.cwd();
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const exists=p=>fs.existsSync(path.join(root,p));
const fail=[];

// README/package/baseline synchronization.
const pkg=JSON.parse(read('package.json'));
const readme=read('README.md');
const baseline=read('BASELINE.md');
const clean=v=>String(v??'').replace(/^[~^]/,'');
for(const [marker,value] of [['PACKAGE_VERSION',pkg.version],['NEXT_VERSION',clean(pkg.dependencies?.next)],['REACT_VERSION',clean(pkg.dependencies?.react)]]){
  if(!readme.includes(`<!-- ${marker}:${value} -->`)) fail.push(`README marker ${marker} must equal ${value}`);
}
const readmeStatus=readme.match(/<!-- PROJECT_STATUS:([A-Z_-]+) -->/)?.[1];
const baselineStatus=/\*\*(STABLE|UNSTABLE)(?:\s*\/[^*]+)?\*\*/.exec(baseline)?.[1];
if(!readmeStatus) fail.push('README missing PROJECT_STATUS marker');
if(!baselineStatus) fail.push('BASELINE missing parseable STABLE/UNSTABLE classification');
if(readmeStatus&&baselineStatus&&readmeStatus!==baselineStatus) fail.push(`README status ${readmeStatus} differs from BASELINE ${baselineStatus}`);
if(!readme.includes('BASELINE.md')||!readme.includes('INDEX.md')||!readme.includes('AI_CONTEXT.md')) fail.push('README must link BASELINE, INDEX and AI_CONTEXT');

// Parse module and dependency contracts.
const moduleText=read('docs/architecture/module-map.md');
const modules=[...moduleText.matchAll(/<!-- MODULE path=([^ ]+) doc=([^ ]+) name=([^ ]+) -->/g)].map(m=>({modulePath:m[1],doc:m[2],name:m[3]}));
const depSet=new Set([...moduleText.matchAll(/<!-- ARCH_DEP from=([^ ]+) to=([^ ]+) -->/g)].map(m=>`${m[1]}->${m[2]}`));
const byPath=[...modules].sort((a,b)=>b.modulePath.length-a.modulePath.length);
function moduleForFile(file){ return byPath.find(m=>file===m.modulePath||file.startsWith(m.modulePath.endsWith('.ts')?m.modulePath:m.modulePath+'/'))?.name ?? null; }
function moduleForAlias(alias){
  if(!alias.startsWith('@/')) return null;
  return moduleForFile('src/'+alias.slice(2));
}
function walk(dir){ if(!exists(dir)) return []; const out=[]; const stack=[path.join(root,dir)]; while(stack.length){const d=stack.pop(); for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name); if(e.isDirectory()) stack.push(p); else if(/\.(ts|tsx)$/.test(e.name)) out.push(path.relative(root,p).replaceAll('\\','/'));}} return out; }
for(const file of walk('src')){
  const from=moduleForFile(file); if(!from) continue;
  const source=read(file);
  for(const m of source.matchAll(/from\s+["'](@\/[^"']+)["']/g)){
    const to=moduleForAlias(m[1]); if(to&&to!==from&&!depSet.has(`${from}->${to}`)) fail.push(`Architecture dependency missing: ${from}->${to} (${file})`);
  }
}

// RPC/API contracts: every GRANT EXECUTE signature must be documented and vice versa.
const sqlDir=path.join(root,'supabase/migrations');
let sql=''; if(fs.existsSync(sqlDir)) for(const f of fs.readdirSync(sqlDir).filter(x=>x.endsWith('.sql')).sort()) sql+=fs.readFileSync(path.join(sqlDir,f),'utf8')+'\n';
const granted=new Set();
for(const m of sql.matchAll(/GRANT\s+EXECUTE\s+ON\s+FUNCTION\s+public\.([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s+TO\s+[^;]+;/gsi)) granted.add(`${m[1]}(${m[2].replace(/\s+/g,'').toUpperCase()})`);
const apiText=read('docs/architecture/api-contracts.md');
const documented=new Set([...apiText.matchAll(/<!-- API_CONTRACT ([a-zA-Z0-9_]+\([^)]*\)) -->/g)].map(m=>m[1].replace(/\s+/g,'').replace(/\(([^)]*)\)/,(_,a)=>`(${a.toUpperCase()})`)));
for(const sig of granted) if(!documented.has(sig)) fail.push(`Granted RPC not documented: ${sig}`);
for(const sig of documented) if(!granted.has(sig)) fail.push(`Documented RPC signature not granted/current: ${sig}`);

// PR diff: behavior-changing module code requires its mapped doc in same PR.
const base=process.env.GITHUB_BASE_REF;
if(base){
  let changed=[];
  try { changed=execFileSync('git',['diff','--name-only',`origin/${base}...HEAD`],{cwd:root,encoding:'utf8'}).trim().split('\n').filter(Boolean); }
  catch { fail.push(`Unable to compute PR diff against origin/${base}`); }
  const changedSet=new Set(changed);
  const codeChanged=changed.filter(f=>/\.(ts|tsx|sql|mjs)$/.test(f)&&!/[.]test[.]|[.]spec[.]/.test(f));
  for(const file of codeChanged){ const mod=byPath.find(m=>file===m.modulePath||file.startsWith(m.modulePath.endsWith('.ts')?m.modulePath:m.modulePath+'/')); if(mod&&!changedSet.has(mod.doc)) fail.push(`Code changed without module doc update: ${file} -> ${mod.doc}`); }
  if(changedSet.has('package.json')&&!changedSet.has('BASELINE.md')&&!changedSet.has('CHANGELOG.md')) fail.push('package.json changed without BASELINE.md or CHANGELOG.md update');
  if(changed.some(f=>f.startsWith('supabase/migrations/'))&&!changedSet.has('docs/architecture/api-contracts.md')&&!changedSet.has('docs/architecture/modules/data-layer.md')) fail.push('Migration changed without data/API documentation update');
}

if(fail.length){ console.error('Documentation/code validation failed:\n- '+[...new Set(fail)].join('\n- ')); process.exit(1); }
console.log(`Documentation/code contracts valid. Status: ${readmeStatus}; RPCs documented: ${documented.size}; architecture edges: ${depSet.size}.`);
