
(() => {
  const COURSE = window.COURSE;
  const KEY = 'aws-devops-quest-progress-v2';
  const THEME_KEY = 'aws-devops-quest-theme';
  const defaultState = {name:'Learner',xp:0,completedLessons:{},completedStages:{},quizScores:{},activity:[],lastActive:null,streak:0};
  let state = load();
  let quizSession = null;

  function load(){
    try { return {...defaultState, ...JSON.parse(localStorage.getItem(KEY)||'{}')}; }
    catch { return {...defaultState}; }
  }
  function save(){ localStorage.setItem(KEY, JSON.stringify(state)); }
  function key(stageId, lessonIndex){ return `${stageId}:${lessonIndex}`; }
  function stageDone(stageId){ return !!state.completedStages[stageId]; }
  function unlocked(stageId){ return stageId === 1 || stageDone(stageId-1); }
  function completedLesson(stageId, lessonIndex){ return !!state.completedLessons[key(stageId,lessonIndex)]; }
  function totalLessons(){ return COURSE.reduce((n,s)=>n+s.lessons.length,0); }
  function completedCount(){ return Object.keys(state.completedLessons).length; }
  function percent(){ return Math.round((completedCount()/totalLessons())*100)||0; }
  function completedStageCount(){ return Object.keys(state.completedStages).length; }
  function stageProgress(stage){ return Math.round(stage.lessons.filter((_,i)=>completedLesson(stage.id,i)).length/stage.lessons.length*100); }
  function today(){ return new Date().toISOString().slice(0,10); }
  function touchActivity(label){
    const d=today();
    if(state.lastActive!==d){
      const prev=new Date(); prev.setDate(prev.getDate()-1);
      state.streak = state.lastActive===prev.toISOString().slice(0,10) ? state.streak+1 : 1;
      state.lastActive=d;
    }
    state.activity.unshift({date:new Date().toISOString(),label});
    state.activity=state.activity.slice(0,12);
    save();
  }
  function award(amount,label){ state.xp += amount; touchActivity(`${label} · +${amount} XP`); toast(`+${amount} XP`); }
  function toast(msg){ const t=document.getElementById('toast'); if(!t)return;t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),1800); }
  function esc(s=''){ return String(s).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m])); }
  function route(){ return (location.hash||'#/home').slice(2).split('/'); }
  function navigate(path){ location.hash='#/'+path; }

  function shell(content,active='home'){
    document.documentElement.dataset.theme=localStorage.getItem(THEME_KEY)||'light';
    return `<a href="#main" class="skip-link">Skip to content</a><div class="app-shell">
      <header class="topbar"><div class="brand"><div class="brand-mark">AQ</div>AWS DevOps Quest</div>
      <nav class="nav" aria-label="Primary">${navButton('home','Home',active)}${navButton('path','Learning Path',active)}${navButton('progress','Progress',active)}${navButton('settings','Settings',active)}</nav>
      <div class="stats-mini"><div class="stat-pill">🔥 ${state.streak}</div><div class="stat-pill">⚡ ${state.xp} XP</div></div>
      <button class="icon-btn" data-action="theme" aria-label="Toggle theme">◐</button></header>
      <main class="main" id="main">${content}</main>
      <nav class="mobile-nav" aria-label="Mobile navigation">${mobileButton('home','⌂','Home')}${mobileButton('path','🧭','Path')}${mobileButton('progress','📊','Progress')}${mobileButton('settings','⚙','Settings')}</nav>
      <footer class="footer">Independent learning project. Not affiliated with AWS or Duolingo.</footer></div>`;
  }
  function navButton(path,label,active){ return `<button class="${active===path?'active':''}" data-nav="${path}">${label}</button>`; }
  function mobileButton(path,icon,label){ return `<button data-nav="${path}"><span>${icon}</span>${label}</button>`; }

  function homeView(){
    const next = COURSE.find(s=>unlocked(s.id)&&!stageDone(s.id)) || COURSE[COURSE.length-1];
    const nextLesson = next.lessons.findIndex((_,i)=>!completedLesson(next.id,i));
    const target = nextLesson>=0 ? `lesson/${next.id}/${nextLesson}` : `stage/${next.id}`;
    const recent = state.activity.length ? state.activity.slice(0,5).map(a=>`<div class="timeline-item"><div class="timeline-dot"></div><div><strong>${esc(a.label)}</strong><br><small>${new Date(a.date).toLocaleString()}</small></div></div>`).join('') : `<div class="empty">Complete a lesson to start your activity timeline.</div>`;
    return shell(`<section class="hero"><div class="hero-card"><div class="eyebrow">Learn by building</div><h1>Build the platform, one mission at a time.</h1><p>45 substantive lessons across Python, Docker, Terraform, ECS, Redis, PostgreSQL, CI/CD, observability, security, scaling, and cost control.</p><div class="hero-actions"><button class="btn btn-primary" data-nav="${target}">Continue: Stage ${next.id}</button><button class="btn btn-secondary" data-nav="path">View full path</button></div></div>
      <div class="side-card"><div><div class="eyebrow">Overall progress</div><div class="ring-wrap"><div class="ring" style="--p:${percent()}"><strong>${percent()}%</strong><span>${completedCount()}/${totalLessons()} lessons</span></div></div></div><div><strong>${completedStageCount()} of 15 stages complete</strong><p style="color:var(--muted)">Your progress is stored locally. Export it from Settings before changing devices.</p></div></div></section>
      <div class="section-head"><div><h2>Your command center</h2><p>Small sessions compound into a production platform.</p></div></div>
      <section class="dashboard-grid"><div class="card"><div class="metric-grid"><div class="metric"><small>Total XP</small><strong>${state.xp}</strong></div><div class="metric"><small>Streak</small><strong>${state.streak} days</strong></div><div class="metric"><small>Lessons</small><strong>${completedCount()}</strong></div><div class="metric"><small>Stages</small><strong>${completedStageCount()}</strong></div></div><div class="section-head"><div><h2>Recent activity</h2></div></div><div class="timeline">${recent}</div></div>
      <aside class="card"><div class="eyebrow">Next mission</div><h2>Stage ${next.id}: ${esc(next.title)}</h2><p>${esc(next.outcome)}</p><div class="progress"><span style="width:${stageProgress(next)}%"></span></div><button class="btn btn-primary" data-nav="${target}">Resume learning</button></aside></section>`, 'home');
  }

  function pathView(){
    const cards=COURSE.map(stage=>{
      const p=stageProgress(stage), done=stageDone(stage.id), lock=!unlocked(stage.id);
      return `<article class="card stage-card ${lock?'locked':''}"><div class="stage-top"><div class="stage-icon">${stage.icon}</div><span class="badge ${done?'done':''}">${done?'Complete':lock?'Locked':stage.track}</span></div><h3>Stage ${stage.id}: ${esc(stage.title)}</h3><p>${esc(stage.outcome)}</p><div class="progress"><span style="width:${p}%"></span></div><div class="stage-meta"><span>◷ ${stage.duration}</span><span>⚡ ${stage.xp} XP</span></div>${lock?'':`<button class="stage-link" aria-label="Open Stage ${stage.id}" data-nav="stage/${stage.id}"></button>`}</article>`;
    }).join('');
    return shell(`<div class="section-head"><div><div class="eyebrow">15-stage curriculum</div><h2>Production platform learning path</h2><p>Stages unlock after you complete the previous checkpoint.</p></div></div><section class="stage-grid">${cards}</section>`,'path');
  }

  function stageView(id){
    const stage=COURSE.find(s=>s.id===id); if(!stage)return notFound();
    if(!unlocked(id))return shell(`<div class="card empty"><h2>Stage locked</h2><p>Complete Stage ${id-1} first.</p><button class="btn btn-primary" data-nav="stage/${id-1}">Go to previous stage</button></div>`,'path');
    const lessons=stage.lessons.map((l,i)=>`<article class="lesson-row ${completedLesson(id,i)?'complete':''}"><div class="lesson-index">${completedLesson(id,i)?'✓':i+1}</div><div><h3>${esc(l.title)}</h3><p>${esc(l.summary)} · ${l.minutes} min lesson</p></div><button class="btn ${completedLesson(id,i)?'btn-secondary':'btn-primary'}" data-nav="lesson/${id}/${i}">${completedLesson(id,i)?'Review':'Start'}</button></article>`).join('');
    const all=stage.lessons.every((_,i)=>completedLesson(id,i));
    return shell(`<div class="breadcrumbs"><button data-nav="path">Learning Path</button> / Stage ${id}</div><section class="card stage-hero"><div><div class="eyebrow">${esc(stage.track)} · ${stage.duration}</div><h1>${stage.icon} ${esc(stage.title)}</h1><p>${esc(stage.outcome)}</p><div class="progress"><span style="width:${stageProgress(stage)}%"></span></div></div><div class="stage-number">${id}</div></section>
      <div class="section-head"><div><h2>Lessons</h2><p>Read, perform the mission, and mark the lesson complete.</p></div></div><section class="lesson-list">${lessons}</section>
      <div class="section-head"><div><h2>Stage checkpoint</h2><p>Score at least 75% to complete the stage and unlock the next one.</p></div></div><section class="card"><h3>${all?'You are ready.':'Complete all lessons first.'}</h3><p>${all?'The checkpoint contains four questions and immediate explanations.':`You have completed ${stage.lessons.filter((_,i)=>completedLesson(id,i)).length} of ${stage.lessons.length} lessons.`}</p><button class="btn btn-primary" ${all?'':'disabled'} data-nav="quiz/${id}">${stageDone(id)?'Retake checkpoint':'Start checkpoint'}</button></section>`,'path');
  }

  function lessonView(stageId,lessonIndex){
    const stage=COURSE.find(s=>s.id===stageId); const lesson=stage?.lessons[lessonIndex]; if(!lesson)return notFound();
    if(!unlocked(stageId))return stageView(stageId);
    const sections=lesson.sections.map(sec=>`<section class="content-section"><h2>${esc(sec.heading)}</h2>${(sec.paragraphs||[]).map(p=>`<p>${esc(p)}</p>`).join('')}${sec.bullets?`<ul>${sec.bullets.map(b=>`<li>${esc(b)}</li>`).join('')}</ul>`:''}${sec.code?`<div class="code"><button class="copy-btn" data-copy="${encodeURIComponent(sec.code)}">Copy</button>${esc(sec.code)}</div>`:''}</section>`).join('');
    const complete=completedLesson(stageId,lessonIndex);
    const prev=lessonIndex>0?`lesson/${stageId}/${lessonIndex-1}`:`stage/${stageId}`;
    const next=lessonIndex<stage.lessons.length-1?`lesson/${stageId}/${lessonIndex+1}`:`stage/${stageId}`;
    return shell(`<article class="lesson-content"><div class="breadcrumbs"><button data-nav="path">Path</button> / <button data-nav="stage/${stageId}">Stage ${stageId}</button> / Lesson ${lessonIndex+1}</div><div class="eyebrow">${stage.icon} Stage ${stageId} · ${lesson.minutes} minutes</div><h1>${esc(lesson.title)}</h1><p class="lead">${esc(lesson.summary)}</p>${sections}
      <section class="mission ${complete?'done':''}"><div class="eyebrow">Hands-on mission</div><h2>${esc(lesson.task)}</h2><p><strong>Done when:</strong> ${esc(lesson.check)}</p><button class="btn ${complete?'btn-secondary':'btn-primary'}" data-complete="${stageId}:${lessonIndex}">${complete?'✓ Completed — mark incomplete':'Mark mission complete'}</button></section>
      <div class="lesson-nav"><button class="btn btn-secondary" data-nav="${prev}">← Previous</button><button class="btn btn-primary" data-nav="${next}">Next →</button></div></article>`,'path');
  }

  function startQuiz(stageId){
    const stage=COURSE.find(s=>s.id===stageId); if(!stage)return notFound();
    if(!stage.lessons.every((_,i)=>completedLesson(stageId,i)))return stageView(stageId);
    if(!quizSession || quizSession.stageId!==stageId) quizSession={stageId,index:0,answers:[],checked:false};
    return quizView();
  }
  function quizView(){
    const stage=COURSE.find(s=>s.id===quizSession.stageId); const q=stage.quiz[quizSession.index];
    if(quizSession.index>=stage.quiz.length)return quizResult(stage);
    const chosen=quizSession.answers[quizSession.index];
    const answers=q.options.map((o,i)=>{let cls='answer';if(chosen===i)cls+=' selected';if(quizSession.checked){if(i===q.answer)cls+=' correct';else if(i===chosen)cls+=' wrong';}return `<button class="${cls}" data-answer="${i}" ${quizSession.checked?'disabled':''}>${String.fromCharCode(65+i)}. ${esc(o)}</button>`}).join('');
    return shell(`<section class="quiz"><div class="card quiz-card"><div class="quiz-count">Stage ${stage.id} checkpoint · Question ${quizSession.index+1}/${stage.quiz.length}</div><div class="progress"><span style="width:${(quizSession.index/stage.quiz.length)*100}%"></span></div><h2>${esc(q.q)}</h2><div class="answers">${answers}</div>${quizSession.checked?`<div class="feedback"><strong>${chosen===q.answer?'Correct':'Review this'}</strong><br>${esc(q.explain)}</div>`:''}<div class="lesson-nav"><button class="btn btn-secondary" data-nav="stage/${stage.id}">Exit</button><button class="btn btn-primary" data-quiz-next ${chosen===undefined?'disabled':''}>${quizSession.checked?'Continue':'Check answer'}</button></div></div></section>`,'path');
  }
  function quizResult(stage){
    const score=stage.quiz.reduce((n,q,i)=>n+(quizSession.answers[i]===q.answer?1:0),0); const pct=Math.round(score/stage.quiz.length*100); const passed=pct>=75;
    if(passed && !stageDone(stage.id)){
      state.completedStages[stage.id]=true; state.quizScores[stage.id]=pct; award(stage.xp,`Completed Stage ${stage.id}`); save();
    } else { state.quizScores[stage.id]=Math.max(state.quizScores[stage.id]||0,pct); save(); }
    const next=stage.id<COURSE.length?`stage/${stage.id+1}`:'progress';
    return shell(`<section class="quiz"><div class="card result"><div class="confetti">${passed?'🎉 ⚡ 🏆':'🧠 🔁'}</div><div class="big">${pct}%</div><h1>${passed?'Stage complete!':'Almost there'}</h1><p>${passed?`You completed Stage ${stage.id} and unlocked the next stage.`:'Review the lessons and score at least 75%.'}</p><div class="hero-actions" style="justify-content:center"><button class="btn btn-secondary" data-retry-quiz="${stage.id}">Retake</button><button class="btn btn-primary" data-nav="${passed?next:`stage/${stage.id}`}">${passed?(stage.id<15?'Next stage':'View progress'):'Review stage'}</button></div></div></section>`,'path');
  }

  function progressView(){
    const stageRows=COURSE.map(s=>`<div class="timeline-item"><div class="lesson-index">${stageDone(s.id)?'✓':s.id}</div><div style="flex:1"><strong>${esc(s.title)}</strong><div class="progress"><span style="width:${stageProgress(s)}%"></span></div></div><div><strong>${stageProgress(s)}%</strong><br><small>${state.quizScores[s.id]!==undefined?`Quiz ${state.quizScores[s.id]}%`:''}</small></div></div>`).join('');
    return shell(`<div class="section-head"><div><div class="eyebrow">Learning analytics</div><h2>Your progress</h2><p>Progress measures completed missions and passed checkpoints, not passive reading.</p></div></div><section class="card"><div class="metric-grid"><div class="metric"><small>Course</small><strong>${percent()}%</strong></div><div class="metric"><small>XP</small><strong>${state.xp}</strong></div><div class="metric"><small>Streak</small><strong>${state.streak}</strong></div><div class="metric"><small>Completed</small><strong>${completedStageCount()}/15</strong></div></div></section><div class="section-head"><div><h2>Stage breakdown</h2></div></div><section class="card timeline">${stageRows}</section>`,'progress');
  }

  function settingsView(){
    return shell(`<div class="section-head"><div><div class="eyebrow">Local profile</div><h2>Settings and data</h2><p>This static release stores progress only in your browser.</p></div></div><section class="settings-grid"><div class="card"><h2>Profile</h2><div class="field"><label for="name">Display name</label><input id="name" value="${esc(state.name)}" maxlength="40"></div><button class="btn btn-primary" data-save-name>Save name</button><h2>Appearance</h2><button class="btn btn-secondary" data-action="theme">Toggle light/dark theme</button></div><div class="card"><h2>Progress backup</h2><p>Export a JSON backup before clearing browser data or moving devices.</p><div class="hero-actions"><button class="btn btn-secondary" data-export>Export progress</button><label class="btn btn-secondary">Import progress<input type="file" id="importFile" accept="application/json" hidden></label></div><hr style="border:0;border-top:1px solid var(--line);margin:28px 0"><h2>Danger zone</h2><p>Reset removes all local XP, streaks, lesson completion, and quiz scores.</p><button class="btn btn-danger" data-reset>Reset all progress</button></div></section>`,'settings');
  }

  function notFound(){ return shell(`<div class="card empty"><h2>Page not found</h2><button class="btn btn-primary" data-nav="home">Return home</button></div>`); }
  function render(){
    const [view,a,b]=route(); let html;
    if(view==='home')html=homeView(); else if(view==='path')html=pathView(); else if(view==='stage')html=stageView(Number(a)); else if(view==='lesson')html=lessonView(Number(a),Number(b)); else if(view==='quiz')html=startQuiz(Number(a)); else if(view==='progress')html=progressView(); else if(view==='settings')html=settingsView(); else html=notFound();
    document.getElementById('app').innerHTML=html; window.scrollTo({top:0,behavior:'instant'});
  }

  document.addEventListener('click',e=>{
    const nav=e.target.closest('[data-nav]'); if(nav){navigate(nav.dataset.nav);return;}
    const theme=e.target.closest('[data-action="theme"]'); if(theme){const n=(document.documentElement.dataset.theme==='dark')?'light':'dark';localStorage.setItem(THEME_KEY,n);document.documentElement.dataset.theme=n;return;}
    const comp=e.target.closest('[data-complete]'); if(comp){const [s,l]=comp.dataset.complete.split(':').map(Number);const k=key(s,l);if(state.completedLessons[k]){delete state.completedLessons[k];touchActivity(`Reopened Stage ${s} lesson ${l+1}`);}else{state.completedLessons[k]=true;award(30,`Completed Stage ${s} lesson ${l+1}`);}save();render();return;}
    const copy=e.target.closest('[data-copy]');if(copy){navigator.clipboard?.writeText(decodeURIComponent(copy.dataset.copy));toast('Copied');return;}
    const ans=e.target.closest('[data-answer]');if(ans&&quizSession&&!quizSession.checked){quizSession.answers[quizSession.index]=Number(ans.dataset.answer);render();return;}
    const qnext=e.target.closest('[data-quiz-next]');if(qnext&&quizSession){if(!quizSession.checked){quizSession.checked=true;}else{quizSession.index++;quizSession.checked=false;}render();return;}
    const retry=e.target.closest('[data-retry-quiz]');if(retry){quizSession={stageId:Number(retry.dataset.retryQuiz),index:0,answers:[],checked:false};render();return;}
    if(e.target.closest('[data-save-name]')){const val=document.getElementById('name').value.trim();state.name=val||'Learner';save();toast('Profile saved');return;}
    if(e.target.closest('[data-export]')){const blob=new Blob([JSON.stringify(state,null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='aws-devops-quest-progress.json';a.click();URL.revokeObjectURL(a.href);return;}
    if(e.target.closest('[data-reset]')){if(confirm('Reset all local progress?')){state={...defaultState,completedLessons:{},completedStages:{},quizScores:{},activity:[]};save();quizSession=null;render();}return;}
  });
  document.addEventListener('change',e=>{if(e.target.id==='importFile'){const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{state={...defaultState,...JSON.parse(r.result)};save();toast('Progress imported');render();}catch{alert('Invalid progress file.');}};r.readAsText(f);}});
  window.addEventListener('hashchange',()=>{quizSession=null;render();});
  render();
})();
