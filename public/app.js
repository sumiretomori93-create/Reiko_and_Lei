(() => {
  const data = window.ARCHIVE_CONTENT;
  const main = document.querySelector('#main');
  const header = document.querySelector('#header-template').innerHTML;
  const types = {screenshot:'截图',song:'歌曲',sentence:'句子',sky:'天空',photo:'照片'};
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const person = id => data.people.find(p => p.id === id)?.name ?? '未署名';
  const date = value => `<time datetime="${escape(value)}">${escape(value.replaceAll('-','.'))}</time>`;
  const sample = item => item.sample ? '<span class="sample-label">示例</span>' : '';
  const paragraphs = text => String(text ?? '').split(/\n\s*\n/).map(p => `<p>${escape(p).replaceAll('\n','<br>')}</p>`).join('');
  const ordered = list => [...list].sort((a,b) => b.date.localeCompare(a.date));
  const heading = (en,cn,route) => `<div class="section-heading"><h2 class="section-title"><span class="section-kicker" lang="en">${en}</span>${cn}</h2><a class="text-action" href="#/${route}">查看全部</a></div>`;
  function memory(item) {
    const photo = item.image ? `<div class="memory-visual"><img class="memory-image crop-${escape(item.id)}" src="${escape(item.image)}" alt="${escape(item.alt)}" width="640" height="360" loading="lazy"></div>` : `<div class="memory-placeholder">${types[item.type]} · 等一份真实记忆</div>`;
    return `<article class="memory-item"><a href="#/archive/${encodeURIComponent(item.id)}">${photo}<p class="memory-meta">${date(item.date)} · ${types[item.type]} · ${sample(item)}</p><h3 class="memory-title">${escape(item.title)}</h3><p class="memory-note">${escape(item.note)}</p></a></article>`;
  }
  function imagination(item,index) {
    return `<article class="imagination-item"><span class="imagination-number">${String(index+1).padStart(2,'0')}</span><h3><a href="#/imagination/${encodeURIComponent(item.id)}">${escape(item.title)}</a></h3><p>${escape(item.note)}</p><a class="related-link" href="#/imagination/${encodeURIComponent(item.id)}">读这组联想</a> ${sample(item)}</article>`;
  }
  function letter(item) {
    return `<li><a class="letter-row" href="#/mailbox/${encodeURIComponent(item.id)}">${date(item.date)}<span class="letter-title">${escape(item.title)} ${sample(item)}</span><span class="letter-meta">${escape(person(item.from))} 写给 ${escape(person(item.to))}</span></a></li>`;
  }
  function letterPreview(item) {
    return `<article class="letter-preview"><a href="#/mailbox/${encodeURIComponent(item.id)}"><div class="letter-address"><span>FROM ${escape(person(item.from))}</span><span>TO ${escape(person(item.to))}</span></div><h3 class="letter-title">${escape(item.title)}</h3><p class="letter-excerpt">${escape(item.body.split(/\n\s*\n/).slice(-2,-1).join(''))}</p><div class="letter-bottom">${date(item.date)}<span>展开这封信</span></div></a>${sample(item)}</article>`;
  }
  function home() {
    const trace=ordered(data.today)[0];
    return `<div class="main-screen water-sheet">${header}<section class="hero" aria-labelledby="hero-title"><div class="hero-copy"><h1 id="hero-title" class="hero-title">浮光记忆馆</h1><p class="hero-en" lang="en">FLOATING LIGHT ARCHIVE</p><p class="hero-description">把重要的东西，轻轻放进水里。</p><a class="text-action" href="#/archive">进入记忆馆</a></div></section></div>
      <div class="home-content"><section class="archive-section archive-showcase water-sheet" aria-label="记忆档案">${heading('ARCHIVE','最近浮起的记忆','archive')}<div class="memory-grid">${ordered(data.memories).slice(0,3).map(memory).join('')}</div></section>
      <section class="archive-section imagination-showcase water-sheet" aria-label="意象联想">${heading('IMAGINATION','意象之间','imagination')}<div class="imagination-composition"><div class="imagination-list">${ordered(data.imaginations).slice(0,2).map(imagination).join('')}</div><div class="imagination-window" aria-hidden="true"><span>水 / 风 / 光</span></div></div></section>
      <section class="archive-section mailbox-showcase water-sheet" aria-label="信箱">${heading('MAILBOX','写给彼此的信','mailbox')}<div class="letter-spread">${ordered(data.letters).slice(0,2).map(letterPreview).join('')}</div></section>
      <section class="today water-sheet" aria-label="今日痕迹"><div class="today-label">TODAY · 今日痕迹<br>${trace?date(trace.date):''}</div><p class="today-trace">${trace?escape(trace.text):'今天的位置，还空着。'} ${trace?sample(trace):''}</p><a class="text-action" href="#/today">过去的痕迹</a></section></div>`;
  }
  function page(en,title,intro,body) {
    return `<div class="inner-header">${header}</div><section class="page-view water-sheet"><a class="back-link" href="#/">回到水面</a><h1 class="page-title"><span class="section-kicker" lang="en">${en}</span>${title}</h1><p class="page-intro">${intro}</p>${body}</section>`;
  }
  function filters() {
    return `<fieldset class="filters filter-group"><legend>记忆类型</legend>${[['all','全部'],...Object.entries(types)].map(([key,label])=>`<button class="filter-control" type="button" data-type="${key}" aria-pressed="${key==='all'}">${label}</button>`).join('')}</fieldset><fieldset class="filters filter-group"><legend>属于谁</legend>${[['all','我们'],...data.people.map(p=>[p.id,p.name])].map(([key,label])=>`<button class="filter-control" type="button" data-person="${escape(key)}" aria-pressed="${key==='all'}">${escape(label)}</button>`).join('')}</fieldset><p id="result-count" class="result-count" role="status"></p><div id="memory-results" class="memory-grid listing-grid"></div>`;
  }
  function bindFilters() {
    let selectedType='all',selectedPerson='all';
    function update() {
      const records=ordered(data.memories).filter(x=>(selectedType==='all'||x.type===selectedType)&&(selectedPerson==='all'||x.people.includes(selectedPerson)));
      document.querySelector('#memory-results').innerHTML=records.length?records.map(memory).join(''):'<p class="empty-state">这里还没有记忆，给它留一点时间。</p>';
      document.querySelector('#result-count').textContent=`${records.length} 条记忆`;
      document.querySelectorAll('[data-type]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.type===selectedType)));
      document.querySelectorAll('[data-person]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.person===selectedPerson)));
    }
    main.querySelectorAll('.filter-control').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.type)selectedType=b.dataset.type;if(b.dataset.person)selectedPerson=b.dataset.person;update();}));
    update();
  }
  function detail(section,id) {
    const collection={archive:data.memories,imagination:data.imaginations,mailbox:data.letters};
    const item=collection[section]?.find(x=>x.id===id);
    if(!item)return page('ARCHIVE','这一页暂时没有找到','可以回到水面，再找一找。','');
    let meta=date(item.date);
    if(section==='archive')meta+=` · ${types[item.type]} · ${item.people.map(person).map(escape).join('、')}`;
    if(section==='mailbox')meta+=` · ${escape(person(item.from))} 写给 ${escape(person(item.to))}`;
    let related='';
    if(item.memories?.length)related=`<div class="detail-related"><h2 class="section-title">与它相连的记忆</h2>${item.memories.map(id=>data.memories.find(x=>x.id===id)).filter(Boolean).map(x=>`<a class="related-link" href="#/archive/${encodeURIComponent(x.id)}">${escape(x.title)}</a>`).join('')}</div>`;
    return `<div class="inner-header">${header}</div><article class="page-view detail-view water-sheet"><a class="back-link" href="#/${section}">回到${{archive:'记忆档案',imagination:'意象之间',mailbox:'信箱'}[section]}</a><h1 class="page-title">${escape(item.title)}</h1><p class="detail-meta">${meta} ${sample(item)}</p>${item.image?`<img class="detail-image" src="${escape(item.image)}" alt="${escape(item.alt)}" style="object-position:${escape(item.position||'center')}">`:''}${item.songTitle?`<div class="song-info"><p>${escape(item.songTitle)}</p><p class="letter-meta">${escape(item.artist)}</p></div>`:''}<div class="detail-body">${paragraphs(item.body)}</div>${related}</article>`;
  }
  function render(focus=false) {
    const parts=location.hash.replace(/^#\/?/,'').split('/');
    const section=parts[0];
    let id='';try{id=decodeURIComponent(parts[1]||'');}catch{}
    if(id)main.innerHTML=detail(section,id);
    else if(section==='archive'){main.innerHTML=page('ARCHIVE','记忆档案','截图、歌、句子、天空与照片。',filters());bindFilters();}
    else if(section==='imagination')main.innerHTML=page('IMAGINATION','意象之间','那些从一句话，漂向另一幅画面的联想。',`<div class="imagination-list">${ordered(data.imaginations).map(imagination).join('')}</div>`);
    else if(section==='mailbox')main.innerHTML=page('MAILBOX','写给彼此的信','慢慢写，也慢慢读。',`<ul class="letter-list">${ordered(data.letters).map(letter).join('')}</ul>`);
    else if(section==='today')main.innerHTML=page('TODAY','每日的一点痕迹','一句话，或者一个瞬间。',ordered(data.today).map(x=>`<article class="today-entry">${date(x.date)} ${sample(x)}<p>${escape(x.text)}</p></article>`).join(''));
    else if(!section)main.innerHTML=home();
    else main.innerHTML=page('FLOATING LIGHT ARCHIVE','这一页暂时没有找到','可以回到水面，再找一找。','');
    document.querySelectorAll('.site-nav a').forEach(a=>{if(a.getAttribute('href')===`#/${section}`)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    document.title=(main.querySelector('h1')?.textContent.trim()||'浮光记忆馆')+' · Floating Light Archive';
    window.mountArchiveInteractions?.(section);
    if(focus){window.scrollTo({top:0,behavior:'instant'});main.focus({preventScroll:true});}
  }
  window.addEventListener('hashchange',()=>render(true));
  render();
})();
