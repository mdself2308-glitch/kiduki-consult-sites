#!/usr/bin/env node
// Read-only local checks. --live adds public GET requests; it never books or submits.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const checks=[];
const check=(name,ok,detail='')=>checks.push({name,ok:Boolean(ok),...(detail?{detail}:{})});
const home=read('consult/index.html'),spot=read('consult/spot/index.html');
const landing=read('consult/return-to-work-spot/index.html'),terms=read('consult/spot/terms/index.html');
const script=read('consult/assets/spot-booking.js'),robots=read('consult/robots.txt'),sitemap=read('consult/sitemap.xml');
const canonical=(html)=>html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)/i)?.[1];
const noindex=(html)=>/<meta\s+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(html);
const urls={home:'https://consult.kdkconslt-sngyouijm.com/',landing:'https://consult.kdkconslt-sngyouijm.com/return-to-work-spot/',spot:'https://consult.kdkconslt-sngyouijm.com/spot/',terms:'https://consult.kdkconslt-sngyouijm.com/spot/terms/'};
check('home-canonical',canonical(home)===urls.home);
check('search-landing-canonical',canonical(landing)===urls.landing);
check('search-landing-indexable',!noindex(landing));
check('search-landing-has-title-description-and-single-h1',/<title>[^<]+<\/title>/.test(landing)&&/<meta name="description" content="[^"]+"/.test(landing)&&(landing.match(/<h1[ >]/g)||[]).length===1);
check('search-landing-listed-in-sitemap',sitemap.includes(`<loc>${urls.landing}</loc>`));
check('search-landing-robots-allow',/Allow:\s*\//.test(robots)&&!/^Disallow:\s*\/(?:\s|$|return-to-work-spot)/m.test(robots));
check('booking-canonical',canonical(spot)===urls.spot);
check('booking-keeps-noindex-and-is-excluded-from-sitemap',noindex(spot)&&!sitemap.includes(`<loc>${urls.spot}</loc>`),'Booking application is separate from the indexable service landing page.');
check('booking-keeps-no-referrer',/<meta name="referrer" content="no-referrer"/.test(spot));
check('terms-canonical-and-noindex',canonical(terms)===urls.terms&&noindex(terms));
check('home-and-service-have-crawlable-booking-cta',home.includes('href="/spot/"')&&landing.includes('href="/spot/"'));
check('booking-links-current-privacy',spot.includes('https://kdkconslt-sngyouijm.com/privacy-policy/'));
check('booking-has-no-third-party-tag-in-head',!/<script[^>]+(?:googletagmanager|google-analytics|connect\.facebook)/i.test(spot));
check('prices-come-from-server-catalog',script.includes("request('/catalog')")&&!/\b(?:interview20|feedback30)\s*:\s*\d{4,}/.test(script));
check('completion-readback-not-url',script.includes("status==='CONFIRMED'")&&script.includes('const order=await request(`/orders/${encodeURIComponent(state.orderId)}`,{auth:true})'));
const syntax=spawnSync(process.execPath,['--check',path.join(root,'consult/assets/spot-booking.js')],{encoding:'utf8'});
check('booking-javascript-syntax',syntax.status===0);
check('optional-choice-has-equivalent-allow-and-deny-buttons',/data-analytics-choice="granted"/.test(spot)&&/data-analytics-choice="denied"/.test(spot)&&spot.includes('許可しなくても、すべての予約手続き'));
check('old-landing-no-longer-submits-retired-lead-form',!/<form\b/.test(landing)&&landing.includes('href="/spot/"'));
check('home-has-generic-spot-cta-count',home.includes("gtag('event', 'spot_cta_click'"));
const measurementId=spot.match(/data-spot-analytics-id="([^"]*)"/)?.[1]||'';
const analyticsReady=/^G-[A-Z0-9]{6,20}$/.test(measurementId)&&measurementId!=='G-JQFWB6XG2E'&&spot.includes('data-spot-analytics-reviewed="true"');
const prerequisites=analyticsReady?[]:['Dedicated SPOT GA4 stream ID and reviewed Enhanced Measurement OFF / user-provided data OFF / extra destinations OFF are not configured.'];
if(process.argv.includes('--release'))check('dedicated-analytics-stream-review-recorded',analyticsReady);

