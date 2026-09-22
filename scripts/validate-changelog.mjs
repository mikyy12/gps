import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'));
const changelog=fs.readFileSync('CHANGELOG.md','utf8');
const errors=[];
if(!changelog.includes(`## [${pkg.version}]`)) errors.push(`CHANGELOG missing current package version ${pkg.version}`);
const base=process.env.GITHUB_BASE_REF;
if(base){
  try{
    const oldRaw=execFileSync('git',['show',`origin/${base}:package.json`],{encoding:'utf8'});
    const old=JSON.parse(oldRaw);
    if(old.version!==pkg.version){
      const changed=execFileSync('git',['diff','--name-only',`origin/${base}...HEAD`],{encoding:'utf8'}).split('\n');
      if(!changed.includes('CHANGELOG.md')) errors.push(`Version changed ${old.version} -> ${pkg.version} without CHANGELOG.md change`);
    }
  } catch { /* non-blocking when base has no package.json */ }
}
if(errors.length){ console.error(errors.join('\n')); process.exit(1); }
console.log(`Changelog valid for version ${pkg.version}.`);
