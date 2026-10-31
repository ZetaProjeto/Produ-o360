'use strict';
const STORAGE = 'producao360-registros-v1';
const SETTINGS = 'producao360-config-v1';
const DAYS = 180;
const $ = (id) => document.getElementById(id);
const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0,10) === value;
const formatDate = (iso) => { if(!validDate(iso)) return '—'; const [y,m,d] = iso.split('-'); return `${d}/${m}/${y}`; };
const plusDays = (iso, days) => { if(!validDate(iso)) return ''; const date = new Date(`${iso}T00:00:00Z`); date.setUTCDate(date.getUTCDate() + days); return date.toISOString().slice(0,10); };
const getToday = () => { const now = new Date(); return [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-'); };
function read(key, fallback) { try { const value = JSON.parse(localStorage.getItem(key)); return value ?? fallback; } catch { return fallback; } }
let items = read(STORAGE, []);
if (!Array.isArray(items)) items = [];
items = items.filter(v => v && ['caixa','picole'].includes(v.type) && ['acai','sorvete','picole'].includes(v.category) && Number.isSafeInteger(v.qty) && v.qty > 0 && validDate(v.date) && typeof v.id === 'string');
let settings = read(SETTINGS, { business: '' });
if (!settings || typeof settings !== 'object') settings = { business:'' };
settings = {business: String(settings.business || '')};
const save = () => { try { localStorage.setItem(STORAGE, JSON.stringify(items)); return true; } catch { notify('Não foi possível salvar no navegador.'); return false; } };
function notify(message) { const el=$('toast'); el.textContent=message; el.classList.add('show'); clearTimeout(notify.timer); notify.timer=setTimeout(()=>el.classList.remove('show'),3000); }
function syncForm() {
 const type=$('product').value;
 const cat=document.querySelector('input[name="category"]:checked').value;
 $('categoryGroup').hidden=type==='picole';
 $('flavorGroup').hidden=type==='caixa' && cat==='acai';
 $('flavor').required=!$('flavorGroup').hidden;
 $('expiryText').textContent=formatDate(plusDays($('manufactured').value,DAYS));
}
function updateFlavors(){
 const flavors=[...new Set(items.map(i=>i.flavor).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'pt-BR'));
 $('flavors').replaceChildren(...flavors.map(s=>{const opt=document.createElement('option');opt.value=s;return opt;}));
}
function titleFor(item){return item.category==='acai'?'Caixa 10 L · Açaí':item.category==='sorvete'?`Caixa 10 L · Sorvete · ${item.flavor}`:`Picolé · ${item.flavor}`;}
function render(){
 $('countBadge').textContent=`${items.length} ${items.length===1?'registro':'registros'}`;
 $('boxesTotal').textContent=items.filter(x=>x.type==='caixa').reduce((sum,x)=>sum+x.qty,0).toLocaleString('pt-BR');
 $('popsTotal').textContent=items.filter(x=>x.type==='picole').reduce((sum,x)=>sum+x.qty,0).toLocaleString('pt-BR');
 const list=$('itemsList'); list.replaceChildren();
 if(!items.length){const empty=document.createElement('div');empty.className='empty';empty.textContent='Nenhum registro adicionado. Preencha o formulário para começar.';list.append(empty);}
 items.forEach(item=>{
  const card=document.createElement('article');card.className='item';
  const top=document.createElement('div');top.className='item-top';
  const left=document.createElement('div');const name=document.createElement('div');name.className='item-title';name.textContent=titleFor(item);
  const qty=document.createElement('span');qty.className='item-badge';qty.textContent=`${item.qty.toLocaleString('pt-BR')} ${item.type==='caixa'?'caixa(s)':'unidade(s)'}`;left.append(name,qty);
  const del=document.createElement('button');del.className='remove';del.type='button';del.textContent='✕';del.setAttribute('aria-label',`Remover ${titleFor(item)}`);del.addEventListener('click',()=>{items=items.filter(v=>v.id!==item.id);save();render();});top.append(left,del);
  const dates=document.createElement('div');dates.className='item-dates';
  const manufactured=document.createElement('span');manufactured.textContent=`Fabricação: ${formatDate(item.date)}`;
  const expiry=document.createElement('span');expiry.textContent=`Validade: ${formatDate(plusDays(item.date,DAYS))}`;
  dates.append(manufactured,expiry);card.append(top,dates);list.append(card);
 });updateFlavors();
}
function report(){
 const business=String(settings.business||'').trim();
 const header=['📋 *RELATÓRIO DE PRODUÇÃO*',business?`🏭 *Estabelecimento:* ${business}`:null,`📅 *Emitido em:* ${formatDate(getToday())}`,'⏳ *Validade:* 180 dias corridos após a fabricação','────────────────────'].filter(Boolean);
 const lines=items.map((item,index)=>`*${index+1}. ${titleFor(item)}*\nQuantidade: ${item.qty.toLocaleString('pt-BR')} ${item.type==='caixa'?'caixa(s) de 10 L':'picolé(s)'}\nFabricação: ${formatDate(item.date)}\nValidade: ${formatDate(plusDays(item.date,DAYS))}`);
 const totalBoxes=items.filter(x=>x.type==='caixa').reduce((s,x)=>s+x.qty,0);
 const totalPops=items.filter(x=>x.type==='picole').reduce((s,x)=>s+x.qty,0);
 return [...header,...lines, '────────────────────',`*TOTAL:* ${totalBoxes.toLocaleString('pt-BR')} caixa(s) de 10 L | ${totalPops.toLocaleString('pt-BR')} picolé(s)`].join('\n\n');
}
function checkItems(){if(items.length) return true;notify('Adicione um produto antes de gerar o relatório.');return false;}
$('manufactured').value=getToday();
$('product').addEventListener('change',syncForm);
document.querySelectorAll('input[name="category"]').forEach(radio=>radio.addEventListener('change',syncForm));
$('manufactured').addEventListener('change',syncForm);
$('entryForm').addEventListener('submit',e=>{
 e.preventDefault(); const type=$('product').value;const category=type==='picole'?'picole':document.querySelector('input[name="category"]:checked').value;
 const flavor=(category==='acai'?'':$('flavor').value.trim().replace(/\s+/g,' '));const qty=Number($('quantity').value);const date=$('manufactured').value;
 if(!validDate(date)||!Number.isSafeInteger(qty)||qty<1||qty>1000000|| (category!=='acai' && !flavor)){notify('Confira quantidade, sabor e data de fabricação.');return;}
 const entry={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,type,category,flavor,qty,date};
 items.push(entry);if(!save()){items.pop();return;}
 $('quantity').value=1;$('flavor').value='';render();syncForm();notify('Produção adicionada ao relatório.');
});
// Gerador PDF local, sem dependências externas ou conexão com CDN.
function pdfHex(value) {
 const map = {0x20AC:128,0x201A:130,0x0192:131,0x201E:132,0x2026:133,0x2020:134,0x2021:135,0x02C6:136,0x2030:137,0x0160:138,0x2039:139,0x0152:140,0x017D:142,0x2018:145,0x2019:146,0x201C:147,0x201D:148,0x2022:149,0x2013:150,0x2014:151,0x02DC:152,0x2122:153,0x0161:154,0x203A:155,0x0153:156,0x017E:158,0x0178:159};
 return '<'+Array.from(String(value),ch=>{const cp=ch.codePointAt(0);const b=(cp<=255&&!(cp>=128&&cp<=159))?cp:(map[cp]??63);return b.toString(16).padStart(2,'0');}).join('')+'>';
}
function wrapPdf(text,max=82) {
 const lines=[];let line='';
 for(const word of String(text).split(/\s+/)) {
  if(!word)continue;
  if(word.length>max){if(line){lines.push(line);line='';}for(let i=0;i<word.length;i+=max)lines.push(word.slice(i,i+max));continue;}
  if((line+' '+word).trim().length>max){lines.push(line);line=word;}else line=(line+' '+word).trim();
 }
 if(line)lines.push(line);return lines.length?lines:[''];
}
function createPdfBlob() {
 const pages=[];let commands=[],y=0;const pageHeight=842;
 function line(text,size=11,bold=false,indent=44) {
  const limit= size>=15?53: size>=11?83:99;
  for(const piece of wrapPdf(text,limit)) {
   if(y>pageHeight-65)nextPage();
   commands.push(`BT /${bold?'F2':'F1'} ${size} Tf 0.10 0.17 0.28 rg 1 0 0 1 ${indent} ${pageHeight-y} Tm ${pdfHex(piece)} Tj ET`);
   y+=size+7;
  }
 }
 function nextPage() {if(commands.length)pages.push(commands.join('\n'));commands=[];y=46;}
 nextPage();
 line('RELATÓRIO DE PRODUÇÃO',19,true);y+=7;
 const business=String(settings.business||'').trim();
 if(business)line('Estabelecimento: '+business,11,true);
 line('Emissão: '+formatDate(getToday())+'  |  Validade: 180 dias corridos',10);
 y+=12;
 items.forEach((item,i)=>{
  if(y>pageHeight-135)nextPage();
  line((i+1)+'. '+titleFor(item),12,true); 
  line('Quantidade: '+item.qty.toLocaleString('pt-BR')+(item.type==='caixa'?' caixa(s) de 10 L':' picolé(s)'),10);
  line('Fabricação: '+formatDate(item.date)+'     Validade: '+formatDate(plusDays(item.date,DAYS)),10);
  y+=12;
 });
 if(y>pageHeight-105)nextPage();
 const boxes=items.filter(i=>i.type==='caixa').reduce((n,i)=>n+i.qty,0);
 const pops=items.filter(i=>i.type==='picole').reduce((n,i)=>n+i.qty,0);
 line('TOTAL: '+boxes.toLocaleString('pt-BR')+' caixa(s) de 10 L | '+pops.toLocaleString('pt-BR')+' picolé(s)',11,true);
 pages.push(commands.join('\n'));
 const objs=['', '<< /Type /Catalog /Pages 2 0 R >>', '', '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>','<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>'];
 const kids=[];
 for(const content of pages){
  const pageId=objs.length;const streamId=pageId+1;kids.push(`${pageId} 0 R`);
  objs.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamId} 0 R >>`);
  objs.push(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
 }
 objs[2]=`<< /Type /Pages /Kids [${kids.join(' ')}] /Count ${kids.length} >>`;
 let pdf='%PDF-1.4\n';const offsets=[0];
 for(let i=1;i<objs.length;i++){offsets[i]=pdf.length;pdf+=`${i} 0 obj\n${objs[i]}\nendobj\n`;}
 const xref=pdf.length;
 pdf+=`xref\n0 ${objs.length}\n0000000000 65535 f \n`;
 for(let i=1;i<objs.length;i++)pdf+=`${String(offsets[i]).padStart(10,'0')} 00000 n \n`;
 pdf+=`trailer\n<< /Size ${objs.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
 return new Blob([pdf],{type:'application/pdf'});
}
function downloadPdf(){
 const blob=createPdfBlob();const url=URL.createObjectURL(blob);
 const a=document.createElement('a');a.href=url;a.download=`relatorio-producao-${getToday().replaceAll('-','')}.pdf`;
 document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);
}
$('downloadBtn').addEventListener('click',()=>{
 if(!checkItems())return;
 try{downloadPdf();notify('PDF gerado para download.');}catch(error){console.error(error);notify('Falha ao gerar PDF. Atualize a página e tente novamente.');}
});
function escapeHtml(value){return String(value).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));}
$('printBtn').addEventListener('click',()=>{
 if(!checkItems())return;
 const win=window.open('','_blank');
 if(!win){notify('O navegador bloqueou a impressão. Permita janelas pop-up para este site.');return;}
 const boxes=items.filter(i=>i.type==='caixa').reduce((n,i)=>n+i.qty,0);
 const pops=items.filter(i=>i.type==='picole').reduce((n,i)=>n+i.qty,0);
 const rows=items.map((item,i)=>`<tr><td>${i+1}</td><td>${escapeHtml(titleFor(item))}</td><td>${item.qty.toLocaleString('pt-BR')}</td><td>${formatDate(item.date)}</td><td>${formatDate(plusDays(item.date,DAYS))}</td></tr>`).join('');
 const business=escapeHtml(String(settings.business||'').trim());
 win.document.open();win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Relatório de Produção - Impressão</title><style>body{font:13px Arial,sans-serif;color:#172c49;margin:35px}h1{font-size:23px;margin-bottom:10px}p{color:#556c86}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{padding:9px 7px;text-align:left;border-bottom:1px solid #cedcec;overflow-wrap:anywhere}th{background:#eef4ff}tfoot td{font-weight:bold}.actions{margin-bottom:22px}button{padding:12px 20px;background:#1769e8;color:white;border:0;border-radius:7px;cursor:pointer}@page{size:A4;margin:14mm}@media print{body{margin:0}.actions{display:none}thead{display:table-header-group}tr{break-inside:avoid}}</style></head><body><div class="actions"><button onclick="window.print()">Imprimir / Salvar em PDF</button></div><h1>RELATÓRIO DE PRODUÇÃO</h1>${business?`<p><b>Estabelecimento:</b> ${business}</p>`:''}<p>Emissão: ${formatDate(getToday())} | Validade: 180 dias corridos após a fabricação</p><table><thead><tr><th>#</th><th>Produto / Sabor</th><th>Quantidade</th><th>Fabricação</th><th>Validade</th></tr></thead><tbody>${rows}</tbody></table><p><b>TOTAL:</b> ${boxes.toLocaleString('pt-BR')} caixa(s) de 10 L | ${pops.toLocaleString('pt-BR')} picolé(s)</p></body></html>`);win.document.close();
 win.focus();notify('Visualização de impressão aberta. Clique em Imprimir / Salvar em PDF.');
});
$('copyBtn').addEventListener('click',async()=>{if(!checkItems())return;try{await navigator.clipboard.writeText(report());notify('Relatório copiado!');}catch{notify('Não foi possível copiar automaticamente.');}});
$('clearBtn').addEventListener('click',()=>{if(!items.length)return;if(confirm('Deseja remover todos os registros deste relatório?')){items=[];save();render();notify('Relatório limpo.');}});
$('settingsBtn').addEventListener('click',()=>{ $('businessName').value=settings.business||'';$('settingsDialog').showModal();});
$('saveSettings').addEventListener('click',()=>{settings={business:$('businessName').value.trim()};try{localStorage.setItem(SETTINGS,JSON.stringify(settings));notify('Configurações salvas.');}catch{notify('Não foi possível salvar as configurações.');}});
syncForm();render();
