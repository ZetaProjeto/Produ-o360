'use strict';

(() => {
  const STORAGE = 'producao360-registros-v1';
  const SETTINGS = 'producao360-config-v1';
  const DAYS = 180;
  const $ = (id) => document.getElementById(id);
  const validDate = (value) => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`)) && new Date(`${value}T00:00:00Z`).toISOString().slice(0, 10) === value;
  const formatDate = (iso) => {
    if (!validDate(iso)) return '—';
    const [year, month, day] = iso.split('-');
    return `${day}/${month}/${year}`;
  };
  const plusDays = (iso, days) => {
    if (!validDate(iso)) return '';
    const date = new Date(`${iso}T00:00:00Z`);
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };
  const getToday = () => {
    const now = new Date();
    return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
  };
  const cleanText = (value) => String(value || '').trim().replace(/\s+/g, ' ');
  const safeRead = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
    catch { return fallback; }
  };

  function normalizeItem(item, index) {
    if (!item || typeof item !== 'object' || !Number.isSafeInteger(Number(item.qty)) || Number(item.qty) < 1 || !validDate(item.date)) return null;
    const type = item.type;
    const id = typeof item.id === 'string' ? item.id : `legacy-${index}-${item.date}`;
    if (type === 'caixa') {
      const category = item.category === 'sorvete' ? 'sorvete' : 'acai';
      const flavor = category === 'sorvete' ? cleanText(item.flavor) : '';
      if (category === 'sorvete' && !flavor) return null;
      return { ...item, id, type, category, flavor, qty: Number(item.qty) };
    }
    if (type === 'picole') {
      const flavor = cleanText(item.flavor) || 'Não informado';
      return { ...item, id, type, category: 'picole', flavor, qty: Number(item.qty) };
    }
    if (type === 'pote_acai') return { ...item, id, type, category: 'acai', flavors: [], qty: Number(item.qty) };
    if (type === 'pote_sorvete') {
      const flavors = Array.isArray(item.flavors) ? item.flavors.map(cleanText).filter(Boolean) : (item.flavor ? [cleanText(item.flavor)] : []);
      const mode = item.flavorMode === 'triple' || flavors.length === 3 ? 'triple' : 'single';
      if ((mode === 'single' && flavors.length !== 1) || (mode === 'triple' && flavors.length !== 3)) return null;
      return { ...item, id, type, category: 'sorvete', flavorMode: mode, flavors, qty: Number(item.qty) };
    }
    return null;
  }

  let rawItems = safeRead(STORAGE, []);
  if (!Array.isArray(rawItems)) rawItems = [];
  let items = rawItems.map(normalizeItem).filter(Boolean);
  let settings = safeRead(SETTINGS, { business: '', phone: '' });
  if (!settings || typeof settings !== 'object') settings = { business: '', phone: '' };

  function notify(message) {
    const el = $('toast');
    if (!el) return;
    el.textContent = message;
    el.classList.add('show');
    clearTimeout(notify.timer);
    notify.timer = setTimeout(() => el.classList.remove('show'), 3200);
  }

  function saveItems() {
    try { localStorage.setItem(STORAGE, JSON.stringify(items)); return true; }
    catch { notify('Não foi possível salvar. Verifique o espaço disponível no navegador.'); return false; }
  }

  function selectedCategory() {
    return document.querySelector('input[name="category"]:checked')?.value || 'acai';
  }

  function setFieldGroup(groupId, fieldIds, visible, requiredIds = []) {
    const group = $(groupId);
    group.hidden = !visible;
    fieldIds.forEach((id) => {
      const field = $(id);
      field.disabled = !visible;
      field.required = visible && requiredIds.includes(id);
    });
  }

  function syncForm() {
    const type = $('product').value;
    const category = selectedCategory();
    const isBox = type === 'caixa';
    const isPopsicle = type === 'picole';
    const isIcePot = type === 'pote_sorvete';
    $('categoryGroup').hidden = !isBox;
    $('sorveteModeGroup').hidden = !isIcePot;

    const needsSingleFlavor = isPopsicle || (isBox && category === 'sorvete') || (isIcePot && $('sorveteMode').value === 'single');
    const needsTripleFlavor = isIcePot && $('sorveteMode').value === 'triple';
    setFieldGroup('singleFlavorGroup', ['flavor'], needsSingleFlavor, ['flavor']);
    setFieldGroup('tripleFlavorGroup', ['flavor1', 'flavor2', 'flavor3'], needsTripleFlavor, ['flavor1', 'flavor2', 'flavor3']);
    $('expiryText').textContent = formatDate(plusDays($('manufactured').value, DAYS));
  }

  function allFlavors() {
    const values = [];
    items.forEach((item) => {
      if (item.flavor) values.push(item.flavor);
      if (Array.isArray(item.flavors)) values.push(...item.flavors);
    });
    return [...new Set(values.map(cleanText).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }

  function updateFlavors() {
    const list = $('flavors');
    list.replaceChildren(...allFlavors().map((flavor) => {
      const option = document.createElement('option');
      option.value = flavor;
      return option;
    }));
  }

  function titleFor(item) {
    if (item.type === 'caixa') return item.category === 'acai' ? 'Caixa de 10 L · Açaí' : `Caixa de 10 L · Sorvete · ${item.flavor}`;
    if (item.type === 'pote_acai') return 'Pote de açaí · 2 L';
    if (item.type === 'pote_sorvete') return item.flavorMode === 'triple'
      ? `Pote de sorvete · 2 L · 3 sabores: ${item.flavors.join(', ')}`
      : `Pote de sorvete · 2 L · Sabor: ${item.flavors[0]}`;
    return `Picolé · ${item.flavor}`;
  }

  function quantityLabel(item) {
    if (item.type === 'caixa') return 'caixa(s)';
    if (item.type === 'picole') return 'unidade(s)';
    return 'pote(s)';
  }

  function totalFor(type) {
    return items.filter((item) => item.type === type).reduce((sum, item) => sum + item.qty, 0);
  }

  function render() {
    $('countBadge').textContent = `${items.length} ${items.length === 1 ? 'registro' : 'registros'}`;
    $('boxesTotal').textContent = totalFor('caixa').toLocaleString('pt-BR');
    $('acaiPotsTotal').textContent = totalFor('pote_acai').toLocaleString('pt-BR');
    $('icePotsTotal').textContent = totalFor('pote_sorvete').toLocaleString('pt-BR');
    $('popsTotal').textContent = totalFor('picole').toLocaleString('pt-BR');

    const list = $('itemsList');
    list.replaceChildren();
    if (!items.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Nenhum registro adicionado. Preencha o formulário para começar.';
      list.append(empty);
    }

    [...items].reverse().forEach((item) => {
      const card = document.createElement('article');
      card.className = 'item';
      const top = document.createElement('div');
      top.className = 'item-top';
      const left = document.createElement('div');
      const name = document.createElement('div');
      name.className = 'item-title';
      name.textContent = titleFor(item);
      const qty = document.createElement('span');
      qty.className = 'item-badge';
      qty.textContent = `${item.qty.toLocaleString('pt-BR')} ${quantityLabel(item)}`;
      left.append(name, qty);
      const del = document.createElement('button');
      del.className = 'remove';
      del.type = 'button';
      del.textContent = '✕';
      del.setAttribute('aria-label', `Remover ${titleFor(item)}`);
      del.addEventListener('click', () => {
        items = items.filter((entry) => entry.id !== item.id);
        if (saveItems()) { render(); notify('Registro removido.'); }
      });
      top.append(left, del);
      const dates = document.createElement('div');
      dates.className = 'item-dates';
      const manufactured = document.createElement('span');
      manufactured.textContent = `Fabricação: ${formatDate(item.date)}`;
      const expiry = document.createElement('span');
      expiry.textContent = `Validade: ${formatDate(plusDays(item.date, DAYS))}`;
      dates.append(manufactured, expiry);
      card.append(top, dates);
      list.append(card);
    });
    updateFlavors();
  }

  function report() {
    const business = cleanText(settings.business);
    const header = [
      'RELATÓRIO DE PRODUÇÃO',
      business ? `Estabelecimento: ${business}` : null,
      `Emitido em: ${formatDate(getToday())}`,
      `Prazo de validade cadastrado: ${DAYS} dias corridos após a fabricação}`,
      '----------------------------------------'
    ].filter(Boolean);
    const lines = items.map((item, index) => [
      `${index + 1}. ${titleFor(item)}`,
      `Quantidade: ${item.qty.toLocaleString('pt-BR')} ${quantityLabel(item)}`,
      `Fabricação: ${formatDate(item.date)}`,
      `Validade: ${formatDate(plusDays(item.date, DAYS))}`
    ].join('\n'));
    const totals = [
      `Caixas de 10 L: ${totalFor('caixa').toLocaleString('pt-BR')}`,
      `Potes de açaí 2 L: ${totalFor('pote_acai').toLocaleString('pt-BR')}`,
      `Potes de sorvete 2 L: ${totalFor('pote_sorvete').toLocaleString('pt-BR')}`,
      `Picolés: ${totalFor('picole').toLocaleString('pt-BR')}`
    ];
    return [...header, ...lines, '----------------------------------------', 'TOTAIS', ...totals].join('\n\n');
  }

  function checkItems() {
    if (items.length) return true;
    notify('Adicione pelo menos um produto antes de gerar o relatório.');
    return false;
  }

  function addEntry(event) {
    event.preventDefault();
    const type = $('product').value;
    const category = type === 'caixa' ? selectedCategory() : (type === 'pote_acai' ? 'acai' : type === 'picole' ? 'picole' : 'sorvete');
    const qty = Number($('quantity').value);
    const date = $('manufactured').value;
    if (!validDate(date) || !Number.isSafeInteger(qty) || qty < 1 || qty > 1000000) {
      notify('Confira a quantidade e a data de fabricação.');
      return;
    }

    let entry;
    if (type === 'pote_sorvete') {
      const mode = $('sorveteMode').value;
      const flavors = mode === 'triple'
        ? [$('flavor1').value, $('flavor2').value, $('flavor3').value].map(cleanText)
        : [cleanText($('flavor').value)];
      if (flavors.some((flavor) => !flavor) || (mode === 'triple' && new Set(flavors.map((f) => f.toLocaleLowerCase('pt-BR'))).size !== 3)) {
        notify(mode === 'triple' ? 'Informe três sabores diferentes.' : 'Informe o sabor do sorvete.');
        return;
      }
      entry = { id: makeId(), type, category, flavorMode: mode, flavors, qty, date };
    } else if (type === 'caixa' && category === 'sorvete') {
      const flavor = cleanText($('flavor').value);
      if (!flavor) { notify('Informe o sabor do sorvete.'); return; }
      entry = { id: makeId(), type, category, flavor, qty, date };
    } else if (type === 'picole') {
      const flavor = cleanText($('flavor').value);
      if (!flavor) { notify('Informe o sabor do picolé.'); return; }
      entry = { id: makeId(), type, category, flavor, qty, date };
    } else {
      entry = { id: makeId(), type, category, flavor: '', flavors: [], qty, date };
    }

    items.push(entry);
    if (!saveItems()) { items.pop(); return; }
    $('quantity').value = '1';
    ['flavor', 'flavor1', 'flavor2', 'flavor3'].forEach((id) => { $(id).value = ''; });
    render();
    syncForm();
    notify('Produção adicionada ao relatório.');
  }

  function makeId() {
    return globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function makePdf() {
    if (!window.jspdf?.jsPDF) {
      notify('O gerador de PDF não carregou. Verifique a conexão com a internet e tente novamente.');
      return null;
    }
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 16;
    const contentW = pageW - margin * 2;
    let y = 48;
    const name = cleanText(settings.business);
    const ensure = (space) => { if (y + space > 278) { doc.addPage(); y = 20; } };

    doc.setFillColor(22, 45, 82);
    doc.rect(0, 0, pageW, 38, 'F');
    doc.setFillColor(23, 105, 232);
    doc.roundedRect(margin, 9, 3, 20, 1.5, 1.5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(19);
    doc.text('PRODUCAO 360', margin + 8, 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(215, 230, 255);
    doc.text('RELATORIO DE FABRICACAO E VALIDADE', margin + 8, 26);

    if (name) {
      doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(22, 45, 82);
      const nameLines = doc.splitTextToSize(name, contentW);
      doc.text(nameLines, margin, y);
      y += nameLines.length * 5 + 5;
    }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(95, 112, 137);
    doc.text(`Emitido em ${formatDate(getToday())}  |  Prazo cadastrado: ${DAYS} dias corridos`, margin, y);
    y += 10;

    const summary = [
      ['CAIXAS 10 L', totalFor('caixa')],
      ['ACAI 2 L', totalFor('pote_acai')],
      ['SORVETE 2 L', totalFor('pote_sorvete')],
      ['PICOLES', totalFor('picole')]
    ];
    const gap = 3;
    const boxW = (contentW - gap * 3) / 4;
    summary.forEach(([label, value], index) => {
      const x = margin + index * (boxW + gap);
      doc.setFillColor(240, 246, 255); doc.roundedRect(x, y, boxW, 19, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7); doc.setTextColor(83, 105, 137); doc.text(label, x + 3, y + 6);
      doc.setFontSize(13); doc.setTextColor(22, 45, 82); doc.text(String(value), x + 3, y + 14);
    });
    y += 28;

    items.forEach((item, index) => {
      const headingLines = doc.splitTextToSize(`${index + 1}. ${titleFor(item)}`, contentW - 8);
      const blockH = headingLines.length * 5 + 17;
      ensure(blockH + 4);
      doc.setFillColor(247, 249, 253); doc.roundedRect(margin, y, contentW, blockH, 2, 2, 'F');
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(22, 45, 82);
      doc.text(headingLines, margin + 4, y + 6);
      const detailY = y + 6 + headingLines.length * 5;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5); doc.setTextColor(85, 101, 125);
      doc.text(`Quantidade: ${item.qty.toLocaleString('pt-BR')} ${quantityLabel(item)}   |   Fabricacao: ${formatDate(item.date)}   |   Validade: ${formatDate(plusDays(item.date, DAYS))}`, margin + 4, detailY + 3);
      y += blockH + 3;
    });

    ensure(24);
    doc.setDrawColor(207, 220, 239); doc.line(margin, y, pageW - margin, y); y += 8;
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10); doc.setTextColor(22, 45, 82);
    doc.text('RESUMO FINAL', margin, y); y += 6;
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(65, 82, 108);
    doc.text(`Caixas de 10 L: ${totalFor('caixa')}   |   Potes de acai 2 L: ${totalFor('pote_acai')}`, margin, y); y += 5;
    doc.text(`Potes de sorvete 2 L: ${totalFor('pote_sorvete')}   |   Picoles: ${totalFor('picole')}`, margin, y);

    const date = getToday().replaceAll('-', '');
    return { blob: doc.output('blob'), filename: `producao360-relatorio-${date}.pdf` };
  }

  function downloadPdf(pdf) {
    const url = URL.createObjectURL(pdf.blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = pdf.filename;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  }

  $('entryForm').addEventListener('submit', addEntry);
  $('product').addEventListener('change', syncForm);
  $('sorveteMode').addEventListener('change', syncForm);
  document.querySelectorAll('input[name="category"]').forEach((radio) => radio.addEventListener('change', syncForm));
  $('manufactured').addEventListener('change', syncForm);

  $('sendBtn').addEventListener('click', async () => {
    if (!checkItems()) return;
    const phone = String(settings.phone || '').replace(/\D/g, '');
    if (phone && (phone.length < 10 || phone.length > 15)) { notify('Confira o número de WhatsApp nas configurações.'); return; }
    const pdf = makePdf();
    if (!pdf) return;
    const file = new File([pdf.blob], pdf.filename, { type: 'application/pdf' });
    try {
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: 'Relatório de produção' });
        return;
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
    }
    downloadPdf(pdf);
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent('Olá! Segue o relatório de produção em PDF. Vou anexar o documento nesta conversa.')}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
    notify('PDF baixado. Anexe o arquivo na conversa do WhatsApp.');
  });

  $('copyBtn').addEventListener('click', async () => {
    if (!checkItems()) return;
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(report());
      else {
        const area = document.createElement('textarea'); area.value = report(); document.body.append(area); area.select();
        const copied = document.execCommand('copy'); area.remove();
        if (!copied) throw new Error('copy failed');
      }
      notify('Relatório copiado para a área de transferência.');
    } catch { notify('Não foi possível copiar automaticamente neste navegador.'); }
  });

  $('printBtn').addEventListener('click', () => {
    if (!checkItems()) return;
    const pdf = makePdf();
    if (pdf) { downloadPdf(pdf); notify('PDF gerado e baixado com sucesso.'); }
  });

  $('clearBtn').addEventListener('click', () => {
    if (!items.length) { notify('Não há registros para limpar.'); return; }
    if (window.confirm('Deseja remover todos os registros deste relatório?')) {
      const previous = items;
      items = [];
      if (saveItems()) { render(); notify('Relatório limpo.'); }
      else items = previous;
    }
  });

  $('settingsBtn').addEventListener('click', () => {
    $('businessName').value = settings.business || '';
    $('whatsapp').value = settings.phone || '';
    $('settingsDialog').showModal();
  });
  $('closeSettings').addEventListener('click', () => $('settingsDialog').close());
  $('settingsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    const phone = $('whatsapp').value.replace(/\D/g, '');
    if (phone && (phone.length < 10 || phone.length > 15)) { notify('Informe o número com DDI e DDD. Exemplo: 5531999999999.'); return; }
    const nextSettings = { business: cleanText($('businessName').value), phone };
    try {
      localStorage.setItem(SETTINGS, JSON.stringify(nextSettings));
      settings = nextSettings;
      $('settingsDialog').close();
      notify('Configurações salvas.');
    } catch { notify('Não foi possível salvar as configurações.'); }
  });

  $('manufactured').value = getToday();
  // Persiste a migração sem apagar os registros antigos válidos.
  if (rawItems.length !== items.length) saveItems();
  syncForm();
  render();
})();
