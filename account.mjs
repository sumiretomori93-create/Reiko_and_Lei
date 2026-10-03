import {db,hashPassword} from './db.mjs';
import {randomUUID} from 'node:crypto';
import {createInterface} from 'node:readline/promises';
const [email,name,role='editor']=process.argv.slice(2);
if(!email||!name||!['editor','viewer'].includes(role)){console.error('用法：npm run account -- 邮箱 显示名 [editor 或 viewer]');process.exit(1);}
let rl;
// 不写入文件、参数或日志；支持终端隐藏输入。
let password='';
if(process.stdin.isTTY){process.stdout.write('设置密码（至少 12 位）：');process.stdin.setRawMode(true);password=await new Promise(resolve=>{const handler=chunk=>{for(const c of chunk.toString()){if(c==='\r'||c==='\n'){process.stdin.off('data',handler);process.stdin.setRawMode(false);process.stdin.pause();process.stdout.write('\n');resolve(password);return;}if(c==='\u0003')process.exit(130);if(c==='\u007f')password=password.slice(0,-1);else password+=c;}};process.stdin.on('data',handler);});}else{rl=createInterface({input:process.stdin,output:process.stdout});password=await rl.question('设置密码（至少 12 位）：');}
rl?.close();if(password.length<12){console.error('密码至少 12 位。');process.exit(1);}
const existing=db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase().trim());
const id=existing?.id||randomUUID();
db.prepare('INSERT INTO users VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET name=excluded.name,password=excluded.password,role=excluded.role').run(id,email.toLowerCase().trim(),name,hashPassword(password),role);
db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
console.log('账号已保存：'+name+'（'+role+'）。原有登录已退出。');
