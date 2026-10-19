/* =========================================================
   orcamento.js — cálculo por metragem + geração da imagem (canvas)
   ========================================================= */

const FONT = "'Segoe UI', Arial, sans-serif";
const W = 1000, P = 48;

const C = {
  roxo900:'#3A2413', roxo800:'#4A2E17', roxo700:'#6B3A1E', roxo600:'#8A4A26',
  roxo500:'#B06B3A', roxo300:'#C89A6B',   roxo100:'#E7CFF9', roxo50:'#F3E9FC',
  cinza900:'#1B1029', cinza700:'#40324F', cinza600:'#58496C', cinza500:'#78658C',
  cinza400:'#A08DC0', cinza300:'#D0C2E6', cinza200:'#E3D8F2', cinza100:'#F0EAF7',
  cinza50:'#F7F3FC', branco:'#FBF7FF'
};

/* ---------- utilitários ---------- */
const brl = n => (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { style:'currency', currency:'BRL' });
const m2  = n => (Number.isFinite(n) ? n : 0).toLocaleString('pt-BR', { minimumFractionDigits:3, maximumFractionDigits:3 });
/* metros -> centimetros legivel (A4 = 21 x 29,7 cm) */
const cm = m => ((Number.isFinite(+m) ? +m : 0) * 100).toLocaleString('pt-BR', { maximumFractionDigits:1 });

