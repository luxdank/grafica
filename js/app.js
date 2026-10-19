/* =========================================================
   app.js — roteador, formulários, itens e ações
   ========================================================= */

const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

let ESTADO = DB.estado();
let orc = null;

/* ---------- helpers ---------- */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c =>
  ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));

function novoItem() {
  return {
    materialId: ESTADO.materiais[0]?.id || '',
    acabamentoId: ESTADO.acabamentos[0]?.id || '',
    largura: 0.21, altura: 0.297, quantidade: 1, observacao: '',
    imagem: ''
  };
}

function novoOrcamento() {
  const hoje = new Date().toISOString().slice(0, 10);
  const ultimo = (ESTADO.ultimoCliente && ESTADO.ultimoCliente.nome) ? ESTADO.ultimoCliente : null;
  return {
    numero: proximoNumero(),
    data: hoje,
    cliente: { nome: ultimo ? ultimo.nome : '', documento: '', telefone: '', email: '', endereco: '' },
    itens: [],
    descontoTipo: 'percentual', descontoValor: 0, frete: 0,
    validadeDias: 15,
    condicaoPagamento: ultimo ? (ultimo.condicaoPagamento || '') : '',
    prazoEntrega: ultimo ? (ultimo.prazoEntrega || '') : '',
    observacoes: ''
  };
}

function proximoNumero() {
  const ano = new Date().getFullYear();
  const pre = (ESTADO.empresa.prefixoNumero || 'ORC').replace(/\s+/g, '');
  return `${pre}-${ano}-${String(ESTADO.sequencia).padStart(4, '0')}`;
}

function toast(msg, tipo = '') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast show ' + tipo;
  t.hidden = false;
  clearTimeout(t._t);
  t._t = setTimeout(() => { t.className = 'toast ' + tipo; }, 2400);
}

