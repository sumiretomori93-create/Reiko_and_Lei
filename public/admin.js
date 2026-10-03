(() => {
 const $=id=>document.getElementById(id);const status=message=>$('status').textContent=message;
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let csrf='',content,version,key='memories',index=0,dirty=false;
 async function api(path,options={}){const r=await fetch(path,{...options,headers:{'Content-Type':'application/json','X-CSRF-Token':csrf,...options.headers}});const json=await r.json();if(!r.ok)throw new Error(json.error||'操作未完成');return json;}
 const login=$('login-form');if(login){login.onsubmit=async e=>{e.preventDefault();const values=new FormData(login);status('登录中…');try{await api('/api/login',{method:'POST',body:JSON.stringify(Object.fromEntries(values))});location.href='/';}catch(e){status(e.message);}};return;}
 const schema={
 memories:['记忆档案',[['id','ID'],['type','类型','select','photo,sky,screenshot,song,sentence'],['title','标题'],['date','日期','date'],['people','属于谁的 ID，以逗号分隔','array'],['note','短备注'],['body','正文','area'],['image','图片','image'],['alt','图片描述'],['songTitle','歌名'],['artist','歌手']]],
 imaginations:['意象条目',[['id','ID'],['title','标题'],['date','日期','date'],['note','简述'],['body','联想正文','area'],['memories','关联记忆 ID，以逗号分隔','array']]],
 letters:['信箱',[['id','ID'],['title','信的标题'],['date','日期','date'],['from','寄信人 ID'],['to','收信人 ID'],['body','信的正文','area']]],
 today:['Today',[['id','ID'],['date','日期','date'],['author','记录人 ID'],['text','今日痕迹','area']]],
 songs:['歌曲与音源',[['id','ID'],['title','歌名'],['by','谁放的'],['cover','歌曲封面','image'],['audioUrl','音频','audio'],['url','音乐平台链接']]],
 ticker:['顶部轮播',[['text','文字','area'],['by','署名']]],lines:['句子',[['text','句子','area'],['by','出处']]],perspectives:['人物联想',[['name','人物名'],['text','想到的内容','area']]],people:['人物',[['id','人物 ID'],['name','显示名']]]
 };
 const selected=()=>content[key][index];
 function render(){
  $('collections').innerHTML=Object.entries(schema).map(([k,[name]])=>`<button type="button" data-key="${k}" ${key===k?'aria-current="page"':''}>${name}</button>`).join('');
  $('collections').querySelectorAll('button').forEach(b=>b.onclick=()=>{if(!apply(false))return;key=b.dataset.key;index=0;render();});
  $('records').innerHTML=content[key].map((x,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(x.title||x.name||x.text||x.id||'未命名')}</option>`).join('');
  const row=selected();$('record-form').innerHTML=row?schema[key][1].map(([field,label,type,opts])=>{
   const value=Array.isArray(row[field])?row[field].join(', '):row[field]||'';
   const input=type==='area'?`<textarea name="${field}">${esc(value)}</textarea>`:type==='select'?`<select name="${field}">${opts.split(',').map(v=>`<option ${v===value?'selected':''}>${v}</option>`).join('')}</select>`:`<input name="${field}" type="${type==='date'?'date':'text'}" value="${esc(value)}">`;
   return `<label>${label}${input}${['image','audio'].includes(type)?`<input type="file" data-upload="${field}" accept="${type==='image'?'image/jpeg,image/png,image/webp':'audio/*'}">`:''}</label>`;
  }).join('')+'<label><input type="checkbox" name="sample" '+(row.sample?'checked':'')+'> 标为示例</label>':'<p>还没有记录，可以点新增。</p>';
  $('record-form').querySelectorAll('[data-upload]').forEach(input=>input.onchange=async()=>{const file=input.files[0];if(!file)return;status('上传中…');try{const r=await api('/api/upload',{method:'POST',headers:{'Content-Type':'application/octet-stream'},body:file});$('record-form').elements[input.dataset.upload].value=r.url;status('上传完成，记得更新这条并保存。');dirty=true;}catch(e){status(e.message);}});
 }
 function apply(notify=true){const row=selected();if(!row)return true;const form=$('record-form');for(const [field,,type]of schema[key][1]){const input=form.elements[field];if(!input)continue;row[field]=type==='array'?input.value.split(',').map(x=>x.trim()).filter(Boolean):input.value;}row.sample=form.elements.sample.checked;dirty=true;if(notify)status('已更新这条，点“保存全部修改”写入数据库。');return true;}
 async function load(){const r=await api('/api/content');content=r.content;version=r.version;index=0;dirty=false;render();status('已载入最新内容。');}
 $('records').onchange=e=>{const next=Number(e.target.value);apply(false);index=next;render();};
 $('apply').onclick=()=>apply();
 $('add').onclick=()=>{apply(false);const now=new Date().toISOString().slice(0,10);const row={id:crypto.randomUUID(),date:now,title:'',body:'',note:'',people:content.people.map(x=>x.id),memories:[],author:content.people[0]?.id||'',from:content.people[0]?.id||'',to:content.people[1]?.id||content.people[0]?.id||'',type:'photo',text:'',by:'',name:'',sample:false};content[key].push(row);index=content[key].length-1;dirty=true;render();status('填写新记录，更新后保存。');};
 $('remove').onclick=()=>{if(!selected()||!confirm('删除这条记录？保存全部修改后生效。'))return;content[key].splice(index,1);index=Math.max(0,index-1);dirty=true;render();};
 $('save').onclick=async()=>{apply(false);$('save').disabled=true;status('保存中…');try{const r=await api('/api/content',{method:'PUT',body:JSON.stringify({content,version})});version=r.version;dirty=false;status('已保存，两个人打开网站都能看到。');}catch(e){status(e.message);}finally{$('save').disabled=false;}};
 $('reload').onclick=()=>{if(dirty&&!confirm('重新载入会丢弃未保存修改，继续吗？'))return;load().catch(e=>status(e.message));};
 $('export').onclick=()=>{apply(false);const url=URL.createObjectURL(new Blob([JSON.stringify(content,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='reiko-and-lei-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('logout').onclick=async()=>{if(dirty&&!confirm('仍有未保存修改，退出吗？'))return;await api('/api/logout',{method:'POST',body:'{}'});location.href='/login.html';};
 window.addEventListener('beforeunload',e=>{if(dirty){e.preventDefault();e.returnValue='';}});
 $('record-form').oninput=()=>dirty=true;
 (async()=>{const s=await api('/api/session');if(!s.user||s.user.role!=='editor'){location.href='/login.html';return;}csrf=s.csrf;$('member-name').textContent=s.user.name+' · 编辑者';await load();})().catch(e=>status(e.message));
})();
