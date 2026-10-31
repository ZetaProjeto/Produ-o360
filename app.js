'use strict';
const STORAGE='producao360-registros-v1', SETTINGS='producao360-config-v1', DAYS=180, $=id=>document.getElementById(id);
const validDate=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(`${v}T00:00:00Z`))&&new Date(`${v}T00:00:00Z`).toISOString().slice(0,10)===v;
const formatDate=iso=>{if(!validDate(iso))return '—';const [y,m,d]=iso.split('-');return `${d}/${m}/${y}`};
const plusDays=(iso,n)=>{if(!validDate(iso))return '';const d=new Date(`${iso}T00:00:00Z`);d.setUTCDate(d.getUTCDate()+n);return d.toISOString().slice(0,10)};
const today=()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')};
function read(k,f){try{return JSON.parse(localStorage.getItem(k))??f}catch{return f}}
let items=read(STORAGE,[]);if(!Array.isArray(items))items=[];
items=items.filter(v=>v&&['caixa','picole','pote_acai','pote_sorvete'].includes(v.type)&&['acai','sorvete','picole'].includes(v.category)&&Number.isSafeInteger(v.qty)&&v.qty>0&&validDate(v.date)&&typeof v.id==='string');
let settings=read(SETTINGS,{business:'',phone:''});if(!settings||typeof settings!=='object')settings={business:'',phone:''};
const save=()=>{try{localStorage.setItem(STORAGE,JSON.stringify(items));return true}catch{notify('Não foi possível salvar os dados neste navegador.');return false}};
function notify(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(notify.timer);notify.timer=setTimeout(()=>el.classList.remove('show'),3000)}
function productMeta(item){
 if(item.type==='picole')return {name:`Picolé · ${item.flavor||'Sabor não informado'}`,unit:'unidade(s)'};
 if(item.type==='pote_acai')return {name:'Pote de açaí · 2 L',unit:'pote(s)'};
 if(item.type==='pote_sorvete')return {name:`Pote de sorvete · ${(item.flavors||[item.flavor]).filter(Boolean).join(' + ')}`,unit:'pote(s)'};
 const cat=item.category==='acai'?'Açaí':'Sorvete';
 return {name:`Caixa de ${cat.toLowerCase()} · 10 L${item.category==='sorvete'?' · '+(item.flavor||'Sabor não informado'):''}`,unit:'caixa(s)'};
}
function syncForm(){
 const type=$('product').value,cat=document.querySelector('input[name="category"]:checked').value;
 $('categoryGroup').hidden=type!=='caixa';
 const show=type==='picole'||type==='pote_sorvete'||(type==='caixa'&&cat==='sorvete');
 $('flavorGroup').hidden=!show;
 const count=type==='pote_sorvete'?3:1;
 $('flavorLabel').textContent=count===3?'Sabores do pote (3 sabores)':'Sabor';
 $('flavorHint').textContent=count===3?'Informe os três sabores que compõem este pote.':'Digite um sabor ou selecione uma opção já utilizada.';
 const fields=$('flavorFields');fields.replaceChildren();
 for(let i=0;i<count;i++){const input=document.createElement('input');input.id=`flavor${i+1}`;input.name='flavor';input.setAttribute('list','flavors');input.maxLength=60;input.autocomplete='off';input.placeholder=count===3?`Sabor ${i+1} · ${['Chocolate','Morango','Baunilha'][i]}`:'Ex.: Chocolate, Morango, Coco';input.required=true;if(i)input.style.marginTop='9px';fields.append(input)}
 $('expiryText').textContent=formatDate(plusDays($('manufactured').value,DAYS));
}
function updateFlavors(){const all=items.flatMap(i=>[...(i.flavors||[]),i.flavor||'']).filter(Boolean);const flavors=[...new Set(all)].sort((a,b)=>a.localeCompare(b,'pt-BR'));$('flavors').replaceChildren(...flavors.map(s=>{const o=document.createElement('option');o.value=s;return o}))}
function titleFor(item){return productMeta(item).name}
function render(){
 $('countBadge').textContent=`${items.length} ${items.length===1?'registro':'registros'}`;
 $('boxesTotal').textContent=items.filter(x=>x.type!=='picole').reduce((s,x)=>s+x.qty,0).toLocaleString('pt-BR');
 $('popsTotal').textContent=items.filter(x=>x.type==='picole').reduce((s,x)=>s+x.qty,0).toLocaleString('pt-BR');
 const list=$('itemsList');list.replaceChildren();
 if(!items.length){const e=document.createElement('div');e.className='empty';e.textContent='Nenhum registro adicionado. Preencha o formulário para começar.';list.append(e)}
 items.forEach(item=>{const card=document.createElement('article');card.className='item';const top=document.createElement('div');top.className='item-top';const left=document.createElement('div');const name=document.createElement('div');name.className='item-title';name.textContent=titleFor(item);const qty=document.createElement('span');qty.className='item-badge';qty.textContent=`${item.qty.toLocaleString('pt-BR')} ${productMeta(item).unit}`;left.append(name,qty);const del=document.createElement('button');del.className='remove';del.type='button';del.textContent='✕';del.setAttribute('aria-label',`Remover ${titleFor(item)}`);del.addEventListener('click',()=>{items=items.filter(v=>v.id!==item.id);save();render()});top.append(left,del);const dates=document.createElement('div');dates.className='item-dates';const a=document.createElement('span');a.textContent=`Fabricação: ${formatDate(item.date)}`;const b=document.createElement('span');b.textContent=`Validade: ${formatDate(plusDays(item.date,DAYS))}`;dates.append(a,b);card.append(top,dates);list.append(card)});
 updateFlavors();
}
function report(){
 const header=['RELATÓRIO DE PRODUÇÃO',settings.business?`Estabelecimento: ${settings.business}`:null,`Emitido em: ${formatDate(today())}`,'Prazo de validade cadastrado: 180 dias corridos','────────────────────────────────────────'].filter(Boolean);
 const lines=items.map((it,i)=>`${i+1}. ${titleFor(it)}\nQuantidade: ${it.qty.toLocaleString('pt-BR')} ${productMeta(it).unit}\nFabricação: ${formatDate(it.date)}\nValidade: ${formatDate(plusDays(it.date,DAYS))}`);
 const total=items.filter(x=>x.type!=='picole').reduce((s,x)=>s+x.qty,0),pops=items.filter(x=>x.type==='picole').reduce((s,x)=>s+x.qty,0);
 return [...header,...lines,'────────────────────────────────────────',`TOTAL: ${total.toLocaleString('pt-BR')} caixas/potes · ${pops.toLocaleString('pt-BR')} picolés`].join('\n\n');
}
function checkItems(){if(items.length)return true;notify('Adicione pelo menos um produto antes de gerar o relatório.');return false}
function makePdf(){
 if(!window.jspdf?.jsPDF){notify('Não foi possível carregar o gerador de PDF. Verifique sua conexão com a internet.');return null}
 const doc=new window.jspdf.jsPDF({unit:'mm',format:'a4'}),W=doc.internal.pageSize.getWidth(),H=doc.internal.pageSize.getHeight(),M=17;
 let y=52;
 const business=String(settings.business||'').trim();
 function header(){
  doc.setFillColor(19,43,77);doc.rect(0,0,W,43,'F');
  doc.setFillColor(36,119,232);doc.roundedRect(M,10,12,12,3,3,'F');
  doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(19);doc.text('PRODUCAO 360',M+17,19);
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(205,222,246);doc.text('RELATÓRIO DE FABRICAÇÃO E VALIDADE',M+17,26);
  doc.setFontSize(9);doc.text(`EMISSAO  ${formatDate(today())}`,W-M,19,{align:'right'});
  doc.setTextColor(35,54,80);
 }
 function page(){doc.addPage();header();y=53}
 header();
 if(business){doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text('ESTABELECIMENTO',M,y);y+=5;doc.setFont('helvetica','normal');doc.setFontSize(11);const b=doc.splitTextToSize(business,W-M*2);doc.text(b,M,y);y+=b.length*5+7}
 doc.setFillColor(239,245,253);doc.roundedRect(M,y,W-M*2,17,3,3,'F');
 doc.setFont('helvetica','bold');doc.setFontSize(9);doc.setTextColor(65,89,120);doc.text('PRAZO DE VALIDADE',M+5,y+6);
 doc.setFontSize(13);doc.setTextColor(22,91,176);doc.text('180 dias corridos após a fabricação',M+5,y+12);
 y+=25;
 items.forEach((it,i)=>{
  const meta=productMeta(it),fl=it.type==='pote_sorvete'?(it.flavors||[]).join(' / '):'';
  const title=doc.splitTextToSize(`${String(i+1).padStart(2,'0')}  ${meta.name}`,W-M*2-8);
  const detail=it.type==='pote_sorvete'?doc.splitTextToSize(`Composição: ${fl}`,W-M*2-10):[];
  const height=12+title.length*5+detail.length*4+10;
  if(y+height>H-22)page();
  doc.setFillColor(247,249,253);doc.roundedRect(M,y,W-M*2,height,2.5,2.5,'F');
  doc.setFillColor(36,119,232);doc.roundedRect(M,y,2.2,height,1,1,'F');
  doc.setFont('helvetica','bold');doc.setFontSize(10.5);doc.setTextColor(25,48,78);doc.text(title,M+7,y+7);
  let yy=y+7+title.length*5;
  if(detail.length){doc.setFont('helvetica','normal');doc.setFontSize(8.5);doc.setTextColor(84,102,127);doc.text(detail,M+7,yy);yy+=detail.length*4}
  doc.setFont('helvetica','normal');doc.setFontSize(9);doc.setTextColor(58,75,98);
  doc.text(`Quantidade: ${it.qty.toLocaleString('pt-BR')} ${meta.unit}`,M+7,yy+2);
  doc.text(`Fabricação: ${formatDate(it.date)}     Validade: ${formatDate(plusDays(it.date,DAYS))}`,M+7,yy+7);
  y+=height+5;
 });
 if(y+28>H-17)page();
 const boxes=items.filter(x=>x.type!=='picole').reduce((s,x)=>s+x.qty,0),pops=items.filter(x=>x.type==='picole').reduce((s,x)=>s+x.qty,0);
 doc.setDrawColor(205,219,238);doc.line(M,y,W-M,y);y+=8;doc.setFillColor(19,43,77);doc.roundedRect(M,y,W-M*2,19,3,3,'F');
 doc.setFont('helvetica','bold');doc.setFontSize(10);doc.setTextColor(255,255,255);doc.text('RESUMO DA PRODUCAO',M+6,y+7);
 doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(`${boxes.toLocaleString('pt-BR')} caixas/potes     |     ${pops.toLocaleString('pt-BR')} picolés`,M+6,y+13);
 const pages=doc.getNumberOfPages();for(let p=1;p<=pages;p++){doc.setPage(p);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.setTextColor(125,140,160);doc.text('PRODUCAO360  ·  Documento de controle interno',M,H-8);doc.text(`${p}/${pages}`,W-M,H-8,{align:'right'})}
 return {blob:doc.output('blob'),filename:`relatorio-producao-${today().replaceAll('-','')}.pdf`};
}
function downloadPdf(pdf){const url=URL.createObjectURL(pdf.blob),a=document.createElement('a');a.href=url;a.download=pdf.filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),60000)}
$('manufactured').value=today();$('product').addEventListener('change',syncForm);document.querySelectorAll('input[name="category"]').forEach(r=>r.addEventListener('change',syncForm));$('manufactured').addEventListener('change',syncForm);
$('entryForm').addEventListener('submit',e=>{
 e.preventDefault();const type=$('product').value,category=type==='picole'?'picole':type==='pote_acai'?'acai':type==='pote_sorvete'?'sorvete':document.querySelector('input[name="category"]:checked').value;
 const flavors=[...$('flavorFields').querySelectorAll('input')].map(x=>x.value.trim().replace(/\s+/g,' ')).filter(Boolean),qty=Number($('quantity').value),date=$('manufactured').value;
 const needs=type==='picole'||type==='pote_sorvete'||(type==='caixa'&&category==='sorvete'),requiredCount=type==='pote_sorvete'?3:needs?1:0;
 if(!validDate(date)||!Number.isSafeInteger(qty)||qty<1||qty>1000000||(needs&&(flavors.length!==requiredCount||new Set(flavors.map(x=>x.toLocaleLowerCase('pt-BR'))).size!==flavors.length))){notify(type==='pote_sorvete'?'Informe três sabores diferentes para o pote.':'Confira a quantidade, o sabor e a data de fabricação.');return}
 const entry={id:globalThis.crypto?.randomUUID?.()||`${Date.now()}-${Math.random()}`,type,category,flavor:flavors[0]||'',flavors,qty,date};items.push(entry);if(!save()){items.pop();return}
 $('quantity').value=1;render();syncForm();notify('Produção adicionada ao relatório.');
});
$('sendBtn').addEventListener('click',async()=>{if(!checkItems())return;const phone=String(settings.phone||'').replace(/\D/g,'');if(phone&&(phone.length<10||phone.length>15)){notify('Confira o número de WhatsApp nas configurações.');return}const pdf=makePdf();if(!pdf)return;const file=new File([pdf.blob],pdf.filename,{type:'application/pdf'});try{if(navigator.share&&navigator.canShare?.({files:[file]})){await navigator.share({files:[file],title:'Relatório de produção'});return}}catch(err){if(err?.name==='AbortError')return}downloadPdf(pdf);notify('PDF baixado. Anexe o arquivo à conversa do WhatsApp.');const url=`https://wa.me/${phone}?text=${encodeURIComponent('Olá! Segue o relatório de produção em PDF.')}`;const opened=window.open(url,'_blank','noopener,noreferrer');if(!opened)notify('PDF baixado. Abra o WhatsApp e anexe o arquivo manualmente.')});
$('copyBtn').addEventListener('click',async()=>{if(!checkItems())return;try{await navigator.clipboard.writeText(report());notify('Relatório copiado!')}catch{notify('Não foi possível copiar automaticamente.')}});
$('printBtn').addEventListener('click',()=>{if(!checkItems())return;const pdf=makePdf();if(pdf){downloadPdf(pdf);notify('PDF gerado com sucesso.')}});
$('clearBtn').addEventListener('click',()=>{if(!items.length)return;if(confirm('Deseja remover todos os registros deste relatório?')){items=[];save();render();notify('Relatório limpo.')}});
$('settingsBtn').addEventListener('click',()=>{$('businessName').value=settings.business||'';$('whatsapp').value=settings.phone||'';$('settingsDialog').showModal()});
$('saveSettings').addEventListener('click',e=>{const phone=$('whatsapp').value.replace(/\D/g,'');if(phone&&(phone.length<10||phone.length>15)){e.preventDefault();notify('Informe o número com DDI e DDD, por exemplo: 5531999999999.');return}settings={business:$('businessName').value.trim(),phone};try{localStorage.setItem(SETTINGS,JSON.stringify(settings));notify('Configurações salvas.')}catch{notify('Não foi possível salvar as configurações.')}});
syncForm();render();
