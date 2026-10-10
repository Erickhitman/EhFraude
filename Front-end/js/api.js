/* Sessão */
const Session = {
  get() {
    for (const st of [sessionStorage, localStorage]) {
      try {
        const v = JSON.parse(st.getItem("ehf_user"));
        if (v) return v;
      } catch {}
    }
    return null;
  },
  set(u, lembrar = true) {
    Session.clear();
    try {
      (lembrar ? localStorage : sessionStorage).setItem(
        "ehf_user",
        JSON.stringify(u),
      );
    } catch {}
  },
  clear() {
    for (const st of [sessionStorage, localStorage]) {
      try {
        st.removeItem("ehf_user");
      } catch {}
    }
  },
};

/* Progresso */
const Store = {
  padrao: () => ({
    xp: 0,
    acertos: 0,
    erros: 0,
    seq: 0,
    verif: 0,
    evit: 0,
    hoje: { data: new Date().toDateString(), acertos: 0 },
  }),
  get() {
    let s;
    try {
      s = JSON.parse(localStorage.getItem("ehf_prog"));
    } catch {}
    s = { ...Store.padrao(), ...s };
    if (!s.hoje || s.hoje.data !== new Date().toDateString())
      s.hoje = { data: new Date().toDateString(), acertos: 0 };
    return s;
  },
  set(s) {
    try {
      localStorage.setItem("ehf_prog", JSON.stringify(s));
    } catch {}
  },
};

/* API */
const API = {
  BASE: "http://localhost:3000/api",
  MOCK: true,
  async req(path, opts = {}) {
    if (this.MOCK) return mock(path, opts);
    const tk = (Session.get() || {}).token;
    const r = await fetch(this.BASE + path, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(tk ? { Authorization: "Bearer " + tk } : {}),
      },
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok)
      throw new Error(
        j.erro || "Erro " + r.status + " ao falar com o servidor.",
      );
    return j;
  },
  login: (email, senha) =>
    API.req("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, senha }),
    }),
  cadastro: (nome, email, senha) =>
    API.req("/auth/cadastro", {
      method: "POST",
      body: JSON.stringify({ nome, email, senha }),
    }),
  analisar: (link, mensagem) =>
    API.req("/analisar", {
      method: "POST",
      body: JSON.stringify({ link, mensagem }),
    }),
  desafio: (nivel) => API.req("/treino/desafio?nivel=" + nivel),
  responder: (id, indice, tempoMs) =>
    API.req("/treino/responder", {
      method: "POST",
      body: JSON.stringify({ id, indice, tempoMs }),
    }),
  noticias: () => API.req("/noticias"),
};

