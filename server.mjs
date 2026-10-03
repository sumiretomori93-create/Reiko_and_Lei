import http from 'node:http';
import {readFileSync,existsSync,createReadStream,writeFileSync,unlinkSync,statSync} from 'node:fs';
import {resolve,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes,createHash} from 'node:crypto';
import vm from 'node:vm';
import {db,dataDir,checkPassword,hashPassword} from './db.mjs';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'public');
const demo={window:{}};vm.runInNewContext(readFileSync(resolve(root,'content.js'),'utf8'),demo);
if(!db.prepare('SELECT id FROM content WHERE id=1').get())db.prepare('INSERT INTO content(id,body) VALUES(1,?)').run(JSON.stringify(demo.window.ARCHIVE_CONTENT));
const secure=process.env.APP_ORIGIN?.startsWith('https:');
const publicRead=process.env.PUBLIC_READ==='true';
const digest=x=>createHash('sha256').update(x).digest('hex');
const dummy=hashPassword(randomBytes(24).toString('hex'));
const limits=new Map();
const json=(res,status,value)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(value));};
async function bytes(req,max){const parts=[];let n=0;for await(const part of req){n+=part.length;if(n>max)throw Object.assign(new Error('文件或内容过大'),{status:413});parts.push(part);}return Buffer.concat(parts);}
async function body(req){try{return JSON.parse((await bytes(req,2_000_000)).toString());}catch(e){if(e.status)throw e;throw Object.assign(new Error('无效的 JSON'),{status:400});}}
function session(req){const cookie=req.headers.cookie?.split(';').map(x=>x.trim()).find(x=>x.startsWith('archive_session='))?.slice(16);if(!cookie)return null;return db.prepare('SELECT sessions.*,users.email,users.name,users.role FROM sessions JOIN users ON users.id=sessions.user_id WHERE sessions.id=? AND expires>?').get(digest(cookie),Date.now());}
function checkOrigin(req){const expected=process.env.APP_ORIGIN||`http://${req.headers.host}`;if(req.headers.origin!==expected)throw Object.assign(new Error('请求来源不匹配，请检查网站地址配置'),{status:403});}
function writeAccess(req,user){if(!user)throw Object.assign(new Error('请先登录'),{status:401});if(user.role!=='editor')throw Object.assign(new Error('只有编辑者可以保存'),{status:403});checkOrigin(req);if(req.headers['x-csrf-token']!==user.csrf)throw Object.assign(new Error('请刷新后重试'),{status:403});}
function validateContent(c){
 if(!c||typeof c!=='object'||Array.isArray(c))throw new Error('内容格式不正确');
 for(const k of ['people','memories','imaginations','letters','today','ticker','songs','lines','perspectives'])if(!Array.isArray(c[k]))throw new Error('缺少栏目：'+k);
 for(const k of ['people','ticker','songs','lines','perspectives'])if(!c[k].length)throw new Error(k+' 至少保留一条');
 const string=(v)=>typeof v==='string'&&v.length<=100000;
 for(const k of ['people','memories','imaginations','letters','today','songs']){const ids=new Set();for(const x of c[k]){if(!x||!string(x.id)||!x.id||ids.has(x.id))throw new Error(k+' 的 ID 无效或重复');ids.add(x.id);}}
 for(const k of ['memories','imaginations','letters','today'])for(const x of c[k])if(!string(x.date)||!/^\d{4}-\d{2}-\d{2}$/.test(x.date))throw new Error(k+' 的日期不正确');
 for(const x of c.memories)if(!['photo','sky','screenshot','song','sentence'].includes(x.type)||!Array.isArray(x.people)||!string(x.title)||!string(x.body))throw new Error('记忆字段不完整');
 for(const x of c.imaginations)if(!string(x.title)||!string(x.body)||!Array.isArray(x.memories))throw new Error('意象字段不完整');
 for(const x of c.letters)if(!string(x.title)||!string(x.body)||!string(x.from)||!string(x.to))throw new Error('书信字段不完整');
 for(const x of c.today)if(!string(x.text)||!string(x.author))throw new Error('Today 字段不完整');
 for(const x of c.people)if(!string(x.name))throw new Error('人物名字不完整');
 for(const x of c.ticker)if(!string(x.text)||!string(x.by))throw new Error('轮播字段不完整');
 for(const x of c.songs)if(!string(x.title)||!string(x.by))throw new Error('歌曲字段不完整');
 for(const x of c.lines)if(!string(x.text)||!string(x.by))throw new Error('句子字段不完整');
 for(const x of c.perspectives)if(!string(x.name)||!string(x.text))throw new Error('联想字段不完整');
 for(const list of Object.values(c).filter(Array.isArray))for(const row of list)for(const key of ['image','cover','audioUrl','url'])if(row[key]&&!/^(assets\/|\/uploads\/|https?:\/\/)/.test(row[key]))throw new Error('图片或音频地址不合法');
}
function mediaType(buffer){if(buffer.subarray(0,3).equals(Buffer.from([255,216,255])))return ['jpg','image/jpeg'];if(buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))return ['png','image/png'];if(buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WEBP')return ['webp','image/webp'];if(buffer.toString('ascii',0,4)==='RIFF'&&buffer.toString('ascii',8,12)==='WAVE')return ['wav','audio/wav'];if(buffer.toString('ascii',0,4)==='OggS')return ['ogg','audio/ogg'];if(buffer.toString('ascii',0,4)==='fLaC')return ['flac','audio/flac'];if(buffer.toString('ascii',0,3)==='ID3'||(buffer[0]===255&&(buffer[1]&224)===224))return ['mp3','audio/mpeg'];if(buffer.toString('ascii',4,8)==='ftyp')return ['m4a','audio/mp4'];return null;}
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.m4a':'audio/mp4','.ogg':'audio/ogg','.flac':'audio/flac'};
const server=http.createServer(async(req,res)=>{
 res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');res.setHeader('X-Frame-Options','DENY');
 try{
  const path=new URL(req.url,'http://local').pathname;const user=session(req);
  if(req.method==='POST'&&path==='/api/login'){
   checkOrigin(req);const ip=req.socket.remoteAddress;const now=Date.now();let limit=limits.get(ip);if(!limit||now-limit.start>900000){limit={start:now,count:0};limits.set(ip,limit);}if(limits.size>10000)for(const [key,v]of limits)if(now-v.start>900000)limits.delete(key);if(limit.count>=15)return json(res,429,{error:'尝试次数过多，请稍后再试'});limit.count++;
   const input=await body(req);const u=db.prepare('SELECT * FROM users WHERE email=?').get(String(input.email||'').trim().toLowerCase());const valid=checkPassword(String(input.password||''),u?.password||dummy);if(!u||!valid)return json(res,401,{error:'邮箱或密码不正确'});
   limit.count=0;const token=randomBytes(32).toString('hex');const csrf=randomBytes(24).toString('hex');db.prepare('DELETE FROM sessions WHERE expires<?').run(now);db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(token),u.id,csrf,now+604800000);
   res.setHeader('Set-Cookie',`archive_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800${secure?'; Secure':''}`);return json(res,200,{ok:true});
  }
  if(path==='/api/session')return json(res,200,user?{user:{name:user.name,email:user.email,role:user.role},csrf:user.csrf,publicRead}:{user:null,publicRead});
  if(path==='/api/logout'&&req.method==='POST'){if(!user)return json(res,200,{ok:true});checkOrigin(req);if(req.headers['x-csrf-token']!==user.csrf)return json(res,403,{error:'请刷新后重试'});db.prepare('DELETE FROM sessions WHERE id=?').run(user.id);res.setHeader('Set-Cookie','archive_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,{ok:true});}
  if(path==='/api/content'){
   if(req.method==='GET'){if(!publicRead&&!user)return json(res,401,{error:'请先登录'});const row=db.prepare('SELECT * FROM content WHERE id=1').get();return json(res,200,{content:JSON.parse(row.body),version:row.version});}
   if(req.method==='PUT'){writeAccess(req,user);const input=await body(req);try{validateContent(input.content);}catch(e){return json(res,400,{error:e.message});}const result=db.prepare('UPDATE content SET body=?,version=version+1 WHERE id=1 AND version=?').run(JSON.stringify(input.content),input.version);if(!result.changes)return json(res,409,{error:'另一位已更新内容。请先导出你的修改，再重新载入。'});return json(res,200,{version:input.version+1});}
  }
  if(path==='/api/upload'&&req.method==='POST'){writeAccess(req,user);const file=await bytes(req,20*1024*1024);const type=mediaType(file);if(!type)return json(res,400,{error:'支持 JPG、PNG、WebP、MP3、WAV、OGG、FLAC 或 M4A'});const name=randomBytes(16).toString('hex')+'.'+type[0];writeFileSync(resolve(dataDir,'uploads',name),file,{flag:'wx'});return json(res,201,{url:'/uploads/'+name});}
  if(path==='/content.js'){if(!publicRead&&!user)return json(res,401,{error:'请先登录'});const row=db.prepare('SELECT body FROM content WHERE id=1').get();res.writeHead(200,{'Content-Type':'text/javascript; charset=utf-8','Cache-Control':'no-store'});return res.end('window.ARCHIVE_CONTENT = '+row.body.replaceAll('<','\\u003c')+';');}
  if(!['GET','HEAD'].includes(req.method))return json(res,405,{error:'不支持此操作'});
  const loginFiles=['/login.html','/admin.js','/account.css'];
  if(path.startsWith('/api/'))return json(res,404,{error:'未找到接口'});
  if(!publicRead&&!user&&(path==='/'||path==='/index.html'||path==='/admin.html')){res.writeHead(302,{Location:'/login.html'});return res.end();}
  if(path==='/admin.html'&&(!user||user.role!=='editor')){res.writeHead(302,{Location:'/login.html'});return res.end();}
  let file;
  if(path.startsWith('/uploads/')){if(!publicRead&&!user)return json(res,401,{error:'请先登录'});if(!/^\/uploads\/[a-f0-9]{32}\.[a-z0-9]+$/.test(path))return json(res,404,{error:'未找到文件'});file=resolve(dataDir,'uploads',path.split('/').pop());}else {file=resolve(root,'.'+decodeURIComponent(path==='/'?'/index.html':path));if(!file.startsWith(root+'/'))return json(res,403,{error:'无权访问'});}
  if(!existsSync(file)||!statSync(file).isFile())return json(res,404,{error:'未找到文件'});
  // 上传音频支持范围请求，便于播放和拖动进度。
  const size=statSync(file).size;const range=req.headers.range?.match(/^bytes=(\d+)-(\d*)$/);const headers={'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':path.startsWith('/uploads/')?'private, no-store':'no-cache','Accept-Ranges':'bytes'};
  if(range){const start=Number(range[1]),end=Math.min(range[2]?Number(range[2]):size-1,size-1);if(start>end||start>=size){res.writeHead(416,{'Content-Range':`bytes */${size}`});return res.end();}res.writeHead(206,{...headers,'Content-Range':`bytes ${start}-${end}/${size}`,'Content-Length':end-start+1});if(req.method==='HEAD')return res.end();return createReadStream(file,{start,end}).pipe(res);}
  res.writeHead(200,{...headers,'Content-Length':size});if(req.method==='HEAD')return res.end();createReadStream(file).pipe(res);
 }catch(e){json(res,e.status||500,{error:e.status?e.message:'操作未完成，请稍后重试'});}
});
server.listen(Number(process.env.PORT||8080),'0.0.0.0',()=>console.log('Archive listening on port '+(process.env.PORT||8080)));