/* aceita "1.234,56", "0,21", "0.21" e números */
function num(v) {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  let s = String(v ?? '').trim().replace(/\s/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function isoParaBr(iso) {
  if (!iso) return '—';
  const [a, m, d] = String(iso).split('-');
  return d ? `${d}/${m}/${a}` : iso;
}

function fmtDataCurta(iso) {
  if (!iso) return '—';
  const dt = new Date(iso + 'T12:00:00');
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString('pt-BR');
}

function fmtDataLonga(iso) {
  if (!iso) return '—';
  const dt = new Date(iso + 'T12:00:00');
  if (Number.isNaN(dt.getTime())) return iso;
  return dt.toLocaleDateString('pt-BR', { day:'2-digit', month:'long', year:'numeric' });
}

function maisDias(iso, dias) {
  const dt = new Date((iso || new Date().toISOString().slice(0,10)) + 'T12:00:00');
  dt.setDate(dt.getDate() + (Number(dias) || 0));
  return dt.toISOString().slice(0,10);
}

/* ---------- helpers de texto no canvas ---------- */
function font(ctx, size, weight = 400) { ctx.font = `${weight} ${size}px ${FONT}`; }

function ajustar(ctx, txt, maxW) {
  const t = String(txt ?? '');
  if (ctx.measureText(t).width <= maxW) return t;
  let s = t;
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
  return s + '…';
}

function quebrar(ctx, txt, maxW, maxLinhas) {
  const palavras = String(txt ?? '').trim().split(/\s+/).filter(Boolean);
  if (!palavras.length) return [];
  const linhas = [];
  let atual = '';
  for (const p of palavras) {
    const teste = atual ? atual + ' ' + p : p;
    if (ctx.measureText(teste).width <= maxW) { atual = teste; }
    else { if (atual) linhas.push(atual); atual = p; }
  }
  if (atual) linhas.push(atual);
  if (maxLinhas && linhas.length > maxLinhas) {
    const cortadas = linhas.slice(0, maxLinhas);
    cortadas[maxLinhas - 1] = ajustar(ctx, cortadas[maxLinhas - 1], maxW);
    return cortadas;
  }
  return linhas;
}

function rotulo(ctx, txt, x, y) {
  font(ctx, 9.5, 700);
  ctx.fillStyle = C.cinza400;
  ctx.fillText(String(txt).toUpperCase(), x, y);
}

function campo(ctx, x, y, w, label, valor, maxLinhas = 1) {
  rotulo(ctx, label, x, y);
  font(ctx, 13, 500);
  ctx.fillStyle = C.cinza900;
  const linhas = quebrar(ctx, valor || '—', w, maxLinhas);
  linhas.forEach((l, i) => ctx.fillText(l, x, y + 17 + i * 17));
  return y + 17 + linhas.length * 17;
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function linha(ctx, x1, y1, x2, y2, cor, largura = 1) {
  ctx.strokeStyle = cor; ctx.lineWidth = largura;
  ctx.beginPath(); ctx.moveTo(x1, y1 + .5); ctx.lineTo(x2, y2 + .5); ctx.stroke();
}

/* ---------- imagens dos materiais ---------- */
const IMG_PADRAO = 'img/materiais/default.svg';
const IMG_CACHE = new Map();   /* src -> Promise<Image|null> */
const IMG_PRONTO = new Map();  /* src -> Image|null (sincronico) */

/* Figuras embutidas viram data: URL. Arquivo local desenhado no canvas deixa o
   canvas contaminado e o toBlob lanca SecurityError; data: URL nao contamina. */
const FIG_URL = new Map();
function urlFigura(nome) {
  nome = String(nome || '').split('/').pop();
  if (FIG_URL.has(nome)) return FIG_URL.get(nome);
  const svg = (typeof FIGURAS !== 'undefined') ? FIGURAS[nome] : null;
  const url = svg ? 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) : null;
  FIG_URL.set(nome, url);
  return url;
}

function resolverImg(valor) {
  const s = String(valor ?? '').trim();
  if (!s) return urlFigura('default.svg') || IMG_PADRAO;
  if (/^(https?:|data:|\/)/i.test(s)) return s;          /* fora do sistema */
  const base = s.split('/').pop();
  return urlFigura(base) || ('img/materiais/' + base);
}

function carregarImagem(src) {
  if (IMG_CACHE.has(src)) return IMG_CACHE.get(src);
  const p = new Promise(resolve => {
    const img = new Image();
    img.onload = () => { IMG_PRONTO.set(src, img); resolve(img); };
    img.onerror = () => { IMG_PRONTO.set(src, null); resolve(null); };
    img.src = src;
  });
  IMG_CACHE.set(src, p);
  return p;
}

function precarregarImagens(materiais) {
  const fontes = [...new Set((materiais || []).map(m => resolverImg(m.img)))];
  return Promise.all(fontes.map(carregarImagem));
}

/* imagens enviadas nos itens (data URL ou URL) também precisam estar prontas
   antes do canvas desenhar */
function precarregarImagensItens(itens) {
  const fontes = [...new Set((itens || []).map(i => i && i.imagem).filter(s => typeof s === 'string' && s.trim()))];
  return Promise.all(fontes.map(src => carregarImagem(src.trim())));
}

/* figura externa (foto do usuario) suja o canvas e quebra o PNG; nesta mode
   usamos so as figuras embutidas, que nao contaminam */
let SOMENTE_INLINE = false;

function imagemCarregada(mat) {
  const src = resolverImg(mat && mat.img);
  if (SOMENTE_INLINE && !src.startsWith('data:')) return IMG_PRONTO.get(urlFigura('default.svg')) || null;
  return IMG_PRONTO.get(src) || null;
}

/* exporta o canvas; devolve null se a contaminacao impedir o toBlob */
function canvasParaPng(canvas) {
  return new Promise(resolve => {
    try {
      canvas.toBlob(b => resolve(b), 'image/png');
    } catch (e) {
      resolve(null);
    }
  });
}

/* =========================================================
   CÁLCULO
   ========================================================= */
function rotMetodo(m) {
  const mapa = {
    sublimacao_total: 'Sublimação total',
    sublimacao_local: 'Sublimação local',
    sublimacao_local_a4_verso: 'Sublimação local A4 (verso)',
    sublimacao_local_a3_verso: 'Sublimação local A3 (verso)',
    dtf: 'Personalização DTF'
  };
  return mapa[m] || m || 'camisa';
}

function precoPorQuantidade(mat, qtd) {
  if (!mat) return 0;
  const fp = mat.faixaPreco;
  if (fp && typeof fp === 'object') {
    if (qtd > 20 && fp['>20'] !== undefined) return num(fp['>20']);
    if (qtd >= 7 && fp['7'] !== undefined) return num(fp['7']);
    if (fp['1'] !== undefined) return num(fp['1']);
    return 0;
  }
  return num(mat.precoFixo) || num(mat.preco) || 0;
}

function calcularItem(item, materiais, acabamentos) {
  const mat = materiais.find(m => m.id === item.materialId) || { nome: 'Material não encontrado', preco: 0 };
  const aca = acabamentos.find(a => a.id === item.acabamentoId) || { nome: 'Sem acabamento', custo: 0 };

  const tipoCamisa = mat.tipo === 'camisa';
  const fixo = tipoCamisa || num(mat.precoFixo) > 0;

  const largura    = tipoCamisa ? 0 : ((fixo) ? num(mat.largura) : Math.max(0, num(item.largura)));
  const altura     = tipoCamisa ? 0 : ((fixo) ? num(mat.altura)  : Math.max(0, num(item.altura)));
  const quantidade = Math.max(0, num(item.quantidade));

  const m2Un   = largura * altura;
  const m2Tot  = m2Un * quantidade;
  let valor = 0;
  if (tipoCamisa) {
    valor = quantidade * precoPorQuantidade(mat, quantidade);
  } else if (fixo) {
    valor = quantidade * num(mat.precoFixo);
  } else {
    valor = m2Tot * (num(mat.preco) + num(aca.custo));
  }

  return { mat, aca, largura, altura, quantidade, m2Un, m2Tot, valor, fixo, tipoCamisa };
}

function calcular(orc, materiais, acabamentos) {
  const itens = (orc.itens || []).map(it => ({ ...it, ...calcularItem(it, materiais, acabamentos) }));

  const areaTotal = itens.reduce((s, i) => s + i.m2Tot, 0);
  const subtotal  = itens.reduce((s, i) => s + i.valor, 0);

  const dv = Math.max(0, num(orc.descontoValor));
  let desconto = orc.descontoTipo === 'percentual' ? subtotal * (Math.min(dv, 100) / 100) : dv;
  desconto = Math.min(desconto, subtotal);

  const frete = Math.max(0, num(orc.frete));
  const total = subtotal - desconto + frete;

  return { itens, areaTotal, subtotal, desconto, frete, total };
}

/* =========================================================
   DESENHO DO ORÇAMENTO
   ========================================================= */
function desenhar(ctx, o, materiais, acabamentos) {
  const emp   = o.empresa || {};
  const cli   = o.cliente || {};
  const tot   = calcular(o, materiais, acabamentos);
  let   y     = 0;

  ctx.textBaseline = 'alphabetic';

  /* ---------- cabeçalho ---------- */
  const H = 124;
  ctx.fillStyle = C.branco;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = C.roxo700;
  ctx.fillRect(0, 0, W, 4);

  try {
    if (typeof preloadLogo === 'function') {
      preloadLogo();
    }
    const logo = IMG_PRONTO.get('img/logo-header.png') || IMG_PRONTO.get('img/logo.png');
    if (logo) {
      const s = 140;
      ctx.save();
      ctx.drawImage(logo, P, 34, s, s);
      ctx.restore();
      font(ctx, 20, 700); ctx.fillStyle = C.cinza900;
      ctx.fillText(ajustar(ctx, emp.nome || 'Sua Gráfica', W - 340), P + s + 16, 54);
      font(ctx, 11, 400); ctx.fillStyle = C.cinza500;
      const contatos = [emp.cnpj, emp.telefone, emp.email, emp.site].filter(Boolean).join('   ·   ');
      ctx.fillText(ajustar(ctx, contatos, W - 420), P + s + 16, 76);
      ctx.fillText(ajustar(ctx, emp.endereco || '', W - 420), P + s + 16, 95);
    } else {
      ctx.fillStyle = C.roxo700;
      roundRect(ctx, P, 34, 46, 46, 12); ctx.fill();
      font(ctx, 22, 700); ctx.fillStyle = C.branco;
      ctx.textAlign = 'center';
      ctx.fillText((emp.nome || 'G').trim().charAt(0).toUpperCase(), P + 23, 64);
      ctx.textAlign = 'left';
      font(ctx, 20, 700); ctx.fillStyle = C.cinza900;
      ctx.fillText(ajustar(ctx, emp.nome || 'Sua Gráfica', W - 340), P + 60, 54);
      font(ctx, 11, 400); ctx.fillStyle = C.cinza500;
      const contatos = [emp.cnpj, emp.telefone, emp.email, emp.site].filter(Boolean).join('   ·   ');
      ctx.fillText(ajustar(ctx, contatos, W - 420), P + 60, 76);
      ctx.fillText(ajustar(ctx, emp.endereco || '', W - 420), P + 60, 95);
    }
  } catch (e) {
    ctx.fillStyle = C.roxo700;
    roundRect(ctx, P, 34, 46, 46, 12); ctx.fill();
    font(ctx, 22, 700); ctx.fillStyle = C.branco;
    ctx.textAlign = 'center';
    ctx.fillText((emp.nome || 'G').trim().charAt(0).toUpperCase(), P + 23, 64);
    ctx.textAlign = 'left';
    font(ctx, 20, 700); ctx.fillStyle = C.cinza900;
    ctx.fillText(ajustar(ctx, emp.nome || 'Sua Gráfica', W - 340), P + 60, 54);
    font(ctx, 11, 400); ctx.fillStyle = C.cinza500;
    const contatos = [emp.cnpj, emp.telefone, emp.email, emp.site].filter(Boolean).join('   ·   ');
    ctx.fillText(ajustar(ctx, contatos, W - 420), P + 60, 76);
    ctx.fillText(ajustar(ctx, emp.endereco || '', W - 420), P + 60, 95);
  }

  ctx.textAlign = 'right';
  font(ctx, 16, 700); ctx.fillStyle = C.roxo700;
  ctx.fillText('ORÇAMENTO', W - P, 54);
  font(ctx, 12.5, 500); ctx.fillStyle = C.cinza700;
  ctx.fillText(o.numero || '—', W - P, 76);
  font(ctx, 11, 400); ctx.fillStyle = C.cinza400;
  ctx.fillText(fmtDataLonga(o.data), W - P, 95);
  ctx.textAlign = 'left';

  linha(ctx, 0, H, W, H, C.cinza200);

  y = H + 34;

  /* ---------- cliente ---------- */
  font(ctx, 10.5, 700); ctx.fillStyle = C.cinza500;
  ctx.fillText('CLIENTE', P, y);
  y += 14;

  const boxY = y;
  ctx.fillStyle = C.cinza50;
  roundRect(ctx, P, boxY, W - P * 2, 112, 12); ctx.fill();
  ctx.strokeStyle = C.cinza200; ctx.lineWidth = 1;
  roundRect(ctx, P, boxY, W - P * 2, 112, 12); ctx.stroke();

  const cx = P + 20, cw1 = 330, cw2 = W - P * 2 - 40 - 330 - 24;
  let y1 = boxY + 26;
  font(ctx, 9.5, 700);
  y1 = campo(ctx, cx, y1, cw1, 'Nome / Razão social', cli.nome, 1) + 8;
  y1 = campo(ctx, cx, y1, cw1, 'Documento', cli.documento, 1) + 8;
  campo(ctx, cx, y1, cw1, 'Telefone', cli.telefone, 1);

  const dx = cx + cw1 + 24;
  let y2 = boxY + 26;
  y2 = campo(ctx, dx, y2, cw2, 'E-mail', cli.email, 1) + 8;
  campo(ctx, dx, y2, cw2, 'Endereço', cli.endereco, 2);

  y = boxY + 112 + 26;

  /* ---------- tabela de itens ---------- */
  const cols = [
    { k:'idx',  rot:'#',  w:38,  al:'left'  },
    { k:'desc', rot:'Descrição', w:290, al:'left' },
    { k:'med',  rot:'Medidas (m)', w:112, al:'left' },
    { k:'qtd',  rot:'Qtd', w:58,  al:'center'},
    { k:'m2',   rot:'m² total', w:82, al:'right' },
    { k:'acb',  rot:'Acabamento', w:164, al:'left' },
    { k:'val',  rot:'Valor', w:164, al:'right'  }
  ];
  (function () {
    const soma = cols.reduce((s, c) => s + c.w, 0);
    const dif = (W - P * 2 - soma) / (cols.length - 1);
    cols.forEach((c, i) => { if (i === cols.length - 1) return; c.w += dif; });
  })();

  let cx2 = P;
  const HEAD_H = 34, ROW_H = 78;
  cols.forEach(c => { c.x = cx2; cx2 += c.w; });

  // cabeçalho da tabela
  ctx.fillStyle = C.cinza100;
  ctx.fillRect(P, y, W - P * 2, HEAD_H);
  font(ctx, 9.5, 700); ctx.fillStyle = C.cinza500;
  cols.forEach(c => {
    const tx = c.al === 'right' ? c.x + c.w - 12 : c.al === 'center' ? c.x + c.w / 2 : c.x + 12;
    ctx.textAlign = c.al === 'right' ? 'right' : c.al === 'center' ? 'center' : 'left';
    ctx.fillText(c.rot.toUpperCase(), tx, y + 21);
  });
  ctx.textAlign = 'left';
  y += HEAD_H;

  if (!tot.itens.length) {
    ctx.fillStyle = C.cinza50; ctx.fillRect(P, y, W - P * 2, ROW_H);
    font(ctx, 12, 400); ctx.fillStyle = C.cinza400;
    ctx.textAlign = 'center';
    ctx.fillText('Nenhum item incluído neste orçamento.', W / 2, y + ROW_H / 2 + 4);
    ctx.textAlign = 'left';
    linha(ctx, P, y + ROW_H, W - P, y + ROW_H, C.cinza200);
    y += ROW_H;
  }

  const THUMB = 62, THUMB_GAP = 12;
  const descX = cols[1].x + 12 + THUMB + THUMB_GAP;
  const descW = cols[1].w - 24 - THUMB - THUMB_GAP;
  const meioY = ry2 => ry2 + ROW_H / 2;

  tot.itens.forEach((it, i) => {
    const ry = y + i * ROW_H;
    if (i % 2 === 1) { ctx.fillStyle = C.cinza50; ctx.fillRect(P, ry, W - P * 2, ROW_H); }

    font(ctx, 12, 700); ctx.fillStyle = C.cinza400;
    ctx.textAlign = 'center';
    ctx.fillText(String(i + 1), cols[0].x + cols[0].w / 2, meioY(ry) + 4);
    ctx.textAlign = 'left';

    /* miniatura do material (ou da imagem enviada pelo cliente) */
    const tx = cols[1].x + 12, ty = ry + (ROW_H - THUMB) / 2;
    const fig = imagemCarregada(it.mat);
    ctx.save();
    roundRect(ctx, tx, ty, THUMB, THUMB, 10);
    ctx.clip();
    if (it.imagem) {
      try { ctx.drawImage(IMG_PRONTO.get(it.imagem), tx, ty, THUMB, THUMB); } catch (e) {}
    } else if (fig) {
      ctx.drawImage(fig, tx, ty, THUMB, THUMB);
    } else {
      ctx.fillStyle = C.cinza100; ctx.fillRect(tx, ty, THUMB, THUMB);
    }
    ctx.restore();
    ctx.strokeStyle = C.cinza200; ctx.lineWidth = 1;
    roundRect(ctx, tx, ty, THUMB, THUMB, 10); ctx.stroke();

    font(ctx, 12.5, 700); ctx.fillStyle = C.cinza900;
    ctx.fillText(ajustar(ctx, it.mat.nome, descW), descX, meioY(ry) - 2);
    font(ctx, 10.5, 400); ctx.fillStyle = C.cinza500;
    let custoLinha;
    if (it.tipoCamisa) {
      const fp = it.mat.faixaPreco;
      custoLinha = fp && fp['1'] !== undefined
        ? `${brl(num(fp['1']))} / peça (1 un)${fp['7'] !== undefined ? ` · ${brl(num(fp['7']))} (7 un)` : ''}${fp['>20'] !== undefined ? ` · ${brl(num(fp['>20']))} (21+ un)` : ''}`
        : 'Preço a confirmar';
    } else if (it.fixo) {
      custoLinha = `${brl(num(it.mat.precoFixo))} por peça (preço fixo)`;
    } else {
      custoLinha = `${brl(num(it.mat.preco))}/m² material`
        + (num(it.aca.custo) ? ` + ${brl(num(it.aca.custo))}/m² acabamento` : '');
    }
    ctx.fillText(ajustar(ctx, custoLinha, descW), descX, meioY(ry) + 15);

    font(ctx, 12, 400); ctx.fillStyle = C.cinza700;
    if (it.tipoCamisa) {
      ctx.fillText('—', cols[2].x + 12, meioY(ry) - 2);
      ctx.fillText('por unidade', cols[2].x + 12, meioY(ry) + 15);
    } else {
      const med = `${it.largura.toLocaleString('pt-BR', { maximumFractionDigits:3 })} × ${it.altura.toLocaleString('pt-BR', { maximumFractionDigits:3 })}`;
      ctx.fillText(ajustar(ctx, med, cols[2].w - 24), cols[2].x + 12, meioY(ry) - 2);
      font(ctx, 10, 400); ctx.fillStyle = C.cinza400;
      ctx.fillText(`${m2(it.m2Un)} m² un.`, cols[2].x + 12, meioY(ry) + 15);
    }

    font(ctx, 12.5, 600); ctx.fillStyle = C.cinza700;
    ctx.textAlign = 'center';
    ctx.fillText(it.quantidade.toLocaleString('pt-BR', { maximumFractionDigits:2 }), cols[3].x + cols[3].w / 2, meioY(ry) - 2);
    font(ctx, 10, 400); ctx.fillStyle = C.cinza400;
    ctx.fillText('un.', cols[3].x + cols[3].w / 2, meioY(ry) + 15);
    ctx.textAlign = 'left';

    font(ctx, 12.5, 700); ctx.fillStyle = C.roxo700;
    ctx.textAlign = 'right';
    if (it.tipoCamisa) {
      ctx.fillText('—', cols[4].x + cols[4].w - 12, meioY(ry) - 2);
      ctx.fillText('', cols[4].x + cols[4].w - 12, meioY(ry) + 15);
    } else {
      ctx.fillText(m2(it.m2Tot), cols[4].x + cols[4].w - 12, meioY(ry) - 2);
      ctx.fillText('m²', cols[4].x + cols[4].w - 12, meioY(ry) + 15);
    }
    ctx.textAlign = 'left';

    if (it.tipoCamisa) {
      font(ctx, 11.5, 400); ctx.fillStyle = C.cinza400;
      ctx.fillText(ajustar(ctx, rotMetodo(it.mat.metodo), cols[5].w - 24), cols[5].x + 12, meioY(ry) - 2);
    } else if (it.fixo) {
      font(ctx, 11.5, 400); ctx.fillStyle = C.cinza400;
      ctx.fillText('—', cols[5].x + 12, meioY(ry) - 2);
    } else {
      font(ctx, 11.5, 400); ctx.fillStyle = C.cinza600;
      ctx.fillText(ajustar(ctx, it.aca.nome, cols[5].w - 24), cols[5].x + 12, meioY(ry) - 2);
      if (num(it.aca.custo)) {
        font(ctx, 10, 400); ctx.fillStyle = C.cinza400;
        ctx.fillText(`+ ${brl(num(it.aca.custo))} / m²`, cols[5].x + 12, meioY(ry) + 15);
      }
    }

    font(ctx, 14, 800); ctx.fillStyle = C.roxo800;
    ctx.textAlign = 'right';
    ctx.fillText(it.tipoCamisa && !it.mat.faixaPreco ? 'A confirmar' : brl(it.valor), cols[6].x + cols[6].w - 12, meioY(ry) + 5);
    ctx.textAlign = 'left';

    linha(ctx, P, ry + ROW_H, W - P, ry + ROW_H, C.cinza200);
  });

  y += Math.max(tot.itens.length, 1) * ROW_H;
  y += 8;
  font(ctx, 9.5, 400); ctx.fillStyle = C.cinza400;
  ctx.textAlign = 'right';
  ctx.fillText(`Área total produzida: ${m2(tot.areaTotal)} m²`, W - P, y);
  ctx.textAlign = 'left';
  y += 24;

  /* ---------- condições ---------- */
  const colsCond = [
    { l:'Condição de pagamento', v:o.condicaoPagamento },
    { l:'Prazo de entrega',      v:o.prazoEntrega },
    { l:'Validade da proposta',  v:`${o.validadeDias || 15} dias — até ${isoParaBr(maisDias(o.data, o.validadeDias || 15))}` }
  ];
  font(ctx, 10.5, 700); ctx.fillStyle = C.cinza500;
  ctx.fillText('CONDIÇÕES', P, y);
  y += 14;

  const condW = (W - P * 2 - 24) / 3;
  const condY = y;
  colsCond.forEach((c, i) => campo(ctx, P + i * (condW + 12), condY + 16, condW, c.l, c.v, 2));
  y = condY + 66;

  /* ---------- observações ---------- */
  if (o.observacoes) {
    font(ctx, 10.5, 700); ctx.fillStyle = C.cinza500;
    ctx.fillText('OBSERVAÇÕES', P, y);
    y += 14;
    font(ctx, 12, 400); ctx.fillStyle = C.cinza700;
    const linhas = quebrar(ctx, o.observacoes, W - P * 2, 5);
    linhas.forEach(l => { ctx.fillText(l, P, y); y += 18; });
    y += 10;
  }

  /* ---------- totais ---------- */
  const TW = 340, TX = W - P - TW;
  y += 10;
  ctx.fillStyle = C.cinza100;
  roundRect(ctx, TX, y, TW, 34, 8); ctx.fill();
  font(ctx, 9.5, 700); ctx.fillStyle = C.cinza500;
  ctx.fillText('ÁREA TOTAL', TX + 16, y + 22);
  font(ctx, 12.5, 700); ctx.fillStyle = C.cinza900;
  ctx.textAlign = 'right';
  ctx.fillText(`${m2(tot.areaTotal)} m²`, TX + TW - 16, y + 22);
  ctx.textAlign = 'left';
  y += 42;

  const linhasTot = [
    ['Subtotal',                          brl(tot.subtotal), false],
    ['Desconto' + (o.descontoTipo === 'percentual' && num(o.descontoValor)
        ? ` (${num(o.descontoValor).toLocaleString('pt-BR', { maximumFractionDigits:2 })}%)`
        : ''),                           '-' + brl(tot.desconto), tot.desconto > 0],
    ['Frete / entrega',                   brl(tot.frete),      false]
  ].filter(l => !(l[0].startsWith('Desconto') && tot.desconto <= 0) && !(l[0].startsWith('Frete') && tot.frete <= 0));

  linhasTot.forEach(l => {
    font(ctx, 12.5, 400); ctx.fillStyle = C.cinza600;
    ctx.fillText(l[0], TX, y + 16);
    font(ctx, 13, 700); ctx.fillStyle = l[2] ? C.roxo600 : C.cinza900;
    ctx.textAlign = 'right';
    ctx.fillText(l[1], TX + TW, y + 16);
    ctx.textAlign = 'left';
    linha(ctx, TX, y + 24, TX + TW, y + 24, C.cinza100);
    y += 30;
  });

  y += 8;
  ctx.fillStyle = C.roxo50;
  roundRect(ctx, TX, y, TW, 58, 10); ctx.fill();
  ctx.strokeStyle = C.roxo300; ctx.lineWidth = 1;
  roundRect(ctx, TX, y, TW, 58, 10); ctx.stroke();

  font(ctx, 11, 800); ctx.fillStyle = C.roxo700;
  ctx.fillText('TOTAL', TX + 18, y + 36);
  font(ctx, 24, 800); ctx.fillStyle = C.roxo900;
  ctx.textAlign = 'right';
  ctx.fillText(brl(tot.total), TX + TW - 18, y + 39);
  ctx.textAlign = 'left';
  y += 58;

  /* ---------- rodapé ---------- */
  y += 26;
  linha(ctx, P, y, W - P, y, C.cinza200);
  y += 10;
  try {
    const lr = IMG_PRONTO.get('img/logo-rodape.png');
    if (lr) {
      const lrH = 90;
      const lrW = Math.round((lr.width / lr.height) * lrH);
      ctx.drawImage(lr, (W - lrW) / 2, y, lrW, lrH);
      y += lrH + 6;
    } else {
      preloadLogo();
    }
  } catch (e) {}
  font(ctx, 10, 400); ctx.fillStyle = C.cinza400;
  ctx.textAlign = 'center';
  ctx.fillText(
    `${emp.nome || ''}${emp.cnpj ? ' · CNPJ ' + emp.cnpj : ''}${emp.telefone ? ' · ' + emp.telefone : ''}`,
    W / 2, y
  );
  y += 15;
  ctx.fillText('Orçamento sem valor fiscal. Preços sujeitos a alteração sem aviso prévio.', W / 2, y);
  ctx.textAlign = 'left';
  y += 34;

  return y;
}

/* ---------- render + download ---------- */
function renderizarImagem(canvas, o, materiais, acabamentos, escala) {
  const dpr = escala || Math.max(1, Math.min(window.devicePixelRatio || 1, 2));

  const med = document.createElement('canvas');
  med.width = W; med.height = 6000;
  const H = Math.ceil(desenhar(med.getContext('2d'), o, materiais, acabamentos));

  canvas.width  = Math.round(W * dpr);
  canvas.height = Math.round(H * dpr);

  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = C.branco;
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(med, 0, 0, W, H, 0, 0, W, H);

  canvas.dataset.h = H;
  return H;
}

/* Desenha o orcamento e devolve o PNG. Nao falha nunca: se alguma figura
   externa (foto do usuario) contaminar o canvas, refaz so com as figuras
   embutidas para o arquivo sair assim mesmo. */
async function baixarImagem(o) {
  const materiais = ESTADO.materiais;
  const acabamentos = ESTADO.acabamentos;
  await precarregarImagens(materiais);

  const desenhar = escala => {
    const tmp = document.createElement('canvas');
    renderizarImagem(tmp, o, materiais, acabamentos, escala);
    return tmp;
  };

  let blob = await canvasParaPng(desenhar(2));
  let aviso = '';

  if (!blob) {
    SOMENTE_INLINE = true;
    try { blob = await canvasParaPng(desenhar(2)); } finally { SOMENTE_INLINE = false; }
    aviso = ' (usando as figuras do sistema)';
  }
  if (!blob) throw new Error('Não foi possível gerar o PNG.');

  const nome = `orcamento-${(o.numero || 'sem-numero').replace(/[^\w\-]+/g, '_')}.png`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  return { nome, aviso };
}

function preloadLogo(){ if(!IMG_PRONTO.has("img/logo-header.png")){ const im=new Image(); im.onload=()=>IMG_PRONTO.set("img/logo-header.png",im); im.src="img/logo-header.png"; } if(!IMG_PRONTO.has("img/logo-icon.png")){ const im=new Image(); im.onload=()=>IMG_PRONTO.set("img/logo-icon.png",im); im.src="img/logo-icon.png"; } if(!IMG_PRONTO.has("img/logo-rodape.png")){ const im=new Image(); im.onload=()=>IMG_PRONTO.set("img/logo-rodape.png",im); im.src="img/logo-rodape.png"; } }
