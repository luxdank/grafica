/* =========================================================
   db.js — persistência (localStorage) + sincronização em nuvem (Firestore)
   ========================================================= */
const DB = (() => {
  const KEY = 'grafica_orcamentos_v2';
  const IMG_DIR = 'img/materiais/';

  /* materiais com `preco` são cobrados por m²; os que tem `precoFixo` são
     cobrados por peça (o tamanho e o valor já vêm definidos no material) */
      const MATERIALIAIS_PADRAO = [
    { id: 'm1',  nome: 'Banner 280gr',           preco: 0, img: IMG_DIR + 'm1.svg' },
    { id: 'm2',  nome: 'Banner 440gr',           preco: 0, img: IMG_DIR + 'm2.svg' },
    { id: 'm3',  nome: 'Adesivo redondo',        preco: 0, img: IMG_DIR + 'm3.svg' },
    { id: 'm4',  nome: 'Wind Banner 150x50 cm',  precoFixo: 0, largura: 1.5,  altura: 0.5,  img: IMG_DIR + 'm4.svg' },
    { id: 'm5',  nome: 'Wind Banner 200x70 cm',  precoFixo: 0, largura: 2.0,  altura: 0.7,  img: IMG_DIR + 'm5.svg' },
    { id: 'm6',  nome: 'Wind Banner 250x75 cm',  precoFixo: 0, largura: 2.5,  altura: 0.75, img: IMG_DIR + 'm6.svg' },
    { id: 'm7',  nome: 'Papel Fotográfico 260g', preco: 3.2, img: IMG_DIR + 'm7.svg' },
    { id: 'm8',  nome: 'Adesivo Vinil',          preco: 4.5, img: IMG_DIR + 'm8.svg' },
    { id: 'm9',  nome: 'Lona Banner 440g',       preco: 6.9, img: IMG_DIR + 'm9.svg' },
    { id: 'm10', nome: 'Cartolina 350g',         preco: 1.6, img: IMG_DIR + 'm10.svg' },
    { id: 'cam1', nome: 'Camisa Dry Fit UV 35 Masculina — Sublimação Total', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 49.00, '7': 39.00, '>20': 36.00 }, metodo: 'sublimacao_total', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam2', nome: 'Camisa Dry Fit UV 35 Feminina — Sublimação Total', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 49.00, '7': 39.00, '>20': 35.00 }, metodo: 'sublimacao_total', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam3', nome: 'Regata Masculina — Sublimação Total', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 47.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_total', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam4', nome: 'Regata Feminina — Sublimação Total', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 47.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_total', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam5', nome: 'Camisa Machão — Sublimação Total', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 47.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_total', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam6', nome: 'Camisa Manga Longa UV 50 — Sublimação Total', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 97.00, '7': 87.00, '>20': 79.00 }, metodo: 'sublimacao_total', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam7', nome: 'Camisa de Algodão — Sublimação Local A4 (Verso)', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 42.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_local_a4_verso', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam8', nome: 'Camisa de Poliéster — Sublimação Local A4 (Verso)', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 42.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_local_a4_verso', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam9', nome: 'Camisa de Algodão — Sublimação Local A3 (Verso)', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 47.00, '7': 42.00, '>20': 39.00 }, metodo: 'sublimacao_local_a3_verso', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam10', nome: 'Camisa de Poliéster — Sublimação Local', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 42.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_local', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam11', nome: 'Camisa Dry Fit — Sublimação Local', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: { '1': 42.00, '7': 37.00, '>20': 35.00 }, metodo: 'sublimacao_local', img: IMG_DIR + 'camisa.svg' },
    { id: 'cam12', nome: 'Camisa Manga Longa — Personalização DTF', preco: 0, precoFixo: 0, tipo: 'camisa', faixaPreco: null, metodo: 'dtf', img: IMG_DIR + 'camisa.svg' }
  ];

  const ACABAMENTOS_PADRAO = [
    { id: 'a0', nome: 'Sem acabamento',       custo: 0 },
    { id: 'a1', nome: 'Recorte / refile',    custo: 0.30 },
    { id: 'a2', nome: 'Vinco / dobra',       custo: 0.45 },
    { id: 'a3', nome: 'Reforço com fita',    custo: 0.90 },
    { id: 'a4', nome: 'Laminação BOPP',      custo: 1.20 },
    { id: 'a5', nome: 'Laminação Fosca',     custo: 1.80 },
    { id: 'a6', nome: 'Hot stamping',        custo: 2.50 }
  ];

  const EMPRESA_PADRAO = {
    nome: 'Sua Gráfica',
    cnpj: '00.000.000/0000-00',
    telefone: '(00) 0000-0000',
    email: 'contato@sugrafica.com.br',
    site: 'www.sugrafica.com.br',
    endereco: 'Rua Exemplo, 123 - Centro, São Paulo/SP, 00000-000',
    prefixoNumero: 'ORC'
  };

  /* Formatos prontos em metros: evita a conta de cm para m em cada item.
     [rotulo, largura, altura] */
  const FORMATOS = [
    ['A4',            '0.210', '0.297'],
    ['A3',            '0.297', '0.420'],
    ['A5',            '0.148', '0.210'],
    ['A2',            '0.420', '0.594'],
    ['Crachá',        '0.050', '0.080'],
    ['Crachá frente', '0.054', '0.086'],
    ['Foto 10×15',    '0.100', '0.150'],
    ['Folder A4',     '0.220', '0.310'],
    ['1 × 1 m',       '1.000', '1.000'],
    ['2 × 1 m',       '2.000', '1.000'],
    ['0,5 × 1 m',     '0.500', '1.000'],
    ['Adesivo 4×4 cm',  '0.040', '0.040'],
    ['Adesivo 5×5 cm',  '0.050', '0.050'],
    ['Adesivo 6×6 cm',  '0.060', '0.060'],
    ['Adesivo 7×7 cm',  '0.070', '0.070'],
    ['Adesivo 8×8 cm',  '0.080', '0.080'],
    ['Adesivo 9×9 cm',  '0.090', '0.090'],
    ['Adesivo 10×10 cm', '0.100', '0.100'],
    ['Adesivo 11×11 cm', '0.110', '0.110']
  ];

  /* =========================================================
     ESTADO EM MEMÓRIA
     Uma única referência estável, compartilhada com o app.js
     (app.js guarda `let ESTADO = DB.estado()`). A nuvem atualiza
     os mesmos campos aqui dentro, sem trocar o objeto.
     ========================================================= */
  let ESTADO = null;

  function padrao() {
    return {
      empresa: { ...EMPRESA_PADRAO },
      materiais: MATERIALIAIS_PADRAO.map(m => ({ ...m })),
      acabamentos: ACABAMENTOS_PADRAO.map(a => ({ ...a })),
      orcamentos: [],
      sequencia: 1,
      ultimoCliente: null
    };
  }

  /* materiais salvos antes das ilustracoes existirem: herdam a figura do
     material padrao equivalente (por id e, em caso de id diferente, por nome) */
  function semAcento(s) {
    return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  }

  function imgPadraoDe(material, base) {
    if (material && typeof material.img === 'string' && material.img.trim()) return material.img.trim();
    if (material && base) {
      const porId = base.find(b => b.id === material.id);
      if (porId && porId.img) return porId.img;
      const nome = semAcento(material.nome);
      const porNome = base.find(b => semAcento(b.nome) === nome);
      if (porNome && porNome.img) return porNome.img;
    }
    return IMG_DIR + 'default.svg';
  }

  /* mescla materiais salvos com os padrões: garante que produtos novos do
     catálogo apareçam também em quem já tinha dados salvos (mantém renomeações
     e preços editados do usuário para os mesmos ids) */
  function mesclarMateriais(salvos) {
    const base = MATERIALIAIS_PADRAO;
    if (!Array.isArray(salvos) || !salvos.length) return base.map(m => ({ ...m }));
    const porId = new Map(salvos.map(m => [m.id, m]));
    const idsBase = new Set(base.map(m => m.id));
    const extras = salvos.filter(m => !idsBase.has(m.id)).map(m => ({ ...m }));
    const mesclados = base.map(b => {
      const s = porId.get(b.id);
      if (!s) return { ...b };
      /* o usuário mantém nome/preços editados; campos de catálogo novos
         (tipo, faixaPreco, metodo) vêm do padrão quando o salvo não tem */
      return Object.assign({}, b, s, {
        tipo: s.tipo || b.tipo,
        metodo: s.metodo || b.metodo,
        faixaPreco: s.faixaPreco !== undefined ? s.faixaPreco : b.faixaPreco
      });
    });
    return mesclados.concat(extras);
  }

  function montarEstado(salvo) {
    const base = padrao();
    return {
      empresa: Object.assign({}, base.empresa, salvo.empresa || {}),
      materiais: Array.isArray(salvo.materiais) && salvo.materiais.length
        ? mesclarMateriais(salvo.materiais).map(m => Object.assign({}, m, { img: imgPadraoDe(m, base.materiais) }))
        : base.materiais,
      acabamentos: Array.isArray(salvo.acabamentos) && salvo.acabamentos.length ? salvo.acabamentos : base.acabamentos,
      orcamentos: Array.isArray(salvo.orcamentos) ? salvo.orcamentos : [],
      ultimoCliente: salvo.ultimoCliente && salvo.ultimoCliente.nome ? salvo.ultimoCliente : null,
      sequencia: typeof salvo.sequencia === 'number' ? salvo.sequencia : 1
    };
  }

  function lerLocal() {
    try { return JSON.parse(localStorage.getItem(KEY)) || {}; }
    catch { return {}; }
  }

  function salvarLocal(estado) {
    try { localStorage.setItem(KEY, JSON.stringify(estado)); return true; }
    catch (e) { console.error('Falha ao salvar:', e); return false; }
  }

  function estado() {
    if (!ESTADO) ESTADO = montarEstado(lerLocal());
    return ESTADO;
  }

  /* =========================================================
     API PÚBLICA (mantém os nomes usados pelo app.js)
     ========================================================= */
  function salvar(estado) {
    ESTADO = estado;
    salvarLocal(estado);
    agendarEnvio();
  }

  function limpar() {
    localStorage.removeItem(KEY);
    ESTADO = null;
    limparNuvem();
  }

  /* =========================================================
     NUVEM (Firestore) — opcional, ativado por firebase-config.js
     ========================================================= */
  let _fs = null;
  let _auth = null;
  let _onRemoto = null;   // callback chamado quando a nuvem muda os dados
  let _envioTimer = null; // debounce de escrita
  let _pronto = false;    // conexão estabelecida
  let _assinaturaOrcs = '';

  function cloudAtivo() {
    return typeof FIREBASE_ATIVO !== 'undefined' && FIREBASE_ATIVO === true &&
           typeof firebase !== 'undefined' && !!firebase &&
           typeof FIREBASE_CONFIG !== 'undefined' && !!FIREBASE_CONFIG.projectId;
  }

  function notificar() { if (typeof _onRemoto === 'function') _onRemoto(); }

  /* --- leitura inicial --- */
  async function carregarInicial() {
    const cfg = await _fs.doc('config/estado').get();
    if (cfg.exists) aplicarConfig(cfg.data());
    const orcs = await _fs.collection('orcamentos').get();
    ESTADO.orcamentos = orcs.docs.map(d => ({ id: d.id, ...d.data() }));
    _assinaturaOrcs = assinaturaOrcamentos();
    salvarLocal(ESTADO);
    /* primeira vez no projeto: sobe o estado padrão para a nuvem */
    if (!cfg.exists) await enviarEstado();
  }

  /* --- listeners em tempo real --- */
  function ouvirConfig() {
    _fs.doc('config/estado').onSnapshot(snap => {
      if (!snap.exists || snap.metadata.hasPendingWrites) return;
      if (aplicarConfigSeMudou(snap.data())) { salvarLocal(ESTADO); notificar(); }
    });
  }

  function ouvirOrcamentos() {
    _fs.collection('orcamentos').onSnapshot(snap => {
      if (snap.metadata.hasPendingWrites) return;
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (JSON.stringify(lista) === JSON.stringify(ESTADO.orcamentos)) return;
      ESTADO.orcamentos = lista;
      salvarLocal(ESTADO);
      notificar();
    });
  }

  /* --- aplicar dados vindos da nuvem --- */
  function aplicarConfig(d) {
    if (!d) return;
    if (d.empresa) ESTADO.empresa = Object.assign({}, EMPRESA_PADRAO, d.empresa);
    if (Array.isArray(d.materiais) && d.materiais.length) {
      ESTADO.materiais = mesclarMateriais(d.materiais).map(m => Object.assign({}, m, { img: imgPadraoDe(m, MATERIALIAIS_PADRAO) }));
    }
    if (Array.isArray(d.acabamentos) && d.acabamentos.length) ESTADO.acabamentos = d.acabamentos.map(a => ({ ...a }));
    if (typeof d.sequencia === 'number') ESTADO.sequencia = d.sequencia;
    ESTADO.ultimoCliente = d.ultimoCliente || null;
  }

  /* só sinaliza mudança se algo realmente diferente chegou (evita
     re-renderizar a tela por causa do eco das nossas próprias escritas) */
  function aplicarConfigSeMudou(d) {
    const antes = JSON.stringify([ESTADO.empresa, ESTADO.materiais, ESTADO.acabamentos, ESTADO.sequencia, ESTADO.ultimoCliente]);
    aplicarConfig(d);
    const depois = JSON.stringify([ESTADO.empresa, ESTADO.materiais, ESTADO.acabamentos, ESTADO.sequencia, ESTADO.ultimoCliente]);
    return antes !== depois;
  }

  /* --- escrita --- */
  function agendarEnvio() {
    if (!_pronto) return;
    clearTimeout(_envioTimer);
    _envioTimer = setTimeout(enviarEstado, 700);
  }

  async function enviarEstado() {
    if (!_pronto || !_fs) return;
    try {
      await _fs.doc('config/estado').set({
        empresa: ESTADO.empresa,
        materiais: ESTADO.materiais,
        acabamentos: ESTADO.acabamentos,
        sequencia: ESTADO.sequencia,
        ultimoCliente: ESTADO.ultimoCliente || null,
        atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      await sincronizarOrcamentos();
    } catch (e) {
      console.error('Falha ao enviar para a nuvem:', e);
    }
  }

  function assinaturaOrcamentos() {
    return JSON.stringify(ESTADO.orcamentos.map(o => `${o.id}:${o.salvoEm || ''}`));
  }

  /* envia apenas quando os orçamentos mudaram (evita reescrever tudo a cada tecla) */
  async function sincronizarOrcamentos() {
    if (!_pronto || !_fs) return;
    const assinatura = assinaturaOrcamentos();
    if (assinatura === _assinaturaOrcs) return;
    try {
      const snap = await _fs.collection('orcamentos').get();
      const remoto = new Set(snap.docs.map(d => d.id));
      const ids = new Set(ESTADO.orcamentos.map(o => o.id));
      const lote = _fs.batch();
      ESTADO.orcamentos.forEach(o => {
        const { id, ...dados } = o;
        lote.set(_fs.collection('orcamentos').doc(id), dados, { merge: true });
      });
      remoto.forEach(id => { if (!ids.has(id)) lote.delete(_fs.collection('orcamentos').doc(id)); });
      await lote.commit();
      _assinaturaOrcs = assinatura;
    } catch (e) {
      console.error('Falha ao sincronizar orçamentos:', e);
    }
  }

  /* --- apagar tudo também na nuvem --- */
  function limparNuvem() {
    if (!_pronto || !_fs) return;
    _assinaturaOrcs = '';
    const b = _fs.batch();
    b.set(_fs.doc('config/estado'), {
      empresa: { ...EMPRESA_PADRAO },
      materiais: MATERIALIAIS_PADRAO.map(m => ({ ...m })),
      acabamentos: ACABAMENTOS_PADRAO.map(a => ({ ...a })),
      sequencia: 1,
      ultimoCliente: null,
      atualizadoEm: firebase.firestore.FieldValue.serverTimestamp()
    });
    _fs.collection('orcamentos').get().then(s => {
      s.docs.forEach(d => b.delete(d.ref));
      return b.commit();
    }).catch(e => console.error('Falha ao limpar a nuvem:', e));
  }

  /* --- inicialização (chamada pelo app.js) --- */
  async function iniciarCloud(onRemoto) {
    _onRemoto = onRemoto || null;
    if (!cloudAtivo()) return false;
    try {
      if (!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
      _fs = firebase.firestore();
      _auth = firebase.auth();
      await _auth.signInAnonymously();
      _pronto = true;
      await carregarInicial();
      ouvirConfig();
      ouvirOrcamentos();
      notificar();
      return true;
    } catch (e) {
      console.error('Nuvem indisponível, seguindo apenas com dados locais:', e);
      _fs = null; _auth = null; _pronto = false;
      return false;
    }
  }

  return { estado, salvar, limpar, iniciarCloud, cloudAtivo, KEY, IMG_DIR, FORMATOS };
})();