/* JS da API que trocaremos mais tarde */
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
let vistos = [];
async function mock(path, opts) {
  const body = opts.body ? JSON.parse(opts.body) : {};
  if (path.startsWith("/auth/login")) {
    await wait(500);
    if (
      body.email.trim().toLowerCase() === "teste@ehfraude.com" &&
      body.senha === "123456"
    )
      return {
        token: "mock",
        nome: "Mariana Souza",
        email: "teste@ehfraude.com",
        telefone: "(11) 9XXXX-XXXX",
        desde: "março de 2026",
      };
    throw new Error("E-mail ou senha incorretos.");
  }
  if (path.startsWith("/auth/cadastro")) {
    await wait(600);
    if (body.email.trim().toLowerCase() === "teste@ehfraude.com")
      throw new Error("Este e-mail já está cadastrado.");
    return {
      token: "mock",
      nome: body.nome.trim(),
      email: body.email.trim(),
      telefone: "—",
      desde: new Date().toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      }),
    };
  }
  if (path.startsWith("/analisar")) {
    await wait(900);
    return mockAnalise(body);
  }
  if (path.startsWith("/treino/desafio")) {
    await wait(350);
    let livres = DESAFIOS.filter((d) => !vistos.includes(d.id));
    if (!livres.length) {
      vistos = [];
      livres = DESAFIOS;
    }
    const { correta, explicacao, ...publico } =
      livres[Math.floor(Math.random() * livres.length)];
    vistos.push(publico.id);
    return publico;
  }
  if (path.startsWith("/treino/responder")) {
    await wait(150);
    const d = DESAFIOS.find((x) => x.id === body.id),
      acertou = body.indice === d.correta;
    return {
      acertou,
      indiceCorreto: d.correta,
      explicacao: d.explicacao,
      xp: acertou ? 20 + (body.tempoMs < 8000 ? 5 : 0) : 0,
    };
  }
  if (path.startsWith("/noticias")) {
    await wait(300);
    return NOTICIAS;
  }
  throw new Error("Rota não encontrada: " + path);
}
function mockAnalise({ link, mensagem }) {
  let p = 5;
  const ind = [];
  const t = (mensagem || "").toLowerCase(),
    l = (link || "").toLowerCase();
  if (/(bit\.ly|tinyurl|cutt\.ly|t\.co|is\.gd)/.test(l)) {
    p += 30;
    ind.push("Link encurtado esconde o destino real.");
  }
  if (l && !l.startsWith("https://")) {
    p += 15;
    ind.push("O link não usa conexão segura (https).");
  }
  if (/\.(xyz|top|click|site|online|net)(\/|$)/.test(l)) {
    p += 20;
    ind.push("Domínio com terminação comum em golpes.");
  }
  if (/@|-\d|\d-|seguro|banco|suporte/.test(l.split("/")[2] || "")) {
    p += 15;
    ind.push("Endereço imita uma marca ou tem símbolos fora do padrão.");
  }
  [
    [
      /urgente|hoje|últim|imediat/,
      "Tom de urgência para você agir sem pensar.",
    ],
    [/senha|token|código|cvv|cpf/, "Pede dados pessoais ou códigos de acesso."],
    [/pix|transfer/, "Menciona Pix ou transferência."],
    [/bloquead|suspens|cancelad/, "Ameaça bloquear ou cancelar sua conta."],
    [/prêmio|premiado|ganhou|sorteio/, "Promete prêmio que você não pediu."],
    [/clique|acesse|atualize/, "Pede para clicar ou acessar um link."],
  ].forEach(([re, msg]) => {
    if (re.test(t)) {
      p += 14;
      ind.push(msg);
    }
  });
  p = Math.min(p, 97);
  const c = p < 25 ? "SEGURO" : p < 60 ? "SUSPEITO" : "GOLPE";
  const rec = {
    GOLPE: [
      "Não clique, não responda e não envie nenhum dado.",
      "Apague a mensagem e bloqueie o remetente.",
      "Se já informou dados, ligue para o banco pelo número do cartão.",
    ],
    SUSPEITO: [
      "Não clique no link por enquanto.",
      "Confirme direto no app ou site oficial, digitando o endereço você mesmo.",
    ],
    SEGURO: ["Nada de suspeito foi encontrado, mas continue atento."],
  }[c];
  if (!ind.length) ind.push("Nenhum sinal clássico de golpe encontrado.");
  return {
    classificacao: c,
    probabilidade: p,
    indicios: ind,
    recomendacoes: rec,
  };
}
const Q = "O que você faz ao receber isto?";
const DESAFIOS = [
  {
    id: 1,
    remetente: "Banco Central <suporte@bcbrasil-seguro.net>",
    mensagem:
      "Seu Pix foi bloqueado. Clique aqui para regularizar imediatamente e evitar o cancelamento da sua conta.",
    pergunta: "Qual sinal indica possível golpe nessa mensagem?",
    opcoes: [
      "Urgência exagerada",
      "Linguagem formal",
      "Menção ao Pix",
      "Mensagem curta",
    ],
    correta: 0,
    explicacao:
      "Golpistas usam urgência para pressionar decisões rápidas sem que você pense com clareza.",
  },
  {
    id: 2,
    remetente: "BANCO (SMS)",
    mensagem:
      "Sua conta será bloqueada hoje. Atualize seus dados em bit.ly/atualiza-ja",
    pergunta: Q,
    opcoes: [
      "Clico e atualizo rápido",
      "Abro o app do banco por conta própria",
      "Respondo o SMS pedindo detalhes",
      "Encaminho para amigos avisando",
    ],
    correta: 1,
    explicacao:
      "Link encurtado e urgência são sinais clássicos. Bancos não pedem atualização por SMS com link.",
  },
  {
    id: 3,
    remetente: "Número desconhecido (WhatsApp)",
    mensagem:
      "Oi mãe, troquei de número e o Pix do aluguel venceu. Pode pagar pra mim? Depois te explico.",
    pergunta: Q,
    opcoes: [
      "Faço o Pix, é meu filho",
      "Ligo para o número antigo antes de pagar",
      "Peço o CPF dele",
      "Pago só metade",
    ],
    correta: 1,
    explicacao:
      "No golpe do falso parente, o criminoso usa pressa e número novo. Confirme por outro canal.",
  },
  {
    id: 4,
    remetente: "suporte@netfIix-conta.com",
    mensagem: "Sua assinatura falhou. Clique para regularizar em 24h.",
    pergunta: "Qual é o principal sinal de golpe aqui?",
    opcoes: [
      "O prazo de 24 horas",
      'O domínio imita a marca (um "I" no lugar do "l")',
      "A mensagem ser curta",
      "Falar de assinatura",
    ],
    correta: 1,
    explicacao:
      'O "I" maiúsculo imita o "l" no domínio. Sempre confira o endereço do remetente.',
  },
  {
    id: 5,
    remetente: "Loja Mega Ofertas <contato@megaofertas-br.top>",
    mensagem:
      "Notebook por R$ 599, só hoje, pagamento apenas por Pix para uma conta pessoal.",
    pergunta: Q,
    opcoes: [
      "Compro antes que acabe",
      "Pesquiso a loja e desconfio do preço",
      "Pago metade como teste",
      "Peço desconto",
    ],
    correta: 1,
    explicacao:
      "Preço muito abaixo do mercado, urgência e Pix para pessoa física indicam golpe de loja falsa.",
  },
  {
    id: 6,
    remetente: 'Ligação: "Central de Segurança"',
    mensagem:
      "Detectamos uma compra suspeita. Para cancelar, informe o código que enviamos por SMS.",
    pergunta: Q,
    opcoes: [
      "Informo o código para cancelar",
      "Desligo e ligo para o número do meu cartão",
      "Peço o nome do atendente e informo",
      "Confirmo só os 3 últimos dígitos",
    ],
    correta: 1,
    explicacao:
      "Nenhum banco pede códigos recebidos por SMS. Esse código autoriza a operação do golpista.",
  },
  {
    id: 7,
    remetente: "Promoções <premio@sorteio-vip.xyz>",
    mensagem:
      "Parabéns! Você foi sorteado com um iPhone. Pague R$ 29,90 de frete para receber.",
    pergunta: "Qual sinal indica golpe?",
    opcoes: [
      "Cobrança de frete por um prêmio",
      'Uso da palavra "Parabéns"',
      "Mencionar um iPhone",
      "Ter um valor em reais",
    ],
    correta: 0,
    explicacao:
      "Prêmio sem participação e cobrança de taxa são a base do golpe do falso sorteio.",
  },
  {
    id: 8,
    remetente: "Vagas Home <rh@trabalhe-em-casa.top>",
    mensagem:
      "Ganhe R$ 3.000 por semana digitando em casa. Pague R$ 49 de cadastro para começar hoje.",
    pergunta: "O que mais indica golpe?",
    opcoes: [
      "Cobrança de taxa para começar",
      "Oferta de trabalho remoto",
      "Mensagem enviada por e-mail",
      "Citar um valor em reais",
    ],
    correta: 0,
    explicacao:
      "Vagas legítimas não cobram para você trabalhar. Pagamento antecipado é sinal clássico.",
  },
];
const NOTICIAS = [
  {
    id: 1,
    tag: "Pix",
    titulo:
      "Golpe do Pix por engano volta a crescer entre pequenos comerciantes",
    descricao:
      "Criminosos enviam comprovantes falsos e pedem a devolução de valores que nunca chegaram a ser transferidos.",
    atualizado: "Atualizado hoje",
    imagem: "pix.jpg",
  },
  {
    id: 2,
    tag: "Voz sintética",
    titulo: "Golpes com clonagem de voz por IA preocupam famílias brasileiras",
    descricao:
      "Áudios gerados por inteligência artificial imitam parentes pedindo dinheiro com urgência para gerar pânico.",
    atualizado: "Atualizado ontem",
    imagem: "voz sintetica.jpg",
  },
  {
    id: 3,
    tag: "Phishing",
    titulo:
      "Mensagens falsas de bancos usam domínios quase idênticos aos originais",
    descricao:
      "Golpistas registram endereços com pequenas trocas de letras para enganar até usuários mais atentos.",
    atualizado: "2 dias atrás",
    imagem: "phishing.webp",
  },
  {
    id: 4,
    tag: "Emprego",
    titulo:
      'Vagas de "home office fácil" continuam atraindo jovens em busca de renda extra',
    descricao:
      "Ofertas prometem ganhos rápidos mas pedem pagamento antecipado por materiais ou cadastro.",
    atualizado: "3 dias atrás",
    imagem: "trabalhar-em-home-office3.webp",
  },
];
