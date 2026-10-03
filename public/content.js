/* 替换这里的示例记录即可更新内容；id 保持稳定以保留详情链接。
 * 当前示例不代表两个人的真实经历，图片均来自用户提供的背景。
 */
window.ARCHIVE_CONTENT = {
  ticker: [{text:"把重要的东西，轻轻放进水里。",by:"浮光记忆馆"},{text:"雾蓝色细纹蕾丝、半透明 PET 和纸胶带、翻开手账时书页的香气。",by:"Reiko 想到的「Lei」"},{text:"灰色废城墙缝里，一枚颜色浓得近乎发黑、还没开的花蕾。",by:"Gabe 想到的「Lei」"}],
  word: "Lei",
  perspectives: [{name:"Reiko",text:"雾蓝色细纹蕾丝、半透明 PET 和纸胶带、翻开手账时书页的香气。"},{name:"Gabe",text:"灰色废城墙缝里，一枚颜色浓得近乎发黑、还没开的花蕾。"},{name:"下一个",text:"下一个意象还空着，等你们留下新的联想。"}],
  songs: [{id:"song-1",title:"第一首，待放",by:"Lei 放的",cover:"assets/glass-berries.jpg",sample:true},{id:"song-2",title:"第二首，待放",by:"Reiko 放的",cover:"assets/glass-fish.jpg",sample:true},{id:"song-3",title:"第三首，待放",by:"一起听过的",cover:"assets/quiet-sea.jpg",sample:true}],
  lines: [{text:"像把重要的东西轻轻放进水里，安静发亮。",by:"记忆馆的概念"},{text:"把重要的东西，轻轻放进水里。",by:"浮光记忆馆"}],
  people: [{id:"a",name:"Reiko"},{id:"b",name:"Lei"}],
  memories: [
    {id:"water-letter",type:"photo",title:"水面的来信",date:"2026-10-03",people:["a","b"],note:"把这一刻的清透，留在这里。",body:"这是一条照片记录示例。之后可以换成你们真正想留下的照片，以及那一天的一句话。",image:"assets/glass-berries.jpg",position:"65% 55%",alt:"透明玻璃草莓与淡绿色叶片",sample:true},
    {id:"wind",type:"song",title:"风经过的声音",date:"2026-10-02",people:["b"],note:"有一首歌，让人想起透明的风。",body:"这是一条歌曲记录示例。可以填写歌名、歌手、当时听歌的感受，再添加音乐平台链接。",songTitle:"待放入的一首歌",artist:"歌手待填写",image:"assets/mist-fountain.jpg",position:"90% 10%",alt:"柔雾蓝色背景中的细碎喷泉",sample:true},
    {id:"light",type:"sentence",title:"收藏一束光",date:"2026-10-01",people:["a"],note:"重要的东西，可以轻轻地发亮。",body:"“像把重要的东西轻轻放进水里，安静发亮。”\n\n这是一条句子记录示例，使用了记忆馆的概念文字。",image:"assets/starfish.jpg",position:"20% 70%",alt:"浅青水纹中的两枚蓝色海星",sample:true},
    {id:"sky",type:"sky",title:"给天空留一个位置",date:"2026-09-30",people:["a","b"],note:"某一天的云，某一种心情。",body:"这是一条天空记录示例。真正的天空照片还没有放进来，先为它留一个位置。",sample:true},
    {id:"screenshot",type:"screenshot",title:"没舍得删掉的一句话",date:"2026-09-29",people:["b"],note:"一张截图，也可以是一枚小小的记忆。",body:"这是一条截图记录示例。之后放入真实截图，可以附上日期和想留下它的原因。",sample:true}
  ],
  imaginations: [
    {id:"water-and-memory",title:"如果记忆是一片水",date:"2026-10-03",note:"有些事沉在水底，有些事轻轻浮起。",body:"这是意象联想的展示示例。\n\n一片水，可以同时装下很多东西：一朵花、一阵风、一句说过的话。它们没有消失，只是换了一种安静的方式留着。\n\n真正聊过的意象，可以慢慢放进这里。",memories:["water-letter","light"],sample:true},
    {id:"glass-and-wind",title:"把风装进玻璃里",date:"2026-10-02",note:"透明的东西，也能保存声音。",body:"这是意象联想的展示示例。\n\n玻璃风铃像一个小小的容器：看起来空着，风经过时却有了声音。\n\n可以记录一次联想，也可以把它连到一首歌、一张照片。",memories:["wind"],sample:true}
  ],
  letters: [
    {id:"first-letter",title:"给未来某一天的你",date:"2026-10-03",from:"a",to:"b",body:"亲爱的你：\n\n这是一封用于预览排版的示例信。\n\n这里可以放下一封慢慢写完的信。也许是今天没说完的话，也许是想告诉未来的你的一件小事。\n\n等真正的信到来，这一页就交给它。",sample:true},
    {id:"reply",title:"等水面安静下来",date:"2026-10-02",from:"b",to:"a",body:"给你：\n\n这也是一封示例信，展示另一位写信人的位置。\n\n信可以很长，也可以只有几句话。每一封都保留自己的日期，留在这里，随时回来读。",sample:true}
  ],
  today: [{id:"today-lei",date:"2026-10-03",author:"b",text:"Lei 今天的一句，待留下。",sample:true},{id:"today-001",date:"2026-10-03",author:"a",text:"今天，给一些重要的东西留了一个位置。",sample:true}]
};