function getPath(obj, path) {
  return path.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
function setPath(obj, path, val) {
  const ks = path.split('.');
  const last = ks.pop();
  const alvo = ks.reduce((o, k) => (o[k] = o[k] || {}), obj);
  alvo[last] = val;
}

/* os campos da empresa usam data-model="empresa.xxx" mas gravam em ESTADO.empresa */
function getEmpresa(path) { return getPath(ESTADO.empresa, path.replace(/^empresa\./, '')); }
function setEmpresa(path, val) { setPath(ESTADO.empresa, path.replace(/^empresa\./, ''), val); }

/* ---------- ROTEADOR ---------- */
const TITULOS = {
  novo:      ['Novo Orçamento', 'Escolha o material, informe a metragem e o valor é calculado automaticamente.'],
  historico:  ['Histórico', 'Orçamentos salvos neste navegador.'],
  materiais: ['Materiais e Preços', 'Preço base por m² usado no cálculo automático.'],
  config:    ['Dados da Empresa', 'Aparecem no cabeçalho do orçamento gerado.']
};

function ir(view) {
  const v = TITULOS[view] ? view : 'novo';
  $$('.nav-item').forEach(n => n.classList.toggle('is-active', n.dataset.view === v));
  $$('.view').forEach(s => s.classList.toggle('is-active', s.dataset.view === v));
  $('#viewTitle').textContent = TITULOS[v][0];
  $('#viewSubtitle').textContent = TITULOS[v][1];
  if (location.hash.slice(1) !== v) location.hash = v;
  fecharMenu();
  if (v === 'novo') atualizarPrevia();
  if (v === 'historico') renderHistorico();
  if (v === 'materiais') renderTabelasPreco();
  window.scrollTo({ top: 0 });
}

function abrirMenu()  { $('#sidebar').classList.add('open'); $('#overlay').hidden = false; }
function fecharMenu() { $('#sidebar').classList.remove('open'); $('#overlay').hidden = true; }

/* ---------- imagens ---------- */
function imgDe(materialId) {
  const m = ESTADO.materiais.find(x => x.id === materialId);
  return resolverImg(m?.img);
}

/* ---------- ITENS ---------- */
function opcoesMateriais() {
  const rot = m => {
    if (m.tipo === 'camisa') {
      const fp = m.faixaPreco;
      return fp && fp['1'] !== undefined
        ? `${m.nome} — ${brl(num(fp['1']))} / peça (1 un)`
        : `${m.nome} — preço a confirmar`;
    }
    return `${m.nome} — ${num(m.precoFixo) ? brl(num(m.precoFixo)) + ' / peça' : brl(num(m.preco)) + '/m²'}`;
  };
  const opts = lista => lista.map(m => `<option value="${esc(m.id)}">${esc(rot(m))}</option>`).join('');
  const camisas = ESTADO.materiais.filter(m => m.tipo === 'camisa');
  const outros  = ESTADO.materiais.filter(m => m.tipo !== 'camisa');
  return (camisas.length ? `<optgroup label="Camisas Personalizadas">${opts(camisas)}</optgroup>` : '') +
         (outros.length  ? `<optgroup label="Materiais">${opts(outros)}</optgroup>` : '');
}
function opcoesAcabamentos() {
  return ESTADO.acabamentos.map(a =>
    `<option value="${esc(a.id)}">${esc(a.nome)}${num(a.custo) ? ` — +${brl(num(a.custo))}/m²` : ''}</option>`).join('');
}

function itemHTML(it, i) {
  const c = calcularItem(it, ESTADO.materiais, ESTADO.acabamentos);
  const fixo = c.fixo;
  const medFixa = `${c.largura.toLocaleString('pt-BR', { maximumFractionDigits:3 })} × ${c.altura.toLocaleString('pt-BR', { maximumFractionDigits:3 })} m`;
  const qtdHTML = `
        <div class="qtd-combo">
          <input type="number" min="0" step="1" data-k="quantidade" value="${it.quantidade}">
          <div class="chips">
            ${(c.tipoCamisa ? [1, 7, 21, 50] : [100, 250, 500, 1000]).map(n => `<button type="button" class="chip" data-qtd="${n}" title="${n} unidades">${n}</button>`).join('')}
          </div>
        </div>`;

  const campos = c.tipoCamisa ? `
      <div class="f-field span2">
        <label>Quantidade</label>
        ${qtdHTML}
      </div>` : (fixo ? `
      <div class="f-field span2">
        <label>Quantidade</label>
        ${qtdHTML}
      </div>
      <div class="f-field">
        <label>m² por unidade</label>
        <div class="ro" data-m2un>${m2(c.m2Un)} <small>m²</small></div>
      </div>
      <div class="f-field">
        <label>m² total</label>
        <div class="ro" data-m2tot>${m2(c.m2Tot)} <small>m²</small></div>
      </div>` : `
      <div class="f-field">
        <label>Acabamento</label>
        <select data-k="acabamentoId">${opcoesAcabamentos()}</select>
      </div>
      <div class="f-field">
        <label>Quantidade</label>
        ${qtdHTML}
      </div>
      <div class="f-field span2">
        <label>Formato rápido</label>
        <select data-preset aria-label="Formato rápido">
          <option value="">Escolher formato…</option>
          ${DB.FORMATOS.map(([rot, l, a]) => `<option value="${l}|${a}">${rot} — ${cm(l)}×${cm(a)} cm</option>`).join('')}
        </select>
      </div>
      <div class="f-field">
        <label>Largura (m)</label>
        <input type="number" min="0" step="0.001" data-k="largura" value="${it.largura}">
      </div>
      <div class="f-field">
        <label>Comprimento (m)</label>
        <input type="number" min="0" step="0.001" data-k="altura" value="${it.altura}">
      </div>
      <div class="f-field">
        <label>m² por unidade</label>
        <div class="ro" data-m2un>${m2(c.m2Un)} <small>m²</small></div>
      </div>
      <div class="f-field">
        <label>m² total</label>
        <div class="ro" data-m2tot>${m2(c.m2Tot)} <small>m²</small></div>
      </div>`);

  let precoUnitCamisa = 0;
  if (c.tipoCamisa) {
    const fp = c.mat.faixaPreco;
    if (fp) {
      if (c.quantidade > 20 && fp['>20'] !== undefined) precoUnitCamisa = fp['>20'];
      else if (c.quantidade >= 7 && fp['7'] !== undefined) precoUnitCamisa = fp['7'];
      else precoUnitCamisa = fp['1'] !== undefined ? fp['1'] : 0;
    } else {
      precoUnitCamisa = num(c.mat.precoFixo);
    }
  }
  const resumo = c.tipoCamisa
    ? `${c.quantidade.toLocaleString('pt-BR')} un × ${brl(precoUnitCamisa)} / peça${(c.mat.faixaPreco ? '' : ' (valor a confirmar)')}`
    : (fixo
      ? `${c.quantidade.toLocaleString('pt-BR')} un × ${brl(num(c.mat.precoFixo))} / peça`
      : `${c.quantidade.toLocaleString('pt-BR')} un × ${m2(c.m2Un)} m² × ${brl(num(c.mat.preco) + num(c.aca.custo))}/m²`);

  return `
  <div class="item" data-i="${i}">
    <div class="item-head">
      <span class="item-n">${i + 1}</span>
      <span class="item-thumb"><img data-thumb src="${esc(imgDe(it.materialId))}" alt="" loading="lazy"></span>
      <span class="item-title" data-tit>${esc(c.mat.nome)}</span>
      <button class="btn-del" data-del="${i}" type="button" title="Remover item" aria-label="Remover item">
        <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
      </button>
    </div>

    <div class="item-grid">
      <div class="f-field span2">
        <label>Material</label>
        <select data-k="materialId">${opcoesMateriais()}</select>
      </div>
      ${campos}
      <div class="f-field span2">
        <label>Imagem do produto / referência (opcional)</label>
        <input type="file" accept="image/*" data-img-upload>
        <input type="text" data-k="imagem" value="${esc(it.imagem || '')}" placeholder="Ou cole URL da imagem aqui">
        ${it.imagem ? `<div style="display:flex;align-items:center;gap:10px;margin-top:6px">
          <img data-thumb-extra src="${esc(it.imagem)}" alt="" style="width:56px;height:56px;border-radius:8px;border:1px solid var(--cinza-200);object-fit:cover;background:var(--cinza-50)">
          <button type="button" class="btn btn-ghost btn-sm" data-clear-img>Remover imagem</button>
        </div>` : ''}
      </div>
    </div>

    <div class="item-total">
      <span data-resumo>${resumo}</span>
      <b data-valor>${(c.tipoCamisa && !c.mat.faixaPreco) ? 'A confirmar' : brl(c.valor)}</b>
    </div>
  </div>`;
}

function renderItens() {
  const wrap = $('#items');
  wrap.innerHTML = orc.itens.map(itemHTML).join('');
  const tem = orc.itens.length > 0;
  $('#itemsEmpty').hidden = tem;
  $('#btnAddItemWrap').hidden = !tem;
  $$('[data-k="materialId"]', wrap).forEach(s => { s.value = orc.itens[+s.closest('.item').dataset.i].materialId; });
  $$('[data-k="acabamentoId"]', wrap).forEach(s => { s.value = orc.itens[+s.closest('.item').dataset.i].acabamentoId; });
}

function atualizarItem(i) {
  const el = $(`.item[data-i="${i}"]`);
  if (!el) return;
  const c = calcularItem(orc.itens[i], ESTADO.materiais, ESTADO.acabamentos);
  $('[data-tit]', el).textContent = c.mat.nome;
  $('[data-thumb]', el).src = imgDe(orc.itens[i].materialId);
  const elM2un = $('[data-m2un]', el); if (elM2un) elM2un.innerHTML = `${m2(c.m2Un)} <small>m²</small>`;
  const elM2tot = $('[data-m2tot]', el); if (elM2tot) elM2tot.innerHTML = `${m2(c.m2Tot)} <small>m²</small>`;
  $('[data-valor]', el).textContent = (c.tipoCamisa && !c.mat.faixaPreco) ? 'A confirmar' : brl(c.valor);
  let pu = 0;
  if (c.tipoCamisa) {
    const fp = c.mat.faixaPreco;
    if (fp) {
      if (c.quantidade > 20 && fp['>20'] !== undefined) pu = fp['>20'];
      else if (c.quantidade >= 7 && fp['7'] !== undefined) pu = fp['7'];
      else pu = fp['1'] !== undefined ? fp['1'] : 0;
    } else {
      pu = num(c.mat.precoFixo);
    }
  }
  $('[data-resumo]', el).textContent = c.tipoCamisa
    ? `${c.quantidade.toLocaleString('pt-BR')} un × ${brl(pu)} / peça${(c.mat.faixaPreco ? '' : ' (valor a confirmar)')}`
    : (c.fixo
      ? `${c.quantidade.toLocaleString('pt-BR')} un × ${brl(num(c.mat.precoFixo))} / peça`
      : `${c.quantidade.toLocaleString('pt-BR')} un × ${m2(c.m2Un)} m² × ${brl(num(c.mat.preco) + num(c.aca.custo))}/m²`);
}

/* ---------- TOTAIS + PRÉVIA ---------- */
let previaTimer = null;

function atualizarTotais() {
  const t = calcular(orc, ESTADO.materiais, ESTADO.acabamentos);
  const linhas = [
    ['Área total', `${m2(t.areaTotal)} m²`],
    ['Subtotal', brl(t.subtotal)]
  ];
  if (t.desconto > 0) linhas.push(['Desconto', '-' + brl(t.desconto)]);
  if (t.frete > 0)   linhas.push(['Frete', brl(t.frete)]);

  $('#resumo').innerHTML =
    linhas.map(l => `<div class="tr-row"><span>${esc(l[0])}</span><b>${esc(l[1])}</b></div>`).join('') +
    `<div class="tr-total"><span>Total</span><strong>${brl(t.total)}</strong></div>`;

  const soma = t.total;
  $('#sideTotal').textContent = brl(soma);
  return t;
}

function atualizarPrevia() {
  clearTimeout(previaTimer);
  previaTimer = setTimeout(() => {
    try {
      renderizarImagem($('#preview'), { ...orc, empresa: ESTADO.empresa }, ESTADO.materiais, ESTADO.acabamentos);
    } catch (e) { console.error(e); }
  }, 110);
}

function atualizarTudo() { atualizarTotais(); atualizarPrevia(); }

/* carrega as ilustrações e redesenha o preview quando ficarem prontas */
function recarregarImagens() {
  Promise.all([
    precarregarImagens(ESTADO.materiais),
    typeof precarregarImagensItens === 'function' ? precarregarImagensItens(orc ? orc.itens : []) : Promise.resolve()
  ]).then(atualizarPrevia);
}

/* ---------- HISTÓRICO ---------- */
function renderHistorico() {
  const busca = ($('#buscaHist').value || '').trim().toLowerCase();
  const lista = ESTADO.orcamentos
    .filter(o => !busca ||
      (o.cliente?.nome || '').toLowerCase().includes(busca) ||
      (o.numero || '').toLowerCase().includes(busca))
    .slice()
    .sort((a, b) => String(b.data).localeCompare(String(a.data)));

  $('#badgeHist').textContent = ESTADO.orcamentos.length;
  $('#histEmpty').hidden = lista.length > 0;
  $('#tabelaHist').hidden = lista.length === 0;

  $('#histBody').innerHTML = lista.map(o => `
    <tr>
      <td><span class="tag">${esc(o.numero)}</span></td>
      <td>${esc(o.cliente?.nome || '—')}</td>
      <td class="td-muted">${isoParaBr(o.data)}</td>
      <td class="t-r">${(o.itens?.length || 0)}</td>
      <td class="t-r val-total">${brl(o.total)}</td>
      <td class="t-c">
        <div class="acoes">
          <button class="btn btn-outline btn-sm" data-abrir="${esc(o.id)}">Abrir</button>
          <button class="btn-del" data-excluir="${esc(o.id)}" title="Excluir">
            <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
          </button>
        </div>
      </td>
    </tr>`).join('');
}

/* ---------- TABELAS DE PREÇO ---------- */
function renderTabelasPreco() {
  $('#matBody').innerHTML = ESTADO.materiais.map(m => {
    const camisa = m.tipo === 'camisa';
    const cobranca = camisa || num(m.precoFixo) > 0 ? 'un' : 'm2';
    const fp = camisa && m.faixaPreco ? m.faixaPreco : null;
    const faixaInputs = `
      <label class="faixa-lab">1 un <input type="number" min="0" step="0.01" data-mat-faixa="${esc(m.id)}:1" value="${fp && fp['1'] !== undefined ? fp['1'] : ''}" style="max-width:90px"></label>
      <label class="faixa-lab">7 un <input type="number" min="0" step="0.01" data-mat-faixa="${esc(m.id)}:7" value="${fp && fp['7'] !== undefined ? fp['7'] : ''}" style="max-width:90px"></label>
      <label class="faixa-lab">21+ <input type="number" min="0" step="0.01" data-mat-faixa="${esc(m.id)}:>20" value="${fp && fp['>20'] !== undefined ? fp['>20'] : ''}" style="max-width:90px"></label>`;
    const preco = camisa
      ? `<div class="faixa-wrap">${faixaInputs}<span class="mat-unit">/peça</span></div>`
      : (cobranca === 'un'
        ? `<input type="number" min="0" step="0.01" data-mat-fixo="${esc(m.id)}" value="${m.precoFixo || 0}" style="max-width:130px"><span class="mat-unit">/peça</span>`
        : `<input type="number" min="0" step="0.01" data-mat-preco="${esc(m.id)}" value="${m.preco || 0}" style="max-width:130px"><span class="mat-unit">/m²</span>`);
    const selCobranca = camisa ? '' : `
        <select data-mat-cobranca="${esc(m.id)}" title="Forma de cobrança" style="max-width:130px">
          <option value="m2"${cobranca === 'm2' ? ' selected' : ''}>Por metragem (m²)</option>
          <option value="un"${cobranca === 'un' ? ' selected' : ''}>Por unidade (peça)</option>
        </select>`;
    return `
    <tr>
      <td class="col-thumb"><img class="thumb" src="${esc(resolverImg(m.img))}" alt="${esc(m.nome)}" loading="lazy"></td>
      <td>
        <div class="cell-ed"><input type="text" data-mat-nome="${esc(m.id)}" value="${esc(m.nome)}"></div>
        ${camisa ? '<div class="mat-note">Camisa personalizada · preço por unidade</div>' : (cobranca === 'un' ? `<div class="mat-note">Cobrança por peça${m.largura ? ' · ' + num(m.largura).toLocaleString('pt-BR') + ' × ' + num(m.altura).toLocaleString('pt-BR') + ' m' : ''}</div>` : '')}
        <div class="mat-path">
          <input type="text" data-mat-img="${esc(m.id)}" value="${esc(m.img || '')}" placeholder="img/materiais/m1.svg" title="Caminho da imagem">
          <label class="btn btn-ghost btn-sm mat-upl" title="Enviar imagem do produto">
            <svg viewBox="0 0 24 24"><path d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2"/></svg>
            Enviar imagem
            <input type="file" accept="image/*" data-mat-upload="${esc(m.id)}" hidden>
          </label>
        </div>
      </td>
      <td class="t-r"><div class="cell-ed" style="justify-content:flex-end;flex-wrap:wrap;gap:6px">
        ${selCobranca}${preco}</div></td>
      <td class="t-c"><div class="acoes">
        <button class="btn-del" data-del-mat="${esc(m.id)}" title="Excluir">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        </button>
      </div></td>
    </tr>`;
  }).join('');

  $('#acBody').innerHTML = ESTADO.acabamentos.map(a => `
    <tr>
      <td><div class="cell-ed"><input type="text" data-ac-nome="${esc(a.id)}" value="${esc(a.nome)}"></div></td>
      <td class="t-r"><div class="cell-ed" style="justify-content:flex-end">
        <input type="number" min="0" step="0.01" data-ac-custo="${esc(a.id)}" value="${a.custo}" style="max-width:130px"></div></td>
      <td class="t-c"><div class="acoes">
        <button class="btn-del" data-del-ac="${esc(a.id)}" title="Excluir">
          <svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>
        </button>
      </div></td>
    </tr>`).join('');
}

/* re-renderiza a tela quando os dados chegam/mudam na nuvem */
function renderTudo() {
  $('#brandNome').textContent = ESTADO.empresa.nome || 'Sua Gráfica';
  $$('.view[data-view="config"] [data-model]').forEach(el => { el.value = getEmpresa(el.dataset.model) ?? ''; });

  if (orc) {
    /* itens podem apontar para material/acabamento apagado em outro aparelho */
    orc.itens.forEach(i => {
      if (!ESTADO.materiais.some(m => m.id === i.materialId)) i.materialId = ESTADO.materiais[0]?.id || '';
      if (!ESTADO.acabamentos.some(a => a.id === i.acabamentoId)) i.acabamentoId = ESTADO.acabamentos[0]?.id || '';
    });
    $$('.view[data-view="novo"] [data-model]').forEach(el => { el.value = getPath(orc, el.dataset.model) ?? ''; });
    renderItens();
    atualizarTudo();
  }

  if ($('.view[data-view="materiais"]').classList.contains('is-active')) renderTabelasPreco();
  if ($('.view[data-view="historico"]').classList.contains('is-active')) renderHistorico();
  recarregarImagens();
}

/* =========================================================
   EVENTOS
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  orc = novoOrcamento();

  // marca / empresa
  $('#brandNome').textContent = ESTADO.empresa.nome;

  // modelos
  $$('.view[data-view="config"] [data-model]').forEach(el => {
    el.value = getEmpresa(el.dataset.model) ?? '';
  });
  $$('.view[data-view="novo"] [data-model]').forEach(el => {
    el.value = getPath(orc, el.dataset.model) ?? '';
  });

  renderItens();
  atualizarTudo();
  recarregarImagens();

  /* ---- navegação ---- */
  $('#nav').addEventListener('click', e => {
    const a = e.target.closest('.nav-item'); if (!a) return;
    e.preventDefault(); ir(a.dataset.view);
  });
  window.addEventListener('hashchange', () => ir(location.hash.slice(1)));

  /* ---- menu mobile ---- */
  $('#btnMenu').addEventListener('click', abrirMenu);
  $('#overlay').addEventListener('click', fecharMenu);

  /* ---- itens ---- */
  $('#btnAddItem').addEventListener('click', addItem);
  $('#btnAddItem2').addEventListener('click', addItem);
  $('#btnAddItem3').addEventListener('click', addItem);

  $('#items').addEventListener('click', e => {
    const d = e.target.closest('[data-del]'); if (d) {
      orc.itens.splice(+d.dataset.del, 1);
      renderItens(); atualizarTudo();
      return;
    }
    const clr = e.target.closest('[data-clear-img]');
    if (clr) {
      const item = clr.closest('.item');
      const i = +item.dataset.i;
      orc.itens[i].imagem = '';
      renderItens(); atualizarTudo();
      return;
    }
    /* atalho de quantidade: preenche o campo sem digitar */
    const q = e.target.closest('[data-qtd]'); if (q) {
      const campo = q.closest('.item').querySelector('[data-k="quantidade"]');
      campo.value = q.dataset.qtd;
      campo.dispatchEvent(new Event('input', { bubbles: true }));
      campo.focus();
    }
  });

  /* formato pronto: preenche largura e altura em metros */
  $('#items').addEventListener('change', e => {
    const upl = e.target.closest('[data-img-upload]');
    if (upl && upl.files && upl.files[0]) {
      const file = upl.files[0];
      const reader = new FileReader();
      const item = upl.closest('.item');
      const i = +item.dataset.i;
      reader.onload = ev => {
        orc.itens[i].imagem = ev.target.result;
        renderItens();
        if (typeof carregarImagem === 'function') carregarImagem(ev.target.result).then(atualizarTudo);
        else atualizarTudo();
      };
      reader.readAsDataURL(file);
      return;
    }
    const alvo = e.target.closest('[data-preset]');
    if (alvo) {
      const [l, a] = alvo.value.split('|');
      if (l) {
        const item = alvo.closest('.item');
        const i = +item.dataset.i;
        ['largura', 'altura'].forEach((k, j) => {
          const campo = item.querySelector('[data-k="' + k + '"]');
          campo.value = j === 0 ? l : a;
          campo.dispatchEvent(new Event('input', { bubbles: true }));
        });
        orc.itens[i].largura = num(l);
        orc.itens[i].altura = num(a);
        atualizarItem(i); atualizarTudo();
      }
      return;
    }
    const alvo2 = e.target.closest('[data-k]'); if (!alvo2) return;
    const i = +alvo2.closest('.item').dataset.i;
    const k = alvo2.dataset.k;
    orc.itens[i][k] = alvo2.value;
    /* trocar o material pode mudar o layout do item (material de preço fixo) */
    if (k === 'materialId') { renderItens(); atualizarTudo(); return; }
    atualizarItem(i); atualizarTudo();
  });

  $('#items').addEventListener('input', e => {
    const alvo = e.target.closest('[data-k]'); if (!alvo) return;
    const i = +alvo.closest('.item').dataset.i;
    const k = alvo.dataset.k;
    orc.itens[i][k] = (k === 'materialId' || k === 'acabamentoId') ? alvo.value : num(alvo.value);
    atualizarItem(i); atualizarTudo();
  });

  /* ---- campos gerais (data-model) ---- */
  $$('.view[data-view="novo"] [data-model]').forEach(el => {
    el.addEventListener('input', () => { setPath(orc, el.dataset.model, el.value); atualizarTudo(); });
  });

  /* ---- empresa ---- */
  $$('.view[data-view="config"] [data-model]').forEach(el => {
    el.addEventListener('input', () => {
      setEmpresa(el.dataset.model, el.value);
      $('#brandNome').textContent = ESTADO.empresa.nome || 'Sua Gráfica';
      DB.salvar(ESTADO);
      atualizarTudo();
    });
  });

  /* ---- tabela de preços ---- */
  $('#matBody').addEventListener('change', e => {
    const t = e.target;
    /* forma de cobrança: metragem (m²) x unidade (peça) */
    if (t.dataset.matCobranca !== undefined) {
      const m = ESTADO.materiais.find(x => x.id === t.dataset.matCobranca); if (!m) return;
      if (t.value === 'un') {
        if (!(num(m.precoFixo) > 0)) m.precoFixo = Math.max(0, num(m.preco)) || 1;
        if (!(num(m.largura) > 0)) m.largura = 1;
        if (!(num(m.altura) > 0)) m.altura = 1;
      } else {
        if (!(num(m.preco) > 0)) m.preco = Math.max(0, num(m.precoFixo)) || 0;
        m.precoFixo = 0;
      }
      DB.salvar(ESTADO); renderTabelasPreco(); renderItens(); atualizarTudo();
      return;
    }
    /* upload de imagem do produto */
    if (t.dataset.matUpload !== undefined) {
      const file = t.files && t.files[0]; if (!file) return;
      const m = ESTADO.materiais.find(x => x.id === t.dataset.matUpload); if (!m) return;
      const reader = new FileReader();
      reader.onload = ev => {
        m.img = ev.target.result;
        DB.salvar(ESTADO); renderTabelasPreco(); recarregarImagens();
        toast('Imagem do produto atualizada.', 'ok');
      };
      reader.readAsDataURL(file);
    }
  });

  $('#matBody').addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.matNome !== undefined) {
      const m = ESTADO.materiais.find(x => x.id === t.dataset.matNome); if (m) m.nome = t.value;
    }
    if (t.dataset.matPreco !== undefined) {
      const m = ESTADO.materiais.find(x => x.id === t.dataset.matPreco); if (m) m.preco = Math.max(0, num(t.value));
    }
    if (t.dataset.matFixo !== undefined) {
      const m = ESTADO.materiais.find(x => x.id === t.dataset.matFixo); if (m) m.precoFixo = Math.max(0, num(t.value));
    }
    if (t.dataset.matFaixa !== undefined) {
      const [id, faixa] = t.dataset.matFaixa.split(':');
      const m = ESTADO.materiais.find(x => x.id === id); if (!m) return;
      m.faixaPreco = m.faixaPreco || {};
      if (t.value === '') delete m.faixaPreco[faixa];
      else m.faixaPreco[faixa] = Math.max(0, num(t.value));
    }
    if (t.dataset.matImg !== undefined) {
      const m = ESTADO.materiais.find(x => x.id === t.dataset.matImg);
      if (!m) return;
      const antes = imgDe(m.id);
      m.img = t.value.trim();
      const tr = t.closest('tr');
      const fig = $('.thumb', tr);
      if (fig && imgDe(m.id) !== antes) fig.src = imgDe(m.id);
      DB.salvar(ESTADO);
      $$('.item [data-thumb]').forEach(f => {
        const it = orc.itens[+f.closest('.item').dataset.i];
        if (it) f.src = imgDe(it.materialId);
      });
      recarregarImagens();
      return;
    }
    DB.salvar(ESTADO); renderItens(); atualizarTudo();
  });

  /* ---- fallback quando a imagem não existe ---- */
  document.addEventListener('error', e => {
    const t = e.target;
    const padrao = urlFigura('default.svg') || IMG_PADRAO;
    if (t.tagName === 'IMG' && t.dataset.fallback !== '1' && t.src !== padrao) {
      t.dataset.fallback = '1';
      t.src = padrao;
    }
  }, true);
  $('#acBody').addEventListener('input', e => {
    const t = e.target;
    if (t.dataset.acNome !== undefined) {
      const a = ESTADO.acabamentos.find(x => x.id === t.dataset.acNome); if (a) a.nome = t.value;
    }
    if (t.dataset.acCusto !== undefined) {
      const a = ESTADO.acabamentos.find(x => x.id === t.dataset.acCusto); if (a) a.custo = Math.max(0, num(t.value));
    }
    DB.salvar(ESTADO); renderItens(); atualizarTudo();
  });

  document.addEventListener('click', e => {
    const dm = e.target.closest('[data-del-mat]');
    if (dm) {
      if (ESTADO.materiais.length <= 1) return toast('É preciso manter ao menos 1 material.', 'err');
      ESTADO.materiais = ESTADO.materiais.filter(m => m.id !== dm.dataset.delMat);
      orc.itens.forEach(i => { if (!ESTADO.materiais.some(m => m.id === i.materialId)) i.materialId = ESTADO.materiais[0].id; });
      DB.salvar(ESTADO); renderTabelasPreco(); renderItens(); atualizarTudo(); recarregarImagens();
      return;
    }
    const da = e.target.closest('[data-del-ac]');
    if (da) {
      if (ESTADO.acabamentos.length <= 1) return toast('É preciso manter ao menos 1 acabamento.', 'err');
      ESTADO.acabamentos = ESTADO.acabamentos.filter(a => a.id !== da.dataset.delAc);
      orc.itens.forEach(i => { if (!ESTADO.acabamentos.some(a => a.id === i.acabamentoId)) i.acabamentoId = ESTADO.acabamentos[0].id; });
      DB.salvar(ESTADO); renderTabelasPreco(); renderItens(); atualizarTudo();
      return;
    }
    const ab = e.target.closest('[data-abrir]');
    if (ab) {
      const achado = ESTADO.orcamentos.find(o => o.id === ab.dataset.abrir);
      if (achado) { carregar(achado); ir('novo'); toast('Orçamento carregado.', 'ok'); }
      return;
    }
    const ex = e.target.closest('[data-excluir]');
    if (ex) {
      if (!confirm('Excluir este orçamento?')) return;
      ESTADO.orcamentos = ESTADO.orcamentos.filter(o => o.id !== ex.dataset.excluir);
      DB.salvar(ESTADO); renderHistorico();
      return;
    }
  });

  $('#btnAddMat').addEventListener('click', () => {
    ESTADO.materiais.push({ id: 'm' + Date.now(), nome: 'Novo material', preco: 0, precoFixo: 0, largura: 1, altura: 1, img: IMG_PADRAO });
    DB.salvar(ESTADO); renderTabelasPreco(); recarregarImagens();
    const ul = $$('#matBody tr').pop(); if (ul) $('[data-mat-nome]', ul).focus();
  });

  $('#buscaHist').addEventListener('input', renderHistorico);

  /* ---- botões principais ---- */
  $('#btnPrint').addEventListener('click', gerarImagem);
  $('#btnSalvarGerar').addEventListener('click', salvarEgerar);
  $('#btnPrintTop').addEventListener('click', gerarImagem);
  $('#btnSalvar').addEventListener('click', () => salvarOrcamento(false));
  $('#btnLimpar').addEventListener('click', () => {
    if (!confirm('Limpar todos os campos do orçamento atual?')) return;
    orc = novoOrcamento();
    $$('.view[data-view="novo"] [data-model]').forEach(el => { el.value = getPath(orc, el.dataset.model) ?? ''; });
    renderItens(); atualizarTudo(); toast('Campos limpos.');
  });

  $('#btnReset').addEventListener('click', () => {
    if (!confirm('Isso apaga TODOS os dados salvos (orçamentos, materiais e empresa). Continuar?')) return;
    DB.limpar();
    location.reload();
  });

  /* ---- atalhos ---- */
  document.addEventListener('keydown', e => {
    if (!(e.ctrlKey || e.metaKey)) return;
    if (e.key === 's') { e.preventDefault(); salvarOrcamento(); }
    if (e.key === 'p') { e.preventDefault(); gerarImagem(); }
  });

  ir(location.hash.slice(1) || 'novo');

  /* conecta ao banco na nuvem (se configurado) e re-renderiza ao receber dados */
  DB.iniciarCloud(renderTudo).then(ok => {
    if (ok) toast('Sincronizado com a nuvem.', 'ok');
  });
});

