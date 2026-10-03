import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
test('independent auth, upload permissions and content concurrency',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'archive-test-'));process.env.DATA_DIR=dir;
 const {db,hashPassword}=await import('./db.mjs');
 const password=randomBytes(16).toString('hex');
 db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run('editor','editor@test.local','Editor',hashPassword(password),'editor');
 db.prepare('INSERT INTO users VALUES(?,?,?,?,?)').run('viewer','viewer@test.local','Viewer',hashPassword(password),'viewer');
 const origin='http://localhost:18083';
 const child=spawn(process.execPath,['server.mjs'],{env:{...process.env,PORT:'18083',APP_ORIGIN:origin,PUBLIC_READ:'false'},stdio:['ignore','pipe','pipe']});
 try {
  await new Promise((resolve,reject)=>{child.stdout.once('data',resolve);child.once('exit',()=>reject(Error('server exited')));setTimeout(()=>reject(Error('startup timeout')),5000).unref();});
  assert.equal((await fetch(origin+'/api/content')).status,401);
  assert.equal((await fetch(origin+'/',{redirect:'manual'})).status,302);
  const login=async email=>{const r=await fetch(origin+'/api/login',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({email,password})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];const s=await fetch(origin+'/api/session',{headers:{Cookie:cookie}}).then(r=>r.json());return {Cookie:cookie,Origin:origin,'X-CSRF-Token':s.csrf,'Content-Type':'application/json'};};
  const editor=await login('editor@test.local'),viewer=await login('viewer@test.local');
  const record=await fetch(origin+'/api/content',{headers:editor}).then(r=>r.json());
  assert.equal((await fetch(origin+'/api/content',{method:'PUT',headers:viewer,body:JSON.stringify(record)})).status,403);
  assert.equal((await fetch(origin+'/api/content',{method:'PUT',headers:{...editor,'X-CSRF-Token':'wrong'},body:JSON.stringify(record)})).status,403);
  record.content.word='shared word';
  assert.equal((await fetch(origin+'/api/content',{method:'PUT',headers:editor,body:JSON.stringify(record)})).status,200);
  assert.equal((await fetch(origin+'/api/content',{method:'PUT',headers:editor,body:JSON.stringify(record)})).status,409);
  const updated=await fetch(origin+'/api/content',{headers:viewer}).then(r=>r.json());assert.equal(updated.content.word,'shared word');
  const png=Buffer.from('89504e470d0a1a0a','hex');
  const upload=await fetch(origin+'/api/upload',{method:'POST',headers:editor,body:png});assert.equal(upload.status,201);const {url}=await upload.json();
  assert.equal((await fetch(origin+url)).status,401);assert.equal((await fetch(origin+url,{headers:viewer})).status,200);
  assert.equal((await fetch(origin+'/api/upload',{method:'POST',headers:viewer,body:png})).status,403);
  assert.equal((await fetch(origin+'/api/upload',{method:'POST',headers:editor,body:'<svg></svg>'})).status,400);
  assert.equal((await fetch(origin+'/api/logout',{method:'POST',headers:editor,body:'{}'})).status,200);
  assert.equal((await fetch(origin+'/api/content',{headers:editor})).status,401);
 }finally{child.kill();await new Promise(r=>child.once('exit',r));db.close();rmSync(dir,{recursive:true,force:true});}
});
