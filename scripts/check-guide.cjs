// Run with Node.js 18+: node scripts/check-guide.cjs
// No dependencies; browser rendering still requires a separate visual check.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const canonical='https://ggarofalo-dev.github.io/truffe-digitali/';
const html=read('truffe-digitali/index.html');
const js=read('truffe-digitali/guide.js');
const expected=['guide_page_view','guide_download','amazon_book_click','share_whatsapp','share_facebook','share_linkedin','share_telegram','share_email','share_x','copy_link'];
class Element {
  constructor(dataset={}){this.dataset=dataset;this.handlers={};this.hidden=true;this.href='';this.value=canonical;}
  addEventListener(name,fn){this.handlers[name]=fn;}
  async click(){await this.handlers.click?.();}
  focus(){this.focused=true;} select(){this.selected=true;}
}
async function checkJS({delayed=false,clipboardFails=false,native=true}={}){
  const events=[],nodes={},links=[];let script,copied,shared;
  for(const name of ['copy-link','copy-manual','copy-fallback','share-status','native-share'])nodes[name]=new Element();
  for(const name of expected.slice(1,-1))links.push(new Element({event:name,...(name.startsWith('share_')?{share:name.slice(6)}:{})}));
  const navigator={clipboard:{writeText:async value=>{if(clipboardFails)throw Error('denied');copied=value;}}};
  if(native)navigator.share=async data=>{shared=data;};
  const document={title:'Truffe Digitali',referrer:'https://example.org/private?secret=omit',getElementById:id=>nodes[id],createElement:()=>new Element(),head:{append:s=>{script=s;}},querySelectorAll:selector=>links.filter(l=>selector==='[data-event]'||l.dataset.share)};
  const window={};
  vm.runInNewContext(js,{window,document,navigator,location:{search:'?utm_source=whatsapp&utm_medium=social&utm_campaign=guida&token=omit'},URLSearchParams,URL});
  if(delayed)await links[0].click();
  window.goatcounter.count=data=>events.push(data);
  script.handlers.load();
  for(const link of links)await link.click();
  await nodes['copy-link'].click();
  if(clipboardFails){assert.equal(nodes['copy-manual'].hidden,false);assert(nodes['copy-fallback'].focused&&nodes['copy-fallback'].selected);assert(!events.some(e=>e.path==='copy_link'));assert.equal(nodes['copy-link'].dataset.copied,undefined);}
  else{assert.equal(copied,canonical);assert.equal(nodes['copy-link'].dataset.copied,'true');for(const event of expected)assert(events.some(e=>e.path===event),event);}
  assert.equal(events.filter(e=>e.path==='/truffe-digitali/').length,1);
  assert.equal(events.filter(e=>e.path==='guide_page_view').length,1);
  for(const event of events){assert.equal(event.referrer,'campaign:utm_source=whatsapp&utm_medium=social&utm_campaign=guida');assert(!JSON.stringify(event).includes('token'));}
  for(const link of links.filter(l=>l.dataset.share)){assert(decodeURIComponent(link.href).includes(canonical));assert(!link.href.includes('utm_'));}
  assert.equal(nodes['native-share'].hidden,!native);
  if(native){await nodes['native-share'].click();assert.equal(shared.url,canonical);assert(events.some(e=>e.path==='share_native'));}
}
function checkQR(){
  // Independently read the SVG modules and decode the QR v4-M payload.
  const svg=read('truffe-digitali/assets/qr-guida.svg');
  assert(svg.includes('viewBox="0 0 41 41"'));
  const n=33,m=Array.from({length:n},()=>Array(n).fill(0));
  for(const match of svg.matchAll(/M(\d+) (\d+)h1v1h-1z/g)){const x=+match[1]-4,y=+match[2]-4;m[y][x]=1;}
  const reserved=(r,c)=>(r<=8&&c<=8)||(r<=8&&c>=25)||(r>=25&&c<=8)||r===6||c===6||(r>=24&&r<=28&&c>=24&&c<=28);
  const masks=[(r,c)=>(r+c)%2===0,r=>r%2===0,(r,c)=>c%3===0,(r,c)=>(r+c)%3===0,(r,c)=>(Math.floor(r/2)+Math.floor(c/3))%2===0,(r,c)=>(r*c)%2+(r*c)%3===0,(r,c)=>((r*c)%2+(r*c)%3)%2===0,(r,c)=>((r*c)%3+(r+c)%2)%2===0];
  let decoded=false;
  for(const mask of masks){
    let bits=[],up=true;
    for(let c=n-1;c>0;c-=2){if(c===6)c--;for(let i=0;i<n;i++){let r=up?n-1-i:i;for(let j=0;j<2;j++)if(!reserved(r,c-j))bits.push(m[r][c-j]^Number(mask(r,c-j)));}up=!up;}
    const bytes=[];for(let i=0;i<800;i+=8)bytes.push(parseInt(bits.slice(i,i+8).join(''),2));
    // Two equal data blocks of 32 bytes, interleaved before the parity bytes.
    const data=[...bytes.slice(0,64).filter((_,i)=>i%2===0),...bytes.slice(0,64).filter((_,i)=>i%2===1)];
    const b=data.map(v=>v.toString(2).padStart(8,'0')).join('');
    if(b.slice(0,4)!=='0100')continue;
    const length=parseInt(b.slice(4,12),2);let text='';for(let i=0;i<length;i++)text+=String.fromCharCode(parseInt(b.slice(12+i*8,20+i*8),2));
    if(text===canonical)decoded=true;
  }
  assert(decoded,'QR payload differs from permanent landing URL');
}
(async()=>{
  const schema=JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);assert.equal(schema.url,canonical);
  assert(html.includes('<link rel="canonical" href="'+canonical+'">'));
  for(const match of html.matchAll(/(?:href|src)="([^"#]+)"/g)){
    const url=match[1];if(/^(https?:|mailto:)/.test(url))continue;
    const file=path.resolve(root,'truffe-digitali',url);assert(fs.existsSync(file),`Missing: ${url}`);
  }
  assert.equal((html.match(/download data-event="guide_download"/g)||[]).length,1);
  assert.equal((html.match(/<section\b/g)||[]).length,2);
  assert(!html.includes('organizations'));
  const controls=html.match(/<(?:a|button) class="share-control[^]*?<\/(?:a|button)>/g)||[];
  assert.equal(controls.length,8);
  for(const control of controls){
    assert(control.includes('aria-label='));assert(control.includes('title='));assert(control.includes('<svg'));
  }
  assert.equal(fs.readFileSync(path.join(root,'Truffe_Digitali_Flyer.pdf')).subarray(0,5).toString(),'%PDF-');
  assert(!html.includes('data-topic='));
  assert(read('index.html').includes('href="./truffe-digitali/"'));
  assert(read('sitemap.xml').includes(canonical));
  assert(read('truffe-digitali/style.css').includes('prefers-reduced-motion'));
  await checkJS();await checkJS({delayed:true});await checkJS({clipboardFails:true,native:false});checkQR();
  console.log('PASS: local assets/links, PDF signature, SEO/Schema/sitemap, all analytics events, UTM attribution, delayed tracker, share URLs, clipboard success/failure, native share and independent QR decoding.');
})().catch(error=>{console.error(error);process.exitCode=1;});