/* ---------- AÇÕES ---------- */
function addItem() {
  orc.itens.push(novoItem());
  renderItens();
  atualizarTudo();
  const el = $(`.item[data-i="${orc.itens.length - 1}"]`);
  if (el) { el.scrollIntoView({ behavior:'smooth', block:'center' }); $('input', el)?.focus(); }
}

async function gerarImagem(silencioso) {
  const botoes = [$('#btnPrint'), $('#btnPrintTop'), $('#btnSalvarGerar')];
  const textos = botoes.map(b => b.innerHTML);
  botoes.forEach(b => { b.disabled = true; b.innerHTML = 'Gerando...'; });
  try {
    const { nome, aviso } = await baixarImagem({ ...orc, empresa: ESTADO.empresa });
    if (!silencioso) toast('Imagem gerada: ' + nome + aviso, aviso ? 'err' : 'ok');
    return true;
  } catch (err) {
    console.error(err);
    if (!silencioso) toast('Não foi possível gerar a imagem.', 'err');
    return false;
  } finally {
    botoes.forEach((b, i) => { b.disabled = false; b.innerHTML = textos[i]; });
  }
}

function salvarOrcamento(silencioso) {
  if (!orc.cliente.nome.trim()) { if (!silencioso) toast('Informe o nome do cliente.', 'err'); return false; }
  if (!orc.itens.length) { if (!silencioso) toast('Adicione ao menos um item.', 'err'); return false; }

  const t = calcular(orc, ESTADO.materiais, ESTADO.acabamentos);
  const reg = {
    id: orc.id || 'o' + Date.now(),
    numero: orc.numero,
    data: orc.data,
    cliente: { ...orc.cliente },
    itens: orc.itens.map(i => ({ ...i })),
    descontoTipo: orc.descontoTipo, descontoValor: num(orc.descontoValor), frete: num(orc.frete),
    validadeDias: num(orc.validadeDias),
    condicaoPagamento: orc.condicaoPagamento, prazoEntrega: orc.prazoEntrega,
    observacoes: orc.observacoes,
    areaTotal: t.areaTotal, subtotal: t.subtotal, total: t.total,
    salvoEm: new Date().toISOString()
  };

  const i = ESTADO.orcamentos.findIndex(o => o.id === reg.id);
  if (i >= 0) ESTADO.orcamentos[i] = reg; else ESTADO.orcamentos.push(reg);

  ESTADO.sequencia += 1;
  /* guarda cliente e condicao para o proximo orcamento ja sair preenchido */
  ESTADO.ultimoCliente = {
    nome: orc.cliente.nome,
    condicaoPagamento: orc.condicaoPagamento,
    prazoEntrega: orc.prazoEntrega
  };
  DB.salvar(ESTADO);
  $('#badgeHist').textContent = ESTADO.orcamentos.length;

  orc.id = reg.id;
  if (!silencioso) toast('Orçamento ' + reg.numero + ' salvo.', 'ok');
  return true;
}

