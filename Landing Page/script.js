/* Animação de entrada dos blocos */
document.documentElement.classList.add("js-reveal");

const blocos = [
  ".hero-text > *",
  ".hero-shot",
  ".section-head",
  ".about-card",
  ".feat-card",
  ".step",
  ".screen",
  ".tech-list li",
  ".team-card",
  ".cta-inner",
];

/* Itens irmãos aparecem em cascata */
document.querySelectorAll(blocos.join(",")).forEach((el) => {
  const irmaos = [...el.parentElement.children].filter((x) =>
    x.matches(blocos.join(",")),
  );
  el.style.setProperty("--delay", irmaos.indexOf(el) * 0.1 + "s");
  el.classList.add("reveal");
});

const observador = new IntersectionObserver(
  (entradas) => {
    entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("visivel");
      observador.unobserve(e.target); // anima só uma vez
    });
  },
  { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
);

document.querySelectorAll(".reveal").forEach((el) => observador.observe(el));
