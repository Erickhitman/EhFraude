const $ = (s, r = document) => r.querySelector(s);
const page = document.body.dataset.page;
const nivel = (xp) => Math.floor(xp / 100) + 1;
const h = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt !== undefined) e.textContent = txt; return e; };
const lista = (ul, itens) => ul.replaceChildren(...itens.map((t) => h('li', '', t)));

(() => {
  const tr = $('.topbar-right'); if (!tr) return;
  const u = Session.get(), raiz = page === 'inicio' ? '' : '../';
  const a = h('a', 'topbar-badge', u ? u.nome.split(' ')[0] : 'Entrar');
  a.href = raiz + (u ? 'Perfil/EhFraude-perfil.html' : 'login/login.html'); a.style.textDecoration = 'none';
  tr.append(a);
})();

const PAGES = {
  /* ---------- Verificador ---------- */
  inicio() {
    const card = $('#ind-card'), btn = $('#btn-analisar'), erro = $('#erro-form'), link = $('#link-input'), msg = $('#message-input');
    const ESTADO = { GOLPE: ['danger', 'Provável golpe'], SUSPEITO: ['warn', 'Atenção: suspeito'], SEGURO: ['safe', 'Parece seguro'] };
    const marca = () => { $('#tc-link').classList.toggle('on', !!link.value.trim()); $('#tc-texto').classList.toggle('on', !!msg.value.trim()); };
    link.addEventListener('input', marca); msg.addEventListener('input', marca);
    link.addEventListener('keydown', (e) => { if (e.key === 'Enter') btn.click(); });
    btn.addEventListener('click', async () => {
      erro.textContent = '';
      const l = link.value.trim(), m = msg.value.trim();
      if (!l && !m) { erro.textContent = 'Cole um link ou uma mensagem para analisar.'; return; }
      if (!$('#termos').checked) { erro.textContent = 'Aceite os termos de uso para continuar.'; return; }
      btn.disabled = true; const rotulo = btn.innerHTML; btn.textContent = 'Analisando…';
      card.className = 'indicator-card is-loading'; $('#ind-pct').hidden = true; $('#ind-dash').hidden = false;
      $('#ind-title').textContent = 'Analisando…'; $('#ind-sub').textContent = 'Isso leva alguns segundos'; $('#ind-detalhes').hidden = true;
      try {
        const r = await API.analisar(l, m), [cls, titulo] = ESTADO[r.classificacao] || ESTADO.SUSPEITO;
        card.className = 'indicator-card is-' + cls;
        $('#ind-dash').hidden = true; $('#ind-pct').hidden = false; $('#ind-pct').textContent = r.probabilidade + '%';
        $('#ind-title').textContent = titulo; $('#ind-sub').textContent = 'Chance de fraude: ' + r.probabilidade + '%';
        lista($('#ind-sinais'), r.indicios); lista($('#ind-acoes'), r.recomendacoes); $('#ind-detalhes').hidden = false;
        const s = Store.get(); s.verif++; if (r.classificacao === 'GOLPE') s.evit++; Store.set(s);
      } catch (e) {
        card.className = 'indicator-card'; $('#ind-title').textContent = 'Não foi possível analisar'; $('#ind-sub').textContent = ''; erro.textContent = e.message;
      }
      btn.disabled = false; btn.innerHTML = rotulo;
    });
  },

  /* ---------- Modo de treino ---------- */
  treino() {
    const TOTAL = 10, LETRAS = 'ABCD', $q = $('#quiz-options'), btn = $('#btn-next'), fb = $('#fb'), toast = $('#xp-toast');
    let d, t0, n = 0, acertos = 0, travado = true, fim = false;
    const pinta = () => {
      const s = Store.get();
      $('#xp-val').textContent = s.xp + ' XP'; $('#lv-badge').textContent = 'Nível ' + nivel(s.xp);
      $('#s-hoje').textContent = s.hoje.acertos; $('#s-seq').textContent = '🔥 ' + s.seq; $('#s-xp').textContent = s.xp; $('#s-nivel').textContent = nivel(s.xp);
    };
    const prog = (feitos) => { $('#prog-label').textContent = `Desafio ${n} de ${TOTAL}`; $('#prog-fill').style.width = feitos / TOTAL * 100 + '%'; };
    async function carregar() {
      travado = true; fim = false; fb.hidden = true; toast.hidden = true; btn.disabled = true;
      n++; prog(n - 1); $q.replaceChildren(); $('#msg-sender').textContent = ''; $('#msg-bubble').textContent = 'Gerando desafio…';
      try { d = await API.desafio(nivel(Store.get().xp)); } catch (e) { $('#msg-bubble').textContent = e.message; btn.disabled = false; n--; return; }
      $('#msg-sender').textContent = 'De: ' + d.remetente; $('#msg-bubble').textContent = '“' + d.mensagem + '”'; $('.quiz-question').textContent = d.pergunta;
      d.opcoes.forEach((o, i) => {
        const op = h('div', 'quiz-opt'); op.tabIndex = 0; op.setAttribute('role', 'button');
        op.append(h('div', 'opt-bullet', LETRAS[i]), h('span', '', o));
        const ir = () => responder(i, op);
        op.onclick = ir; op.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); ir(); } };
        $q.append(op);
      });
      travado = false; t0 = Date.now();
    }
    async function responder(i, op) {
      if (travado) return; travado = true;
      let r;
      try { r = await API.responder(d.id, i, Date.now() - t0); }
      catch (e) { travado = false; fb.className = 'feedback-card err'; $('#fb-title').textContent = 'Erro de conexão'; $('#fb-text').textContent = e.message; fb.hidden = false; return; }
      const ops = [...$q.children]; ops.forEach((x) => x.classList.add('locked'));
      ops[r.indiceCorreto].classList.add('correct'); if (!r.acertou) op.classList.add('wrong');
      const s = Store.get();
      if (r.acertou) { acertos++; s.acertos++; s.hoje.acertos++; s.seq++; s.xp += r.xp; } else { s.erros++; s.seq = 0; }
      Store.set(s);
      fb.className = 'feedback-card ' + (r.acertou ? 'ok' : 'err');
      $('#fb-title').textContent = r.acertou ? 'Correto!' : 'Não foi dessa vez'; $('#fb-text').textContent = r.explicacao; fb.hidden = false;
      if (r.acertou) {
        $('#xp-t1').textContent = 'Resposta correta!'; $('#xp-t2').textContent = `Faltam ${100 - s.xp % 100} XP para o nível ${nivel(s.xp) + 1}`;
        $('#xp-big').textContent = '+' + r.xp + ' XP'; toast.hidden = false;
      }
      pinta(); prog(n); btn.disabled = false;
      if (n >= TOTAL) { fim = true; btn.textContent = 'Ver resultado'; }
    }
    btn.onclick = () => {
      if (!fim) return carregar();
      if (btn.textContent === 'Ver resultado') {
        toast.hidden = true; fb.className = 'feedback-card ok';
        $('#fb-title').textContent = `Rodada concluída: ${acertos} de ${TOTAL} acertos`;
        $('#fb-text').textContent = acertos >= 7 ? 'Ótimo olho! Você já reconhece boa parte dos golpes.' : 'Continue treinando: cada rodada ensina um sinal novo.';
        fb.hidden = false; btn.textContent = 'Nova rodada'; return;
      }
      n = 0; acertos = 0; btn.textContent = 'Próximo desafio'; carregar();
    };
    pinta(); carregar();
  },

  /* ---------- Notícias ---------- */
  async noticias() {
    const grid = $('#news-grid'), fil = $('#news-filters'); let todas = [], tag = 'Todas';
    const card = (n) => {
      const a = h('article', 'news-card'), t = h('div', 'news-thumb'), img = h('img', /voz/.test(n.imagem) ? 'voz' : 'img');
      img.src = '../Imagens/' + n.imagem; img.alt = n.tag; t.append(img);
      const b = h('div', 'news-body'); b.append(h('span', 'news-tag', n.tag), h('h3', 'news-title', n.titulo), h('p', 'news-desc', n.descricao), h('p', 'news-meta', n.atualizado));
      a.append(t, b); return a;
    };
    const pinta = () => grid.replaceChildren(...todas.filter((n) => tag === 'Todas' || n.tag === tag).map(card));
    grid.textContent = 'Carregando notícias…';
    try { todas = await API.noticias(); } catch (e) { grid.textContent = e.message; return; }
    fil.replaceChildren(...['Todas', ...new Set(todas.map((n) => n.tag))].map((t) => {
      const b = h('button', 'chip', t); b.type = 'button'; b.setAttribute('aria-pressed', t === tag);
      b.onclick = () => { tag = t; [...fil.children].forEach((x) => x.setAttribute('aria-pressed', x === b)); pinta(); };
      return b;
    }));
    pinta();
  },

  /* ---------- Perfil ---------- */
  perfil() {
    const u = Session.get(); if (!u) { location.href = '../login/login.html'; return; }
    const s = Store.get(), ini = u.nome.split(' ').map((p) => p[0]).slice(0, 2).join('').toUpperCase();
    $('#p-avatar').textContent = ini; $('#p-nome').textContent = u.nome; $('#p-email').textContent = `${u.email} · membro desde ${u.desde}`;
    $('#v-verif').textContent = s.verif; $('#v-evit').textContent = s.evit; $('#v-nivel').textContent = 'Nível ' + nivel(s.xp);
    $('#d-nome').textContent = u.nome; $('#d-email').textContent = u.email; $('#d-tel').textContent = u.telefone; $('#d-desde').textContent = u.desde;
    $('#btn-sair').onclick = () => { Session.clear(); location.href = '../login/login.html'; };
  }
};
if (PAGES[page]) PAGES[page]();