/* fecha o processo num clique: salva no historico e gera o PNG */
async function salvarEgerar() {
  if (!salvarOrcamento(true)) {
    toast(!orc.cliente.nome.trim() ? 'Informe o nome do cliente.' : 'Adicione ao menos um item.', 'err');
    return;
  }
  toast('Orçamento ' + orc.numero + ' salvo.', 'ok');
  const okImg = await gerarImagem(true);
  toast(okImg ? 'Pronto! Imagem gerada e orçamento salvo.' : 'Orçamento salvo, mas a imagem não saiu.', okImg ? 'ok' : 'err');
}

function carregar(reg) {
  orc = {
    id: reg.id,
    numero: reg.numero, data: reg.data,
    cliente: Object.assign({ nome:'', documento:'', telefone:'', email:'', endereco:'' }, reg.cliente || {}),
    itens: (reg.itens || []).map(i => Object.assign(novoItem(), i)),
    descontoTipo: reg.descontoTipo || 'percentual',
    descontoValor: reg.descontoValor || 0,
    frete: reg.frete || 0,
    validadeDias: reg.validadeDias || 15,
    condicaoPagamento: reg.condicaoPagamento || '',
    prazoEntrega: reg.prazoEntrega || '',
    observacoes: reg.observacoes || ''
  };
  $$('.view[data-view="novo"] [data-model]').forEach(el => { el.value = getPath(orc, el.dataset.model) ?? ''; });
  renderItens();
  atualizarTudo();
}