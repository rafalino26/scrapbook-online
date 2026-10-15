// Check the static entry point and all configured media before Pages deployment.
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const checked=new Set();
function asset(ref){
  if(!ref||/^(https?:|data:|#)/.test(ref))return;
  assert(!ref.startsWith('/'),`Use a project-relative URL: ${ref}`);
  const clean=ref.split(/[?#]/)[0];
  assert(fs.existsSync(path.join(root,clean)),`Missing asset: ${clean}`);
  checked.add(clean);
}
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
assert(html.includes('data-theme="nailong"'),'Nailong must be the main theme');
assert(!fs.existsSync(path.join(root,'nailong.html')),'Only one HTML entry point should remain');
assert(!html.includes('original-link'),'Old-version link must be removed');
for(const match of html.matchAll(/(?:src|href)="([^"]+)"/g))asset(match[1]);
const context={window:{}};
for(const file of ['content.js','nailong-content.js','music-content.js']){
  vm.runInNewContext(fs.readFileSync(path.join(root,file),'utf8'),context,{filename:file});
}
function visit(value){
  if(!value||typeof value!=='object')return;
  for(const [key,item] of Object.entries(value)){
    if(['src','poster','asset','fallback','walkingAsset','walkingStill'].includes(key)&&typeof item==='string')asset(item);
    else visit(item);
  }
}
visit(context.window);
for(const friend of context.window.NAILONG_THEME.animatedFriends){
  asset(`public/nailong/animated/${friend.file}.gif`);
  asset(`public/nailong/animated/${friend.file}-still.webp`);
}
for(const file of fs.readdirSync(root).filter(file=>file.endsWith('.css'))){
  const css=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of css.matchAll(/url\(\s*(?:"([^"]*)"|'([^']*)'|([^)]*))\s*\)/g))asset((match[1]??match[2]??match[3]).trim());
}
console.log(`Static Pages checks passed: ${checked.size} local assets; ${context.window.SCRAPBOOK.pages.length} pages; Nailong-only entry point.`);
