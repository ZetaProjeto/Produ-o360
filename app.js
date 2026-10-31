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
let settings = read(SETTINGS, { business: '', phone: '' });
if (!settings || typeof settings !== 'object') settings = { business:'', phone:'' };
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
$('sendBtn').addEventListener('click',()=>{
 if(!checkItems())return;
 const phone=String(settings.phone||'').replace(/\D/g,'');
 if(phone && (phone.length<10||phone.length>15)){notify('Confira o WhatsApp nas configurações.');return;}
 const url=`https://wa.me/${phone}?text=${encodeURIComponent(report())}`;
 if(url.length>7500){notify('Relatório muito longo para link do WhatsApp. Use Copiar relatório.');return;}
 const opened=window.open(url,'_blank','noopener,noreferrer'); if(!opened) window.location.href=url;
});
$('copyBtn').addEventListener('click',async()=>{if(!checkItems())return;try{await navigator.clipboard.writeText(report());notify('Relatório copiado!');}catch{notify('Não foi possível copiar automaticamente.');}});
$('printBtn').addEventListener('click',()=>{if(checkItems())window.print();});
$('clearBtn').addEventListener('click',()=>{if(!items.length)return;if(confirm('Deseja remover todos os registros deste relatório?')){items=[];save();render();notify('Relatório limpo.');}});
$('settingsBtn').addEventListener('click',()=>{ $('businessName').value=settings.business||'';$('whatsapp').value=settings.phone||'';$('settingsDialog').showModal();});
$('saveSettings').addEventListener('click',e=>{const phone=$('whatsapp').value.replace(/\D/g,'');if(phone&&(phone.length<10||phone.length>15)){e.preventDefault();notify('Informe o número com DDI e DDD, ex.: 5531999999999.');return;}settings={business:$('businessName').value.trim(),phone};try{localStorage.setItem(SETTINGS,JSON.stringify(settings));notify('Configurações salvas.');}catch{notify('Não foi possível salvar as configurações.');}});
syncForm();render();
