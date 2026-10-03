/* 只移植参考 HTML 的互动；保留现有视觉及内容路由。
 * 音乐选择为本次浏览的本地试听，真实线上音源可填 songs[].audioUrl。
 */
(() => {
  const data = window.ARCHIVE_CONTENT;
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const audio = new Audio();
  let timer, songIndex=0, localUrl, localName='', currentAudio='', status='', tickerIndex=0, lineIndex=0;
  let soundPanel;
  const safeUrl = url => { try { const u=new URL(url,location.href);return ['https:','http:'].includes(u.protocol)?u.href:''; } catch { return ''; } };
  const refreshAudio = () => {
    if(!soundPanel?.isConnected)return;
    const play=soundPanel.querySelector('[data-play]');
    play.disabled=!audio.src;
    play.textContent=audio.paused?'播放':'暂停';
    play.setAttribute('aria-pressed',String(!audio.paused));
    soundPanel.querySelector('[data-audio-status]').textContent=status || (currentAudio==='local'?`本次试听：${localName}`:audio.src?'已载入歌曲音源':'尚未添加音源，可选择本地音乐试听。');
  };
  audio.addEventListener('play',refreshAudio);audio.addEventListener('pause',refreshAudio);audio.addEventListener('ended',refreshAudio);
  audio.addEventListener('error',()=>{status='音源无法播放，请选择其他文件或检查歌曲链接。';refreshAudio();});
  document.addEventListener('visibilitychange',()=>{ if(document.hidden)clearInterval(timer); });
  window.addEventListener('pagehide',()=>{audio.pause();if(localUrl)URL.revokeObjectURL(localUrl);});
  function ticker(hero) {
    const el=document.createElement('div');el.className='memory-island';
    el.innerHTML='<button class="island-next" type="button" aria-label="换下一句"><span class="island-mark" aria-hidden="true">·</span><span><span class="island-text"></span><span class="island-author"></span></span></button><button class="island-pause" type="button" aria-label="暂停短句轮播">暂停</button>';
    hero.prepend(el);
    let paused=reduced;
    const draw=()=>{const row=data.ticker[tickerIndex%data.ticker.length];el.querySelector('.island-text').textContent=row.text;el.querySelector('.island-author').textContent=row.by;};
    const next=()=>{tickerIndex++;draw();};
    const pause=el.querySelector('.island-pause');
    const clock=()=>{clearInterval(timer);if(!paused)timer=setInterval(()=>{if(!document.hidden&&!el.contains(document.activeElement))next();},5200);};
    el.querySelector('.island-next').onclick=next;
    pause.onclick=()=>{paused=!paused;pause.textContent=paused?'继续':'暂停';pause.setAttribute('aria-label',paused?'继续短句轮播':'暂停短句轮播');clock();};
    pause.textContent=paused?'继续':'暂停';draw();clock();
  }
  function photos(parent) {
    const rows=data.memories.filter(x=>x.image);
    const el=document.createElement('section');el.className='photo-interaction';
    el.innerHTML=`<div class="interaction-heading"><h3>Photographs · 照片与天空</h3><span>点一张展开</span></div><div class="photo-strips">${rows.map((x,i)=>`<div class="photo-strip ${i===0?'is-open':''}"><button type="button" aria-expanded="${i===0}" aria-controls="photo-note-${i}"><img src="${esc(x.image)}" alt="${esc(x.alt)}" loading="lazy"><span>${esc(x.title)}</span></button><div class="photo-strip-note" id="photo-note-${i}" ${i?'hidden':''}><span>${esc(x.note)}</span><a href="#/archive/${encodeURIComponent(x.id)}">查看记录</a></div></div>`).join('')}</div>`;
    parent.append(el);
    el.querySelectorAll('.photo-strip button').forEach(button=>button.onclick=()=>{el.querySelectorAll('.photo-strip').forEach(row=>{const open=row===button.parentElement;row.classList.toggle('is-open',open);row.querySelector('button').setAttribute('aria-expanded',String(open));row.querySelector('.photo-strip-note').hidden=!open;});});
  }
  function music(parent) {
    const el=document.createElement('section');el.className='music-interaction';soundPanel=el;
    el.innerHTML=`<div class="interaction-heading"><h3>Songs · 两个人的歌</h3><span>切换封面，选择想听的一首</span></div><div class="song-carousel" aria-label="歌曲封面">${data.songs.map((x,i)=>`<button class="song-cover" type="button" data-song="${i}" aria-label="选择${esc(x.title)}"><img src="${esc(x.cover)}" alt="" loading="lazy"><span>0${i+1}</span></button>`).join('')}</div><div class="selected-song"><h4 data-song-title></h4><p data-song-by></p></div><div class="music-controls"><button type="button" data-prev aria-label="上一首">上一首</button><button type="button" data-play disabled aria-pressed="false">播放</button><button type="button" data-next aria-label="下一首">下一首</button></div><a data-source-link hidden target="_blank" rel="noopener noreferrer">在音乐平台打开</a><label class="audio-picker">加入音乐试听<input type="file" accept="audio/*" aria-label="选择本地音乐试听"></label><p class="audio-status" data-audio-status role="status"></p><p class="local-audio-note">本地文件仅用于本次试听，不会上传或保存。</p>`;
    parent.append(el);
    const draw=()=>{
      const song=data.songs[songIndex];
      el.querySelectorAll('[data-song]').forEach((b,i)=>{const offset=i-songIndex;b.style.setProperty('--offset',offset);b.classList.toggle('is-selected',i===songIndex);b.setAttribute('aria-pressed',String(i===songIndex));});
      el.querySelector('[data-song-title]').textContent=song.title;
      el.querySelector('[data-song-by]').textContent=song.by;
      const link=el.querySelector('[data-source-link]');const url=safeUrl(song.url);link.hidden=!url;if(url)link.href=url;
      refreshAudio();
    };
    const select=i=>{
      songIndex=(i+data.songs.length)%data.songs.length;
      audio.pause();status='';const source=safeUrl(data.songs[songIndex].audioUrl);
      currentAudio=source?'song':'';
      if(source)audio.src=source;else {audio.removeAttribute('src');audio.load();}
      draw();
    };
    el.querySelectorAll('[data-song]').forEach(b=>b.onclick=()=>select(Number(b.dataset.song)));
    el.querySelector('[data-prev]').onclick=()=>select(songIndex-1);
    el.querySelector('[data-next]').onclick=()=>select(songIndex+1);
    el.querySelector('[data-play]').onclick=async()=>{if(!audio.src)return;if(!audio.paused)audio.pause();else try{await audio.play();}catch{status='未能开始播放，请检查音源后重试。';refreshAudio();}};
    el.querySelector('input').onchange=e=>{const file=e.target.files[0];if(!file)return;audio.pause();if(localUrl)URL.revokeObjectURL(localUrl);localUrl=URL.createObjectURL(file);localName=file.name;currentAudio='local';status='';audio.src=localUrl;refreshAudio();};
    let start;
    const carousel=el.querySelector('.song-carousel');carousel.onpointerdown=e=>start=e.clientX;carousel.onpointerup=e=>{if(start===undefined)return;const dx=e.clientX-start;start=undefined;if(Math.abs(dx)>35)select(songIndex+(dx<0?1:-1));};carousel.onpointercancel=()=>start=undefined;
    if(!audio.src){const source=safeUrl(data.songs[songIndex].audioUrl);if(source){audio.src=source;currentAudio='song';}}
    draw();
  }
  function lines(parent) {
    const el=document.createElement('section');el.className='lines-interaction';
    el.innerHTML='<div class="interaction-heading"><h3>Lines · 留下的句子</h3><span>点一下，翻到下一句</span></div><button class="line-turner" type="button" aria-label="换下一句"><span class="line-quote"></span><span class="line-author"></span></button>';
    parent.append(el);
    const draw=()=>{const row=data.lines[lineIndex%data.lines.length];el.querySelector('.line-quote').textContent=row.text;el.querySelector('.line-author').textContent='— '+row.by;};
    el.querySelector('button').onclick=()=>{lineIndex++;draw();};draw();
  }
  function imagination(parent) {
    const el=document.createElement('div');el.className='perspective-interaction';
    el.innerHTML=`<div class="perspective-select" role="group" aria-label="选择意象联想的人">${data.perspectives.map((x,i)=>`<button type="button" data-perspective="${i}" aria-pressed="${i===0}">${esc(x.name)}</button>`).join('')}</div><div class="perspective-content"><p class="section-kicker">THE WORD</p><h3>${esc(data.word)}</h3><p data-perspective-text></p><span data-perspective-author></span></div>`;
    parent.append(el);
    const draw=i=>{el.querySelectorAll('button').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));el.querySelector('[data-perspective-text]').textContent=data.perspectives[i].text;el.querySelector('[data-perspective-author]').textContent='— '+data.perspectives[i].name;};
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>draw(Number(b.dataset.perspective)));draw(0);
  }
  function mailbox(parent) {
    const el=document.createElement('div');el.className='mailbox-interaction';
    el.innerHTML=`<div class="recipient-select" role="group" aria-label="选择收信人">${data.people.map((x,i)=>`<button type="button" data-recipient="${esc(x.id)}" aria-pressed="${i===0}">寄给 ${esc(x.name)}</button>`).join('')}</div><div class="mailbox-stage"><button type="button" class="collect-letter">取出一封信</button><button type="button" class="envelope-letter" hidden><span class="section-kicker">LETTER FOR YOU</span><span data-envelope-title></span><span>拆开这封信</span></button><p class="mailbox-hint" role="status"></p><div class="unfolded-letter" hidden><h3></h3><div class="unfolded-body"></div><a class="related-link">完整阅读</a><button type="button" class="return-letter">放回信箱</button></div></div>`;
    parent.append(el);
    let recipient=data.people[0].id;let letter;
    const envelope=el.querySelector('.envelope-letter'),paper=el.querySelector('.unfolded-letter'),hint=el.querySelector('.mailbox-hint');
    const reset=()=>{envelope.hidden=true;paper.hidden=true;letter=data.letters.find(x=>x.to===recipient);hint.textContent=letter?'点取信，再拆开。':'这里还没有信，等待第一封。';el.querySelector('.collect-letter').disabled=!letter;};
    el.querySelectorAll('[data-recipient]').forEach(b=>b.onclick=()=>{recipient=b.dataset.recipient;el.querySelectorAll('[data-recipient]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));reset();});
    el.querySelector('.collect-letter').onclick=()=>{envelope.hidden=false;paper.hidden=true;el.querySelector('[data-envelope-title]').textContent=letter.title;hint.textContent='信到了，点一下拆开。';envelope.focus();};
    envelope.onclick=()=>{envelope.hidden=true;paper.hidden=false;paper.querySelector('h3').textContent=letter.title;paper.querySelector('.unfolded-body').innerHTML=letter.body.split(/\n\s*\n/).map(p=>`<p>${esc(p)}</p>`).join('');paper.querySelector('a').href='#/mailbox/'+encodeURIComponent(letter.id);hint.textContent='';paper.querySelector('.return-letter').focus();};
    el.querySelector('.return-letter').onclick=()=>{reset();el.querySelector('.collect-letter').focus();};reset();
  }
  function today(parent) {
    const label=parent.querySelector('.today-label'),trace=parent.querySelector('.today-trace');
    const el=document.createElement('div');el.className='today-person-select';el.setAttribute('role','group');el.setAttribute('aria-label','选择今日记录的人');
    el.innerHTML=data.people.map((x,i)=>`<button type="button" data-person-today="${esc(x.id)}" aria-pressed="${i===0}">${esc(x.name)}</button>`).join('');
    label.append(el);
    const draw=id=>{const row=[...data.today].sort((a,b)=>b.date.localeCompare(a.date)).find(x=>x.author===id);trace.textContent=row?row.text+(row.sample?'（示例）':''):'今天的位置，还空着。';};
    el.querySelectorAll('button').forEach(b=>b.onclick=()=>{el.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));draw(b.dataset.personToday);});draw(data.people[0].id);
  }
  window.mountArchiveInteractions = section => {
    clearInterval(timer);soundPanel=null;
    if(section)return;
    const hero=document.querySelector('.main-screen');if(hero)ticker(hero);
    const archive=document.querySelector('.archive-showcase');
    if(archive){const el=document.createElement('div');el.className='archive-experiences';archive.append(el);photos(el);music(el);lines(el);}
    const imag=document.querySelector('.imagination-showcase');if(imag)imagination(imag);
    const mail=document.querySelector('.mailbox-showcase');if(mail)mailbox(mail);
    const trace=document.querySelector('.home-content > .today');if(trace)today(trace);
  };
})();
