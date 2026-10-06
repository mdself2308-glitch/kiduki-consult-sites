// Monetary values and bookable scope come exclusively from the server catalog.
// Contact/employee data stay in memory. Only short-lived opaque identifiers are
// kept in sessionStorage so the Stripe return can read the authoritative order.
const $ = (id) => document.getElementById(id);
const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const yen = (value) => `${new Intl.NumberFormat('ja-JP').format(value)}円`;
const dateTime = (value) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
const dayLabel = (value) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', month: 'long', day: 'numeric', weekday: 'short' }).format(new Date(value));
const timeLabel = (value) => new Intl.DateTimeFormat('ja-JP', { timeZone: 'Asia/Tokyo', hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(value));
const jstDate = (value) => new Intl.DateTimeFormat('sv-SE', {timeZone:'Asia/Tokyo', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(value));
const apiBase = document.body.dataset.apiBase.replace(/\/$/, '');
const storageKey = 'kiduki.spot.session.v1';
const errorMessages = {COMPANY_IDENTITY_MISMATCH:'このメールアドレスは別の企業情報で登録済みです。登録時の企業情報をご確認ください。',CHECKOUT_PENDING:'決済画面を準備しています。同じ内容のまま、少し待ってもう一度お試しください。',ORDER_BUSY:'お申し込み内容を確認しています。少し待ってから、同じ内容でお試しください。',IDEMPOTENCY_CONFLICT:'前回の確認中にお申し込み内容が変わりました。二重のお申し込みを避けるため、お問い合わせください。',QUOTE_EXPIRED:'お支払い前の確認期限が切れました。最新のメニューと空き日時を確認して、選び直してください。',INVALID_CODE:'確認コードが一致しません。メールに記載された6桁の数字をご確認ください。',INVALID_OR_EXPIRED_CODE:'確認コードが無効か、有効期限が切れました。メールアドレスの確認に戻り、コードを再送してください。',RATE_LIMITED:'試行回数が多いため、しばらく時間をおいてお試しください。',INVALID_CONTACT:'会社名・担当者名・メールアドレス・電話番号の入力内容をご確認ください。',BOOKING_UNAVAILABLE:'現在、予約受付を停止しています。お支払い済みの場合は、重複して申し込まずお問い合わせください。',INVALID_RELATED_ORDER:'関連する予約番号を確認できませんでした。予約時の担当者メールアドレスと予約番号をご確認ください。'};
const state = { catalog:null, stage:'menu', service:null, feedbackMinutes:0, contact:null, employee:null, relatedOrderId:'', challenge:null, token:null, expiresAt:null, slots:[], slot:null, rangeOffset:0, clientRequestId:null, orderId:null, recoverOrderId:null, busy:false, pollCount:0, pollTimer:null };

// Optional analytics never receive order/contact/service data. Private deduplication
// references remain in this tab's sessionStorage and are not event parameters.
const spotAnalyticsEvents = new Set(['spot_menu_view','spot_booking_start','spot_contact_verified','spot_slots_view','spot_checkout_start','spot_booking_confirmed']);
function createSpotTelemetry({send,choiceStore,sessionStore,now=()=>Date.now(),onChoiceChange=()=>{}}) {
  const choiceKey='kiduki.spot.analytics.choice.v1',seenKey='kiduki.spot.analytics.seen.v1';
  let choice='unset',choiceExpiresAt=0,writeFailed=false,seen=new Set();
  function refreshChoice(notify=true) {
    const previous=choice;
    // A failed refusal write must never restore an older persisted grant.
    if(writeFailed)return 'denied';
    try {const saved=JSON.parse(choiceStore.getItem(choiceKey)||'null');
      choice=saved?.expiresAt>now()&&['granted','denied'].includes(saved.choice)?saved.choice:'unset';
      choiceExpiresAt=choice==='unset'?0:saved.expiresAt;
    } catch {choice='unset';choiceExpiresAt=0;} // Unreadable or invalid consent fails closed.
    if(notify&&previous!==choice)onChoiceChange(choice);
    return choice;
  }
  refreshChoice(false);
  try {const saved=JSON.parse(sessionStore.getItem(seenKey)||'null');if(saved?.expiresAt>now()&&Array.isArray(saved.keys))seen=new Set(saved.keys.filter(x=>typeof x==='string').slice(-100));} catch {}
  return {
    choice:()=>refreshChoice(),refreshChoice,
    expiresAt:()=>choiceExpiresAt,writeFailed:()=>writeFailed,
    choose(value){
      if(!['granted','denied'].includes(value))return;
      choice=value;choiceExpiresAt=now()+30*86400000;
      try{choiceStore.setItem(choiceKey,JSON.stringify({choice,expiresAt:choiceExpiresAt}));writeFailed=false;}
      catch{choice='denied';writeFailed=true;try{choiceStore.removeItem(choiceKey);}catch{}}
    },
    track(name,privateKey='flow') {
      if(refreshChoice()!=='granted'||!spotAnalyticsEvents.has(name))return false;
      const key=`${name}:${privateKey}`;if(seen.has(key))return false;
      try {
        // Only the fixed event name crosses the transport boundary.
        if(!send(name))return false;
        seen.add(key);seen=new Set([...seen].slice(-100));
        try{sessionStore.setItem(seenKey,JSON.stringify({keys:[...seen],expiresAt:now()+86400000}));}catch{}
        return true;
      } catch {return false;} // Analytics must not interrupt a booking.
    }
  };
}
const unavailableStorage={getItem:()=>{throw new Error('Storage unavailable');},setItem:()=>{throw new Error('Storage unavailable');}};
function optionalStorage(name){try{return window[name]||unavailableStorage;}catch{return unavailableStorage;}}
const analyticsId=document.body.dataset.spotAnalyticsId||'';
// This marker is set only after the dedicated GA4 stream's Enhanced Measurement,
// user-provided data capabilities and additional destinations are verified OFF. Never reuse the homepage stream.
const analyticsReady=/^G-[A-Z0-9]{6,20}$/.test(analyticsId)&&analyticsId!=='G-JQFWB6XG2E'&&document.body.dataset.spotAnalyticsReviewed==='true';
let analyticsStarted=false,analyticsBound=false,analyticsFlow='initial',analyticsExpiryTimer=null,analyticsChoiceChannel=null;
const spotTelemetry=createSpotTelemetry({choiceStore:optionalStorage('localStorage'),sessionStore:optionalStorage('sessionStorage'),send:sendSpotAnalytics,onChoiceChange:syncSpotAnalyticsConsent});
function startSpotAnalytics() {
  if(!analyticsReady||spotTelemetry.choice()!=='granted')return false;
  window[`ga-disable-${analyticsId}`]=false;
  if(analyticsStarted)return true;
  // A pre-existing tag could have incompatible automatic collection. Fail closed.
  if(typeof window.gtag==='function'||document.querySelector('script[src*="googletagmanager.com"]'))return false;
  window.dataLayer=[];window.gtag=function(){window.dataLayer.push(arguments);};
  window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('consent','update',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  window.gtag('set','ads_data_redaction',true);
  window.gtag('js',new Date());
  window.gtag('config',analyticsId,{send_page_view:false,allow_google_signals:false,allow_ad_personalization_signals:false,
    page_location:'https://consult.kdkconslt-sngyouijm.com/spot/',page_referrer:'',page_title:'KIDUKI SPOT予約',
    campaign_source:'direct',campaign_medium:'none',campaign_name:'none',campaign_term:'',campaign_content:'',
    cookie_prefix:'kiduki_spot',cookie_domain:'none',cookie_path:'/spot/',cookie_expires:0,
    linker:{accept_incoming:false,domains:[]}});
  const tag=document.createElement('script');tag.async=true;tag.referrerPolicy='no-referrer';
  tag.src=`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`;
  document.head.appendChild(tag);analyticsStarted=true;return true;
}
function sendSpotAnalytics(name) {
  if(!spotAnalyticsEvents.has(name)||!startSpotAnalytics())return false;
  window.gtag('event',name,{send_to:analyticsId,source_page:'spot-booking',
    page_location:'https://consult.kdkconslt-sngyouijm.com/spot/',page_referrer:'',page_title:'KIDUKI SPOT予約',
    transport_type:'beacon'});return true;
}
function trackSpot(name,key=analyticsFlow){spotTelemetry.track(name,key);}
function syncSpotAnalyticsConsent() {
  const choice=spotTelemetry.choice(),status=$('analytics-status');
  if(analyticsReady)window[`ga-disable-${analyticsId}`]=choice!=='granted';
  if(analyticsStarted)window.gtag('consent','update',{analytics_storage:choice==='granted'?'granted':'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  if(status)status.textContent=spotTelemetry.writeFailed()?'この画面では計測を停止しています。選択を保存できなかったため、ブラウザーの保存設定をご確認ください。':choice==='granted'?'許可しています。いつでも変更できます。':choice==='denied'?'許可していません。予約には影響しません。':'未選択です。計測情報は送信していません。';
  document.querySelectorAll('[data-analytics-choice]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.analyticsChoice===choice)));
  clearTimeout(analyticsExpiryTimer);
  // Stop an already loaded tag when consent expires, including a long-lived tab.
  if(choice==='granted')analyticsExpiryTimer=setTimeout(syncSpotAnalyticsConsent,Math.min(2147483647,Math.max(1,spotTelemetry.expiresAt()-Date.now())));
}
function setupSpotAnalytics() {
  if(!$('analytics-status'))return;
  if(!analyticsBound){analyticsBound=true;
    document.querySelectorAll('[data-analytics-choice]').forEach(button=>button.addEventListener('click',()=>{
      const choice=button.dataset.analyticsChoice;spotTelemetry.choose(choice);syncSpotAnalyticsConsent();
      // Refusal-only broadcast covers a blocked localStorage write. No personal
      // data or consent grant is sent to another tab by this channel.
      if(spotTelemetry.choice()!=='granted')try{analyticsChoiceChannel?.postMessage('denied');}catch{}
      if(choice==='granted'&&state.stage==='menu'&&state.catalog)trackSpot('spot_menu_view');
    }));
    try{analyticsChoiceChannel=new BroadcastChannel('kiduki.spot.analytics.choice.v1');
      analyticsChoiceChannel.addEventListener('message',event=>{if(event.data==='denied'){spotTelemetry.choose('denied');syncSpotAnalyticsConsent();}});
    }catch{} // Older or restricted browsers still use storage/focus/before-send checks.
    // LocalStorage choices apply to every open SPOT tab. Re-read before each
    // event too, so a delayed storage event cannot send after withdrawal.
    window.addEventListener('storage',event=>{if(event.key===null||event.key==='kiduki.spot.analytics.choice.v1')syncSpotAnalyticsConsent();});
    window.addEventListener('focus',syncSpotAnalyticsConsent);
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')syncSpotAnalyticsConsent();});
  }
  syncSpotAnalyticsConsent();
}

function readSession() {
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    if (!saved) return;
    state.orderId = typeof saved.orderId === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(saved.orderId) ? saved.orderId : null;
    if (!saved.token || !Number.isFinite(Date.parse(saved.expiresAt)) || Date.parse(saved.expiresAt) <= Date.now()) { state.token=null;state.expiresAt=null;saveSession();return; }
    state.token = saved.token; state.expiresAt = saved.expiresAt;
  } catch { /* Storage may be disabled; the non-payment flow remains available. */ }
}
function saveSession() {
  try { sessionStorage.setItem(storageKey, JSON.stringify({token:state.token, expiresAt:state.expiresAt, orderId:state.orderId})); return true; }
  catch { return false; }
}
function clearSession() {
  state.token = null; state.expiresAt = null;
  saveSession();
}
function validHttps(value) { try { const u = new URL(value); return u.protocol === 'https:' ? u.href : null; } catch { return null; } }
function showMessage(message) { const el = $('global-message'); el.textContent = message; el.hidden = false; }
function clearMessage() { $('global-message').hidden = true; $('global-message').textContent = ''; }
async function request(path, { method='GET', body, auth=false } = {}) {
  const controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(`${apiBase}${path}`, {method, mode:'cors', credentials:'omit', cache:'no-store', referrerPolicy:'no-referrer', signal:controller.signal, headers:{'Accept':'application/json', ...(body ? {'Content-Type':'application/json'} : {}), ...(auth && state.token ? {'Authorization':`Bearer ${state.token}`} : {})}, ...(body ? {body:JSON.stringify(body)} : {})});
    const result = await response.json().catch(() => ({}));
    if (!response.ok || result.ok !== true) { const code=String(result.code || result.error || '').toUpperCase();const error = new Error(result.message || errorMessages[code] || '手続きを完了できませんでした。時間をおいてお試しください。'); error.code = code; error.status = response.status; throw error; }
    return result;
  } catch (error) {
    if (error.name === 'AbortError') { const e = new Error('通信の確認に時間がかかっています。重複して申し込まず、もう一度確認してください。'); e.code = 'TIMEOUT'; throw e; }
    if (error instanceof TypeError) throw new Error('通信できませんでした。接続を確認し、もう一度お試しください。');
    throw error;
  } finally { clearTimeout(timeout); }
}
function validateCatalog(catalog) {
  if (catalog.currency !== 'JPY' || catalog.taxIncluded !== true || !Array.isArray(catalog.services) || !catalog.version) throw new Error('料金情報を確認できませんでした。再読み込みしてお試しください。');
  for (const service of catalog.services) {
    if (!service.id || !service.name || !Number.isSafeInteger(service.amountYen) || service.amountYen < 0 || !Number.isFinite(service.durationMinutes)) throw new Error('料金情報を確認できませんでした。');
    for (const option of service.feedbackOptions || []) if (!Number.isSafeInteger(option.amountYen) || !Number.isFinite(option.durationMinutes)) throw new Error('料金情報を確認できませんでした。');
  }
  return catalog;
}
function bookingEnabled() { return state.catalog?.bookingEnabled === true && state.catalog?.policyApproved === true; }
function selectedPlan() {
  if (!state.service) return null;
  const option = (state.service.feedbackOptions || []).find((item) => item.minutes === state.feedbackMinutes);
  return { ...state.service, ...(option ? { amountYen:option.amountYen, durationMinutes:option.durationMinutes } : {}), feedbackMinutes:state.feedbackMinutes };
}
function durationText(service) {
  if (service.interviewMinutes && service.feedbackMinutes) return `本人面談 ${service.interviewMinutes}分 ＋ 人事FB ${service.feedbackMinutes}分`;
  return `${service.durationMinutes}分`;
}
function nextLabel() { return ({menu:'ご担当者の入力へ',contact:'入力を確認して進む',otp:'確認コードを入力',slots:'内容の確認へ',review:'確認して支払いへ'})[state.stage] || '予約状況を確認'; }
function updateSummary() {
  if (state.stage === 'status') { $('mobile-summary').hidden=true;document.body.classList.remove('has-selection');return; }
  const plan = selectedPlan();
  if (!plan) { $('summary').innerHTML='<p class="eyebrow">YOUR BOOKING</p><h2>今回のご予約</h2><p class="muted">メニューを選ぶと、内容と税込総額がここに表示されます。</p><div class="summary-total"><span>お支払い総額（税込）</span><strong>—</strong></div><p class="summary-footnote">月額契約・自動更新はありません。</p>'; $('mobile-summary').hidden = true; document.body.classList.remove('has-selection'); return; }
  $('summary').innerHTML = `<p class="eyebrow">YOUR BOOKING</p><h2>今回のご予約</h2><p class="summary-name">${escapeHtml(plan.name)}</p><div class="summary-details"><p>${escapeHtml(durationText(plan))}</p><p>オンライン ／ 企業担当者による予約</p><ul><li>${plan.includesOpinion ? '産業医意見書・担当者への閲覧リンク' : '企業担当者への相談・フィードバック'}</li><li>表示額が今回のお支払い総額</li></ul></div>${state.slot ? `<div class="summary-date">${escapeHtml(dateTime(state.slot.start))}〜<br><small>日本時間（JST）</small></div>` : ''}<div class="summary-total"><span>お支払い総額（税込）</span><strong>${escapeHtml(yen(plan.amountYen))}</strong></div><p class="summary-footnote">月額契約・自動更新はありません。</p>${state.stage === 'menu' && bookingEnabled() ? '<button type="button" class="primary-button summary-action" data-action="continue">ご担当者の入力へ <span aria-hidden="true">→</span></button>' : ''}`;
  $('mobile-choice').textContent = plan.name;
  $('mobile-total').textContent = `${yen(plan.amountYen)}（税込）`;
  $('mobile-continue').textContent = nextLabel();
  $('mobile-continue').disabled = !bookingEnabled() || state.busy || state.stage === 'otp' || (state.stage === 'slots' && !state.slot);
  $('mobile-summary').hidden = state.stage === 'status';
  document.body.classList.toggle('has-selection', state.stage !== 'status');
}
function renderProgress() {
  const index = ({menu:0,contact:1,otp:1,slots:2,review:3,status:3})[state.stage];
  $('progress').innerHTML = ['メニュー','ご担当者','日時','確認・支払い'].map((name, i) => `<li ${i === index ? 'aria-current="step"' : ''} class="${i < index ? 'complete' : ''}">${i < index ? '✓' : i+1} ${name}</li>`).join('');
}
function moveTo(stage, {focus=true} = {}) {
  state.stage = stage; clearMessage(); renderProgress();
  ({menu:renderMenu,contact:renderContact,otp:renderOtp,slots:renderSlots,review:renderReview})[stage]?.();
  $('stage').setAttribute('aria-busy', 'false'); updateSummary();
  if (focus) { $('stage').querySelector('h2')?.focus({preventScroll:true}); $('booking').scrollIntoView({block:'start',behavior:'auto'}); }
  if(stage==='menu')trackSpot('spot_menu_view');
  if(stage==='contact'&&!state.recoverOrderId&&state.service)trackSpot('spot_booking_start');
}
function menuOption(service) {
  const selected = state.service?.id === service.id;
  return `<label class="menu-option"><input type="radio" name="service" value="${escapeHtml(service.id)}" ${selected ? 'checked' : ''}><span><span class="menu-title">${escapeHtml(service.name)}</span><span class="menu-desc">${escapeHtml(service.description)}</span><span class="menu-duration">${escapeHtml(durationText(service))}${service.id === 'returnToWork' ? ' ／ セットでのご予約' : ''}</span><span class="menu-includes">${service.includesOpinion ? '産業医意見書を含みます' : '企業担当者向け'}</span></span><span class="menu-price"><strong>${escapeHtml(yen(service.amountYen))}</strong><small>税込総額</small></span></label>`;
}
function renderMenu() {
  const services = state.catalog.services;
  const interviews = services.filter((s) => s.requiresEmployee);
  const feedbacks = services.filter((s) => !s.requiresEmployee);
  $('stage').innerHTML = `<section class="stage-section"><p class="eyebrow">01 / MENU</p><h2 tabindex="-1">今回、必要な対応を選ぶ</h2><p class="stage-lead">料金はすべて税込。面談の内容と、含まれる対応をご確認ください。</p>${!bookingEnabled() ? '<div class="notice"><strong>オンライン予約は受付準備中です</strong>メニューと料金をご確認いただけます。ご依頼は<a href="https://kdkconslt-sngyouijm.com/contact/">お問い合わせ</a>から承ります。</div>' : ''}${interviews.length ? `<div class="menu-group"><h3>従業員の方との面談</h3><div class="menu-list">${interviews.map(menuOption).join('')}</div></div>` : ''}${feedbacks.length ? `<div class="menu-group"><h3>企業担当者へのフィードバック</h3><div class="menu-list">${feedbacks.map(menuOption).join('')}</div></div>` : ''}<div id="feedback-options" class="feedback-options" hidden></div><p class="menu-note">FBは、企業担当者へのフィードバックです。復職・両立支援は本人面談40分と人事FB30分のセットです。月額契約は必要ありません。</p><p class="menu-note">訪問やメニューにないご依頼は、<a href="https://kdkconslt-sngyouijm.com/contact/">個別にご相談ください</a>。</p><div class="actions menu-actions"><button type="button" class="primary-button" data-action="continue" ${!state.service || !bookingEnabled() ? 'disabled' : ''}>ご担当者の入力へ <span aria-hidden="true">→</span></button></div></section>`;
  renderFeedbackOptions();
}
function renderFeedbackOptions() {
  const el = $('feedback-options'); if (!el) return;
  const service = state.service;
  if (!service || service.id === 'returnToWork' || !service.requiresEmployee || !(service.feedbackOptions || []).some(option => option.minutes !== (service.feedbackMinutes || 0))) { el.innerHTML = ''; el.hidden = true; return; }
  const selectedCard = [...document.querySelectorAll('input[name="service"]')].find(input => input.value === service.id)?.closest('.menu-option');
  if (!selectedCard) { el.hidden = true; return; }
  selectedCard.after(el);
  el.hidden = false;
  const options = [{minutes:service.feedbackMinutes || 0,durationMinutes:service.durationMinutes,amountYen:service.amountYen}, ...service.feedbackOptions].filter((option,i,all) => all.findIndex((o) => o.minutes === option.minutes) === i);
  el.innerHTML = `<fieldset class="form-section"><legend>人事フィードバックを一緒に予約</legend><div class="menu-list">${options.map((option) => `<label class="menu-option"><input type="radio" name="feedback" value="${option.minutes}" ${state.feedbackMinutes === option.minutes ? 'checked' : ''}><span><span class="menu-title">${option.minutes ? `人事FB ${option.minutes}分を含める` : '面談のみ'}</span><span class="menu-duration">合計 ${option.durationMinutes}分</span></span><span class="menu-price"><strong>${escapeHtml(yen(option.amountYen))}</strong><small>税込総額</small></span></label>`).join('')}</div></fieldset>`;
}
function field(name,label,{type='text',required=true,value='',full=false,autocomplete='off',help='',pattern='',maxlength='200'}={}) {
  return `<label class="field ${full ? 'full' : ''}"><span class="field-label">${escapeHtml(label)} <span class="${required ? 'required' : 'optional'}">${required ? '必須' : '任意'}</span></span><input name="${name}" type="${type}" value="${escapeHtml(value)}" ${required ? 'required' : ''} autocomplete="${autocomplete}" maxlength="${maxlength}" ${pattern ? `pattern="${pattern}"` : ''}>${help ? `<span class="field-help">${escapeHtml(help)}</span>` : ''}</label>`;
}
function renderContact() {
  const c=state.contact || {}; const employee=state.employee || {}; const recovering=Boolean(state.recoverOrderId);
  $('stage').innerHTML = `<section class="stage-section"><p class="eyebrow">02 / CONTACT</p><h2 tabindex="-1">${recovering ? '予約時のご担当者を確認' : '企業のご担当者を登録'}</h2><p class="stage-lead">${recovering ? '予約時と同じメールアドレスで、確認コードを受け取ってください。認証後に元の予約状況へ戻ります。新しい申し込みや決済は行いません。' : 'ご担当者が予約・支払いを行います。メールに届く確認コードで、ご連絡先を確認します。'}</p><form id="contact-form"><fieldset class="form-section"><legend>企業・ご担当者</legend><div class="field-grid">${field('companyName','会社名',{value:c.companyName,full:true,autocomplete:'organization',maxlength:'120'})}${field('corporateNumber','法人番号',{value:c.corporateNumber,required:false,pattern:'[0-9]{13}',maxlength:'13',help:'数字13桁。分からない場合は空欄で構いません。'})}${field('contactName','ご担当者名',{value:c.contactName,autocomplete:'name',maxlength:'80'})}${field('email','ご担当者メールアドレス',{value:c.email,type:'email',full:true,autocomplete:'email',maxlength:'254'})}${field('phone','電話番号',{value:c.phone,type:'tel',autocomplete:'tel',full:true,maxlength:'30'})}</div></fieldset>${!recovering && state.service?.requiresEmployee ? `<fieldset class="form-section"><legend>面談を受ける従業員の方</legend><div class="field-grid">${field('employeeName','従業員氏名',{value:employee.name,autocomplete:'off',maxlength:'80',full:true,help:'参加案内は、企業担当者から面談を受ける方へ共有してください。'})}</div></fieldset>` : !recovering ? `<fieldset class="form-section"><legend>以前のご予約について</legend><div class="field-grid">${field('relatedOrderId','関連する予約番号',{value:state.relatedOrderId,required:false,full:true,pattern:'[A-Za-z0-9_-]+',help:'以前の面談へのFBの場合は、受付メールの予約番号を入力できます。'})}</div></fieldset>` : ''}<p class="menu-note">病名・症状・診断書の内容は入力しないでください。面談に必要な資料は、予約後の案内に沿ってご用意ください。</p><label class="check-row"><input type="checkbox" name="privacyConsent" required><span><a href="${escapeHtml(validHttps(state.catalog?.privacyUrl) || 'https://kdkconslt-sngyouijm.com/privacy-policy/')}" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>を確認し、予約とサービス提供に必要な情報を送信することに同意します。</span></label><div class="actions"><button type="button" class="text-button" data-action="${recovering ? 'return-status' : 'menu'}">${recovering ? '← 予約状況へ戻る' : '← メニューに戻る'}</button><button type="submit" class="primary-button">確認コードを送る <span aria-hidden="true">→</span></button></div></form></section>`;
  $('contact-form').addEventListener('submit', requestOtp);
}
async function requestOtp(event) {
  event.preventDefault(); const form = $('contact-form'); if (state.busy || !form.reportValidity()) return;
  const values = Object.fromEntries(new FormData(form));
  state.contact = {companyName:values.companyName.trim(),corporateNumber:values.corporateNumber.trim() || undefined,contactName:values.contactName.trim(),email:values.email.trim().toLowerCase(),phone:values.phone.trim()};
  state.employee = !state.recoverOrderId && state.service?.requiresEmployee ? {name:values.employeeName.trim()} : null;
  state.relatedOrderId = values.relatedOrderId?.trim() || '';
  await withBusy(async () => { clearSession(); state.challenge = await request('/otp/request',{method:'POST',body:state.contact}); moveTo('otp'); });
}
function renderOtp() {
  $('stage').innerHTML = `<section class="stage-section"><p class="eyebrow">02 / EMAIL VERIFICATION</p><h2 tabindex="-1">メールの確認コードを入力</h2><p class="stage-lead">${escapeHtml(state.challenge?.recipientHint || state.contact.email)} 宛てに送信したコードを入力してください。</p><form id="otp-form"><div class="otp-box">${field('code','確認コード',{maxlength:'6',pattern:'[0-9]{6}',autocomplete:'one-time-code'})}</div><p class="menu-note">有効期限：${state.challenge?.expiresAt ? escapeHtml(dateTime(state.challenge.expiresAt)) : 'メールに記載の期限をご確認ください。'}</p><div class="actions"><button type="button" class="text-button" data-action="contact">← メールアドレスを変更・再送</button><button class="primary-button" type="submit">確認して日時を選ぶ <span aria-hidden="true">→</span></button></div></form></section>`;
  $('otp-form').elements.code.inputMode='numeric';
  $('otp-form').addEventListener('submit',async(event) => {event.preventDefault(); if (state.busy || !event.currentTarget.reportValidity()) return; const code=event.currentTarget.elements.code.value; await withBusy(async()=> {const result=await request('/otp/verify',{method:'POST',body:{challengeId:state.challenge.challengeId,code}});state.token=result.sessionToken;state.expiresAt=result.expiresAt;state.contact={...state.contact,...result.contact};if (!saveSession()) throw new Error('このブラウザーでは予約状態を保存できません。ブラウザーの保存設定を確認してからお試しください。');if(state.recoverOrderId){state.orderId=state.recoverOrderId;state.recoverOrderId=null;saveSession();await loadStatus();}else{trackSpot('spot_contact_verified');state.rangeOffset=0;await loadSlots();}});});
}
async function loadSlots() {
  moveTo('slots'); $('stage').setAttribute('aria-busy','true');
  $('slot-results').innerHTML='<p class="notice" role="status">空き日時を確認しています…</p>';
  const from = jstDate(Date.now() + ((state.catalog.minNoticeHours || 48) / 24 + state.rangeOffset) * 86400000);
  const to = jstDate(Date.now() + ((state.catalog.minNoticeHours || 48) / 24 + state.rangeOffset + 13) * 86400000);
  try {
    const result=await request(`/slots?${new URLSearchParams({serviceId:state.service.id,feedbackMinutes:String(state.feedbackMinutes),from,to})}`,{auth:true});
    state.slots=(result.slots || []).filter((slot)=>Number.isFinite(Date.parse(slot.start)) && Number.isFinite(Date.parse(slot.end)) && Date.parse(slot.start) >= Date.now() + (state.catalog.minNoticeHours || 48)*3600000).sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
    if (state.slot && !state.slots.some((slot)=>slot.start===state.slot.start)) state.slot=null;
    renderSlots();updateSummary();trackSpot('spot_slots_view');
  } finally { $('stage').setAttribute('aria-busy','false'); }
}
function renderSlots() {
  const grouped=new Map();for(const slot of state.slots){const day=jstDate(slot.start);if(!grouped.has(day))grouped.set(day,[]);grouped.get(day).push(slot);}
  $('stage').innerHTML=`<section class="stage-section"><p class="eyebrow">03 / DATE & TIME</p><h2 tabindex="-1">空いている日時を選ぶ</h2><p class="stage-lead">表示はすべて日本時間です。48時間以上先の空き枠から選べます。</p><div class="notice"><strong>${escapeHtml(durationText(selectedPlan()))}</strong>オンラインで実施します。${state.service.id==='returnToWork' ? '本人面談と人事FBの両方を含む枠です。' : ''}日時は、支払い後の予約確定時に確保されます。</div><div class="slot-toolbar"><span>${state.rangeOffset===0 ? '直近の2週間' : `${state.rangeOffset}日後からの2週間`}</span><button type="button" class="text-button" data-action="refresh-slots">空き枠を更新</button></div><div id="slot-results">${grouped.size ? [...grouped].map(([day,slots])=>`<section class="slot-day"><h3>${escapeHtml(dayLabel(slots[0].start))}</h3><div class="slot-grid">${slots.map(slot=>`<button type="button" class="slot-button" data-start="${escapeHtml(slot.start)}" aria-pressed="${state.slot?.start===slot.start}">${escapeHtml(timeLabel(slot.start))}</button>`).join('')}</div></section>`).join('') : '<div class="empty-state"><strong>この期間には予約できる枠がありません。</strong><p>次の期間を確認するか、お問い合わせください。</p></div>'}</div><div class="slot-toolbar"><button type="button" class="text-button" data-action="earlier-slots" ${state.rangeOffset===0 ? 'disabled' : ''}>← 前の2週間</button><button type="button" class="text-button" data-action="later-slots">次の2週間 →</button></div><div class="actions"><button type="button" class="text-button" data-action="menu">← メニューを変更</button><button type="button" class="primary-button" data-action="continue" ${!state.slot ? 'disabled' : ''}>内容の確認へ <span aria-hidden="true">→</span></button></div></section>`;
}
function renderReview() {
  const plan=selectedPlan(),c=state.contact;
  const terms=validHttps(state.catalog.termsUrl),privacy=validHttps(state.catalog?.privacyUrl);
  $('stage').innerHTML=`<section class="stage-section"><p class="eyebrow">04 / REVIEW</p><h2 tabindex="-1">内容とお支払い総額の確認</h2><p class="stage-lead">次に、Stripeの決済画面へ進みます。決済後、この画面で予約の確定状況をご確認いただけます。</p><dl class="review-list"><div class="review-row"><dt>ご予約メニュー</dt><dd>${escapeHtml(plan.name)}<br>${escapeHtml(durationText(plan))}</dd></div><div class="review-row"><dt>日時</dt><dd>${escapeHtml(dateTime(state.slot.start))}〜${escapeHtml(timeLabel(state.slot.end))}（日本時間）</dd></div><div class="review-row"><dt>実施方法</dt><dd>オンライン面談</dd></div><div class="review-row"><dt>ご担当者</dt><dd>${escapeHtml(c.companyName)}<br>${escapeHtml(c.contactName)} 様<br>${escapeHtml(c.email)}<br>${escapeHtml(c.phone)}</dd></div>${state.employee ? `<div class="review-row"><dt>面談を受ける方</dt><dd>${escapeHtml(state.employee.name)} 様</dd></div>` : ''}<div class="review-row"><dt>面談後</dt><dd>${plan.includesOpinion ? '医師が記録・意見を確定後、意見書の閲覧リンクをご担当者へお送りします。' : 'ご担当者へのフィードバックを行います。'}</dd></div><div class="review-row total"><dt>総額（税込）</dt><dd>${escapeHtml(yen(plan.amountYen))}</dd></div></dl><div class="terms-copy"><p>この予約の表示総額に、システム利用料などの追加料金はかかりません。月額契約への自動移行はありません。</p><p><strong>キャンセルについて</strong><br>${escapeHtml(state.catalog.cancellationText || 'キャンセル条件は商取引に関する開示・利用条件をご確認ください。')}</p></div><form id="checkout-form"><label class="check-row"><input type="checkbox" name="acceptedTerms" required><span>${terms ? `<a href="${escapeHtml(terms)}" target="_blank" rel="noopener noreferrer">商取引に関する開示・利用条件</a>` : '商取引に関する開示・利用条件'}・${privacy ? `<a href="${escapeHtml(privacy)}" target="_blank" rel="noopener noreferrer">プライバシーポリシー</a>` : 'プライバシーポリシー'}・キャンセル条件を確認し、この内容で申し込みます。</span></label>${!terms || !privacy ? '<p class="notice">申込条件を確認できないため、現在は決済に進めません。時間をおいてお試しください。</p>' : ''}<div class="actions"><button type="button" class="text-button" data-action="back-slots">← 日時を変更</button><button type="submit" class="primary-button" ${!terms || !privacy ? 'disabled' : ''}>${escapeHtml(yen(plan.amountYen))}を支払う <span aria-hidden="true">→</span></button></div></form></section>`;
  $('checkout-form').addEventListener('submit',checkout);
}
async function checkout(event) {
  event.preventDefault(); if (state.busy || !$('checkout-form').reportValidity()) return;
  if (!state.clientRequestId) state.clientRequestId=crypto.randomUUID();
  await withBusy(async()=>{
    if (!saveSession()) throw new Error('予約状態を保存できないため、決済に進めません。ブラウザーの保存設定を確認してください。');
    const body={serviceId:state.service.id,feedbackMinutes:state.feedbackMinutes,start:state.slot.start,...(state.employee ? {employee:state.employee} : {}),...(state.relatedOrderId ? {relatedOrderId:state.relatedOrderId} : {}),clientRequestId:state.clientRequestId,catalogVersion:state.catalog.version,policyVersion:state.catalog.policyVersion,acceptedTerms:true};
    const result=await request('/checkout',{method:'POST',body,auth:true});state.orderId=result.orderId;
    if (!saveSession()) throw new Error('予約状態を保存できませんでした。決済には進まず、お問い合わせください。');
    const url=validHttps(result.checkoutUrl);
    if (!url || new URL(url).hostname !== 'checkout.stripe.com') throw new Error('決済画面のURLを確認できませんでした。重複して申し込まず、お問い合わせください。');
    trackSpot('spot_checkout_start',state.orderId);
    window.location.assign(url);
  },{checkout:true});
}
async function withBusy(fn,{checkout:checkingOut=false}={}) {
  if(state.busy)return;state.busy=true;clearMessage();document.querySelectorAll('#stage button, #summary button, #mobile-continue').forEach(b=>{b.dataset.wasDisabled=String(b.disabled);b.disabled=true;});
  try{await fn();}catch(error){
    if(['INVALID_CODE','INVALID_OR_EXPIRED_CODE'].includes(error.code)){showMessage(error.message);}
    else if(error.status===401 || error.code==='SESSION_EXPIRED'){clearSession();moveTo('contact');showMessage('確認の有効期限が切れました。メールアドレスをもう一度確認してください。');}
    else if(checkingOut && ['PRICE_CHANGED','CATALOG_CHANGED','POLICY_CHANGED','QUOTE_EXPIRED'].includes(error.code)){state.slot=null;state.clientRequestId=null;state.catalog=validateCatalog(await request('/catalog'));state.service=null;moveTo('menu');showMessage('料金または申込条件が更新されました。新しい内容を確認し、メニューを選び直してください。');}
    else if(checkingOut && ['SLOT_UNAVAILABLE','SLOT_CONFLICT'].includes(error.code)){state.slot=null;state.clientRequestId=null;await loadSlots().catch(()=>{});showMessage('選択した日時は予約できなくなりました。最新の空き日時から、もう一度選んでください。');}
    else showMessage(error.message || '手続きを完了できませんでした。もう一度お試しください。');
  }finally{state.busy=false;document.querySelectorAll('#stage button, #summary button, #mobile-continue').forEach(b=>{if(b.dataset.wasDisabled!==undefined){b.disabled=b.dataset.wasDisabled==='true';delete b.dataset.wasDisabled;}});updateSummary();}
}
function renderStatus(order,{cancelled=false}={}) {
  state.stage='status';renderProgress();$('mobile-summary').hidden=true;document.body.classList.remove('has-selection');
  const status=String(order.status || '').toUpperCase();const confirmed=status==='CONFIRMED';
  const messages={
    CONFIRMED:['予約が確定しました','ご担当者への案内メールをご確認ください。面談はオンラインで行います。'],
    REVIEW_REQUIRED:['予約内容を確認しています','現在の予約状況についてKIDUKIからご連絡します。重複した決済や再予約は行わず、ご案内をお待ちください。'],
    SLOT_UNAVAILABLE:['選択日時の予約を確定できませんでした','決済状況と今後の対応についてKIDUKIが確認します。重複して申し込まず、お問い合わせください。'],
    EXPIRED:['このお申し込みの有効期限が切れました','予約は確定していません。カードの請求が確認できる場合は、再度支払わずお問い合わせください。'],
    CANCELLED:['お申し込みはキャンセルされました','返金や日程変更については、KIDUKIからの案内をご確認ください。確認が必要な場合は、予約番号を添えてお問い合わせください。']
  };
  let [title,copy]=messages[status] || ['お支払いと予約の状況を確認しています','決済画面から戻っただけでは予約は確定していません。確認が終わるまで、再度支払わずにお待ちください。'];
  if(cancelled && !messages[status]){title='決済画面から戻りました';copy='お支払い・予約の確定はまだ確認できていません。画面を更新して状況を確認してください。';}
  $('stage').setAttribute('aria-busy','false');
  $('stage').innerHTML=`<section class="status-panel ${confirmed ? '' : 'warning'}"><p class="status-kicker">${confirmed ? 'BOOKING CONFIRMED' : 'BOOKING STATUS'}</p><h2 tabindex="-1">${escapeHtml(title)}</h2><p>${escapeHtml(copy)}</p><p class="status-reference">予約番号：${escapeHtml(order.orderId || state.orderId)}</p>${order.serviceName ? `<p><strong>${escapeHtml(order.serviceName)}</strong></p>` : ''}${order.start ? `<p>${escapeHtml(dateTime(order.start))}〜（日本時間）</p>` : ''}${Number.isSafeInteger(order.amountYen) ? `<p>お支払い総額（税込）：<strong>${escapeHtml(yen(order.amountYen))}</strong></p>` : ''}${order.message ? `<p>${escapeHtml(order.message)}</p>` : ''}${confirmed ? '<ol class="status-list"><li>案内メールで、面談の日時・参加方法・必要資料を確認します。従業員面談の参加案内は、企業担当者から面談を受ける方へ共有してください。</li><li>開始時刻になったら、予約確定後の面談リンクから参加します。</li><li>意見書のあるメニューでは、医師が記録・意見を確定後、ご担当者へ閲覧リンクをお送りします。</li></ol>' : ''}<div class="actions">${confirmed && validHttps(order.meetingUrl) ? `<a class="primary-button" href="${escapeHtml(validHttps(order.meetingUrl))}" target="_blank" rel="noopener noreferrer">予約確定後の面談リンク</a>` : ''}${validHttps(order.receiptUrl) ? `<a class="secondary-button" href="${escapeHtml(validHttps(order.receiptUrl))}" target="_blank" rel="noopener noreferrer">領収書を確認</a>` : ''}${!confirmed ? '<button type="button" class="secondary-button" data-action="refresh-status">状況を確認する</button>' : ''}</div><p><a href="https://kdkconslt-sngyouijm.com/contact/">予約について問い合わせる</a></p>${confirmed ? '<p><button type="button" class="text-button" data-action="new-booking">別の面談・人事FBを予約する</button></p>' : ''}</section>`;
  // Authoritative order amount is shown; never infer paid/confirmed from a URL.
  $('summary').innerHTML=`<p class="eyebrow">YOUR BOOKING</p><h2>ご予約の状況</h2><p class="summary-name">${escapeHtml(order.serviceName || 'ご予約内容を確認中')}</p>${Number.isSafeInteger(order.amountYen) ? `<div class="summary-total"><span>お支払い総額（税込）</span><strong>${escapeHtml(yen(order.amountYen))}</strong></div>` : ''}<p class="summary-footnote">決済と予約の状態は、サーバーで確認した結果を表示しています。</p>`;
  return !messages[status];
}
async function loadStatus({cancelled=false}={}) {
  clearTimeout(state.pollTimer);clearMessage();
  if(!state.token){state.stage='status';renderProgress();$('stage').innerHTML='<section class="stage-section"><h2 tabindex="-1">メールから予約状況をご確認ください</h2><p class="stage-lead">このブラウザーの確認期限が切れたか、予約を開始したブラウザーと異なります。決済を繰り返さず、ご担当者への案内メールをご確認ください。</p><button type="button" class="primary-button" data-action="recover-order">予約時のメールアドレスを確認する</button><p class="menu-note"><a href="https://kdkconslt-sngyouijm.com/contact/">KIDUKIへ問い合わせる</a></p></section>';$('stage').setAttribute('aria-busy','false');return;}
  try {const order=await request(`/orders/${encodeURIComponent(state.orderId)}`,{auth:true});const pending=renderStatus(order,{cancelled});if(order.status==='CONFIRMED'&&order.orderId===state.orderId)trackSpot('spot_booking_confirmed',state.orderId);if(pending && state.pollCount<12){state.pollCount++;state.pollTimer=setTimeout(()=>loadStatus({cancelled}),5000);}}
  catch(error){state.stage='status';renderProgress();$('stage').innerHTML='<section class="stage-section"><h2 tabindex="-1">予約状況を確認できませんでした</h2><p class="stage-lead">二重のお支払いを避けるため、新しい予約はせずに状況を確認してください。</p><button type="button" class="secondary-button" data-action="refresh-status">もう一度確認する</button><p><button type="button" class="text-button" data-action="recover-order">予約時のメールアドレスを確認する</button></p><p class="menu-note"><a href="https://kdkconslt-sngyouijm.com/contact/">KIDUKIへ問い合わせる</a></p></section>';showMessage(error.status===401 ? '確認の有効期限が切れました。案内メールをご確認ください。' : error.message);$('stage').setAttribute('aria-busy','false');}
}
function continueFlow(){if(state.stage==='menu' && state.service && bookingEnabled())moveTo('contact');else if(state.stage==='contact')$('contact-form').requestSubmit();else if(state.stage==='slots' && state.slot)moveTo('review');else if(state.stage==='review')$('checkout-form').requestSubmit();}
document.addEventListener('change',(event)=>{
  if(event.target.name==='service'){state.service=state.catalog.services.find(s=>s.id===event.target.value);state.feedbackMinutes=state.service.feedbackMinutes || 0;state.slot=null;state.clientRequestId=null;state.employee=null;renderFeedbackOptions();document.querySelectorAll('[data-action="continue"]').forEach(b=>b.disabled=!bookingEnabled());updateSummary();}
  if(event.target.name==='feedback'){state.feedbackMinutes=Number(event.target.value);state.slot=null;state.clientRequestId=null;updateSummary();}
});
document.addEventListener('click',async(event)=>{
  const slot=event.target.closest('[data-start]');if(slot && !state.busy){state.slot=state.slots.find(s=>s.start===slot.dataset.start);state.clientRequestId=null;renderSlots();updateSummary();return;}
  const action=event.target.closest('[data-action]')?.dataset.action;if(!action || state.busy)return;
  if(action==='continue')continueFlow();
  if(action==='menu' || action==='contact')moveTo(action);
  if(action==='back-slots')moveTo('slots');
  if(['refresh-slots','earlier-slots','later-slots'].includes(action)){if(action==='earlier-slots')state.rangeOffset=Math.max(0,state.rangeOffset-14);if(action==='later-slots')state.rangeOffset+=14;await withBusy(loadSlots);}
  if(action==='refresh-status'){state.pollCount=0;await loadStatus();}
  if(action==='recover-order'){state.recoverOrderId=state.orderId;clearSession();moveTo('contact');}
  if(action==='return-status'){state.recoverOrderId=null;await loadStatus();}
  if(action==='reload-catalog')await initialize();
  if(action==='new-booking'){analyticsFlow=crypto.randomUUID();state.orderId=null;state.service=null;state.slot=null;state.clientRequestId=null;state.pollCount=0;saveSession();await initialize();}
});
$('mobile-continue').addEventListener('click',continueFlow);
window.addEventListener('pagehide',()=>clearTimeout(state.pollTimer));
async function initialize(){
  readSession();const params=new URLSearchParams(window.location.search);const order=params.get('order');const checkoutReturn=params.get('checkout');
  // Read required return parameters once, then strip all query/fragment values
  // before any optional third-party tag can load, including malformed references.
  if(window.location.search||window.location.hash)history.replaceState(null,'',window.location.pathname);
  setupSpotAnalytics();
  if(order && /^[A-Za-z0-9_-]{1,200}$/.test(order)){
    state.orderId=order;saveSession();
    // Remove the opaque reference from the address bar before other navigation.
    history.replaceState(null,'',window.location.pathname);
    if (state.token && checkoutReturn === 'complete') {
      try { await request(`/orders/${encodeURIComponent(state.orderId)}/confirm`,{method:'POST',body:{},auth:true}); }
      catch { /* GET status still reports the server result; never repeat payment. */ }
    }
    await loadStatus({cancelled:checkoutReturn==='cancelled'});return;
  }
  if (!order && state.orderId) { await loadStatus(); return; }
  try{state.catalog=validateCatalog(await request('/catalog'));moveTo('menu',{focus:false});}
  catch(error){$('stage').setAttribute('aria-busy','false');$('stage').innerHTML='<section class="stage-section"><p class="eyebrow">MENU</p><h2 tabindex="-1">メニューを読み込めませんでした</h2><p class="stage-lead">現在の料金を確認できないため、お申し込みはまだ行われていません。</p><button type="button" class="primary-button" data-action="reload-catalog">もう一度読み込む</button><p class="menu-note"><a href="https://kdkconslt-sngyouijm.com/contact/">お問い合わせはこちら</a></p></section>';showMessage(error.message);}
}
initialize();