// Execute the actual browser code with storage, DOM, provider transport and API mocked.
// No Google, Stripe, Cal, email or production API request is made by these fixtures.
const storage=()=>{const values=new Map();return {getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};};
function browser({local=storage(),session=storage(),ready=true,orderStatus='CONFIRMED',orderId='10000000-0000-4000-8000-000000000001',returnedId=orderId}={}) {
  const nodes=new Map(),scripts=[],handlers=new Map(),api=[];
  const makeNode=()=>({dataset:{},hidden:false,textContent:'',innerHTML:'',setAttribute(){},addEventListener(){},querySelector(){return {focus(){}};},scrollIntoView(){},classList:{remove(){},add(){},toggle(){}}});
  const buttons=['granted','denied'].map(choice=>({...makeNode(),dataset:{analyticsChoice:choice},addEventListener(name,fn){handlers.set(choice,fn);}}));
  const window={localStorage:local,sessionStorage:session,location:{search:'?order=PRIVATE_ORDER&email=PRIVATE_EMAIL',hash:'#PRIVATE_FRAGMENT',pathname:'/spot/'},addEventListener(name,fn){handlers.set(`window:${name}`,fn);}};
  const document={body:{dataset:{apiBase:'https://api.example.invalid/api/spot',spotAnalyticsId:'G-SPOTFIXTURE',spotAnalyticsReviewed:String(ready)},classList:{remove(){},toggle(){}}},
    head:{appendChild(node){scripts.push(node);}},createElement:makeNode,
    getElementById(id){if(!nodes.has(id))nodes.set(id,makeNode());return nodes.get(id);},
    querySelector(){return null;},querySelectorAll(selector){return selector==='[data-analytics-choice]'?buttons:[];},addEventListener(){}};
  const context={window,document,history:{replaceState(){window.location.search='';window.location.hash='';}},sessionStorage:session,localStorage:local,
    URL,URLSearchParams,Intl,Date,AbortController,crypto:{randomUUID:()=> 'private-flow'},setTimeout:()=>0,clearTimeout(){},
    fetch:async(url,options)=>{api.push({url,options});return {ok:true,json:async()=>({ok:true,orderId:returnedId,status:orderStatus,amountYen:22000,serviceName:'PRIVATE_HEALTH_CATEGORY',contact:{email:'PRIVATE_EMAIL'},employee:{name:'PRIVATE_EMPLOYEE'},meetingUrl:'https://meeting.example.invalid/PRIVATE_TOKEN'})};}};
  vm.runInNewContext(script.replace(/initialize\(\);\s*$/,'' )+'\nglobalThis.fixture={telemetry:spotTelemetry,setup:setupSpotAnalytics,track:trackSpot,state,loadStatus,initialize,createTelemetry:createSpotTelemetry};',context);
  context.fixture.state.token='PRIVATE_AUTH_TOKEN';context.fixture.state.orderId=orderId;
  const events=()=>Array.from(window.dataLayer||[]).filter(args=>args[0]==='event');
  return {...context.fixture,window,local,session,scripts,api,events,click:choice=>handlers.get(choice)?.(),storageChanged:key=>handlers.get('window:storage')?.({key})};
}
try {
  const b=browser();b.setup();b.track('spot_menu_view');assert.equal(b.scripts.length,0);
  b.click('denied');b.track('spot_booking_start');assert.equal(b.scripts.length,0);
  check('runtime-unset-and-denied-load-no-google-tag',true);
  b.click('granted');b.track('spot_menu_view');b.track('spot_menu_view');
  assert.equal(b.scripts.length,1);assert.equal(b.events().length,1);
  const config=Array.from(b.window.dataLayer).find(args=>args[0]==='config')[2];
  assert.equal(config.send_page_view,false);assert.equal(config.allow_google_signals,false);assert.equal(config.allow_ad_personalization_signals,false);
  assert.equal(config.page_location,urls.spot);assert.equal(config.page_referrer,'');
  check('runtime-opt-in-config-disables-automatic-pageview-and-ad-features',true);
  b.track('unexpected_event','PRIVATE_EMAIL');assert.equal(b.events().length,1);
  await b.loadStatus();await b.loadStatus();assert.equal(b.events().filter(args=>args[1]==='spot_booking_confirmed').length,1);
  const serialized=JSON.stringify(b.window.dataLayer);assert.doesNotMatch(serialized,/PRIVATE_|10000000|22000|serviceId|orderId|employee|email/);
  for(const event of b.events())assert.deepEqual(Object.keys(event[2]).sort(),['page_location','page_referrer','page_title','send_to','source_page','transport_type']);
  check('runtime-event-allowlist-and-no-personal-health-price-or-order-data',true);
  const reloaded=browser({local:b.local,session:b.session});reloaded.setup();await reloaded.loadStatus();assert.equal(reloaded.events().length,0);
  check('runtime-confirmation-deduplicates-polls-and-same-tab-reload',true);
  b.click('denied');b.track('spot_slots_view');assert.equal(b.window['ga-disable-G-SPOTFIXTURE'],true);assert.equal(b.events().length,2);
  check('runtime-revocation-stops-subsequent-events',true);
  const shared=storage(),tabA=browser({local:shared}),tabB=browser({local:shared});tabA.setup();tabB.setup();
  tabA.click('granted');tabA.track('spot_menu_view');tabB.click('denied');
  // Sending re-reads storage even if the browser's storage event is delayed.
  tabA.track('spot_contact_verified');assert.equal(tabA.events().length,1);assert.equal(tabA.window['ga-disable-G-SPOTFIXTURE'],true);
  tabA.click('granted');tabB.click('denied');tabA.storageChanged('kiduki.spot.analytics.choice.v1');
  assert.equal(tabA.window['ga-disable-G-SPOTFIXTURE'],true);assert.equal(tabA.telemetry.choice(),'denied');
  tabA.click('granted');shared.removeItem('kiduki.spot.analytics.choice.v1');tabA.storageChanged(null);
  assert.equal(tabA.window['ga-disable-G-SPOTFIXTURE'],true);assert.equal(tabA.telemetry.choice(),'unset');
  check('runtime-cross-tab-withdrawal-and-cleared-choice-stop-existing-tag',true);
  let clock=Date.now(),sent=0,changed=[];
  const expiring=tabA.createTelemetry({choiceStore:storage(),sessionStore:storage(),now:()=>clock,send:()=>{sent++;return true;},onChoiceChange:value=>changed.push(value)});
  expiring.choose('granted');expiring.track('spot_menu_view');clock+=31*86400000;
  assert.equal(expiring.track('spot_contact_verified'),false);assert.equal(sent,1);assert.equal(expiring.choice(),'unset');assert.deepEqual(changed,['unset']);
  check('runtime-expired-consent-stops-long-lived-tab-before-send',true);
  const blockedStore={getItem:()=>JSON.stringify({choice:'granted',expiresAt:Date.now()+86400000}),setItem:()=>{throw new Error('quota');},removeItem:()=>{throw new Error('blocked');}};
  const blocked=browser({local:blockedStore});blocked.setup();blocked.track('spot_menu_view');assert.equal(blocked.events().length,1);
  blocked.click('denied');blocked.track('spot_contact_verified');assert.equal(blocked.events().length,1);assert.equal(blocked.telemetry.choice(),'denied');assert.equal(blocked.window['ga-disable-G-SPOTFIXTURE'],true);
  check('runtime-failed-refusal-persistence-cannot-restore-old-grant',true);
  let storedChoice=null,readFailure=false;
  const unreadable=browser({local:{getItem:()=>{if(readFailure)throw new Error('blocked');return storedChoice;},setItem:(_,value)=>{storedChoice=value;}}});
  unreadable.setup();unreadable.click('granted');unreadable.track('spot_menu_view');readFailure=true;unreadable.track('spot_contact_verified');
  assert.equal(unreadable.events().length,1);assert.equal(unreadable.window['ga-disable-G-SPOTFIXTURE'],true);assert.equal(unreadable.telemetry.choice(),'unset');
  check('runtime-unreadable-consent-storage-fails-closed',true);



  for(const status of ['AWAITING_PAYMENT','CAPTURING','FULFILLING','REVIEW_REQUIRED','CANCELLED','EXPIRED']) {
    const c=browser({orderStatus:status});c.setup();c.click('granted');await c.loadStatus();assert.equal(c.events().length,0);
  }
  const mismatch=browser({returnedId:'another-order'});mismatch.setup();mismatch.click('granted');await mismatch.loadStatus();assert.equal(mismatch.events().length,0);
  check('runtime-only-matching-server-confirmed-order-counts-as-complete',true);
  const notReady=browser({ready:false});notReady.setup();notReady.click('granted');notReady.track('spot_menu_view');assert.equal(notReady.scripts.length,0);
  check('runtime-unreviewed-stream-fails-closed-with-booking-still-readable',true);
} catch(error) {check('runtime-fixture',false,error.message);}

if(process.argv.includes('--live')) {
  for(const [name,url] of Object.entries(urls)) {
    try {
      const response=await fetch(url,{redirect:'follow',signal:AbortSignal.timeout(15000),headers:{'User-Agent':'KIDUKI-SPOT-readonly-launch-check/1.0'}});
      const html=await response.text();
      check(`live-${name}-200-and-canonical`,response.ok&&canonical(html)===url,`HTTP ${response.status}`);
      check(`live-${name}-robots-intent`,name==='spot'||name==='terms'?noindex(html):!noindex(html));
    } catch { check(`live-${name}-readback`,false,'unavailable; no performance inference'); }
  }
}
const failures=checks.filter(c=>!c.ok);
console.log(JSON.stringify({checkedAt:new Date().toISOString(),ok:failures.length===0,releaseReady:failures.length===0&&prerequisites.length===0,prerequisites,mode:process.argv.includes('--live')?'local-and-public-readback':'local-only',writes:false,checks,failures,boundary:'Local/readback checks do not prove indexing, GA4 receipt, payment, booking, email, or service acceptance.'},null,2));
if(failures.length)process.exitCode=1;
