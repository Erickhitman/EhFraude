const $ = (id) => document.getElementById(id);

/* Loading mobile */
const loader = $("mobileLoading");

if (loader) setTimeout(() => loader.classList.add("hide"), 1200);
const noMobile = () => loader && getComputedStyle(loader).display !== "none";
document.querySelectorAll("a[data-nav]").forEach((a) =>
  a.addEventListener("click", (e) => {
    if (!noMobile()) return;
    e.preventDefault();
    loader.classList.remove("hide");
    setTimeout(() => {
      location.href = a.href;
    }, 900);
  }),
);

/* Menu */
$("hamburger").addEventListener("click", () =>
  $("nav-links").classList.toggle("open"),
);

/* Senha */
document.querySelectorAll(".toggle-pass").forEach((b) =>
  b.addEventListener("click", () => {
    const input = $(b.dataset.alvo),
      mostrar = input.type === "password";
    input.type = mostrar ? "text" : "password";
    b.setAttribute("aria-pressed", mostrar);
    b.setAttribute("aria-label", mostrar ? "Ocultar senha" : "Mostrar senha");
  }),
);

/* Formulário */
const erro = $("erro");
const mostrarErro = (t, info = false) => {
  erro.textContent = t;
  erro.className = "error-msg" + (info ? " info" : "");
  erro.hidden = !t;
};
async function enviar(form, botao, rotulo, acao, lembrar) {
  botao.disabled = true;
  botao.textContent = "Aguarde…";
  mostrarErro("");
  try {
    Session.set(await acao(), lembrar());
    botao.textContent = "Tudo certo!";
    setTimeout(() => {
      location.href = "../index.html";
    }, 500);
  } catch (e) {
    mostrarErro(e.message);
    botao.disabled = false;
    botao.textContent = rotulo;
  }
}

/* Login */
if ($("form-login")) {
  const form = $("form-login"),
    botao = $("btn-entrar");
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const email = $("email").value.trim(),
      senha = $("senha").value;
    if (!email || !senha) return mostrarErro("Digite seu e-mail e sua senha.");
    enviar(
      form,
      botao,
      "Entrar",
      () => API.login(email, senha),
      () => $("lembrar").checked,
    );
  });
  $("esqueci").addEventListener("click", (e) => {
    e.preventDefault();
    mostrarErro("A recuperação de senha chega junto com a API.", true);
  });
}

/* Cadastro */
if ($("form-cadastro")) {
  const form = $("form-cadastro"),
    botao = $("btn-criar"),
    senha = $("senha"),
    fill = $("strengthFill"),
    rot = $("strengthLabel");
  const NIVEIS = [
    { p: "0%", c: "#D9E1EC", t: "Força da senha" },
    { p: "25%", c: "#C0392B", t: "Fraca" },
    { p: "50%", c: "#E3A800", t: "Razoável" },
    { p: "75%", c: "#2F5C94", t: "Boa" },
    { p: "100%", c: "#2E7D4F", t: "Forte" },
  ];
  senha.addEventListener("input", () => {
    const v = senha.value;
    let pts = 0;
    if (v.length >= 8) pts++;
    if (/[A-Z]/.test(v)) pts++;
    if (/[0-9]/.test(v)) pts++;
    if (/[^A-Za-z0-9]/.test(v)) pts++;
    const n = v ? NIVEIS[pts] || NIVEIS[4] : NIVEIS[0];
    fill.style.width = n.p;
    fill.style.background = n.c;
    rot.textContent = n.t;
  });
  form.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nome = $("nome").value.trim(),
      email = $("email").value.trim();
    if (nome.length < 2) return mostrarErro("Digite seu nome.");
    if (!/^\S+@\S+\.\S+$/.test(email))
      return mostrarErro("Digite um e-mail válido.");
    if (senha.value.length < 8)
      return mostrarErro("A senha precisa ter pelo menos 8 caracteres.");
    if (!$("termos").checked)
      return mostrarErro("Aceite os termos de uso para continuar.");
    enviar(
      form,
      botao,
      "Criar conta",
      () => API.cadastro(nome, email, senha.value),
      () => true,
    );
  });
}
