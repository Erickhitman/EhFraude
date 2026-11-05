/* EhFraude? Landing page
   Melhorias progressivas: a página funciona sem JavaScript.
   O script cuida de: menu mobile, link ativo no menu, demo animada e abas das telas. */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)");

  /* ---------- Menu mobile ---------- */
  const toggle = $(".nav-toggle");
  const menu = $("#menu");

  if (toggle && menu) {
    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      menu.toggleAttribute("data-open", open);
    };

    toggle.addEventListener("click", () => setOpen(!isOpen()));
    menu.addEventListener("click", (e) => {
      if (e.target.closest("a")) setOpen(false);
    });
    document.addEventListener("click", (e) => {
      if (isOpen() && !e.target.closest(".site-header")) setOpen(false);
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && isOpen()) {
        setOpen(false);
        toggle.focus();
      }
    });
    matchMedia("(max-width: 1120px)").addEventListener("change", () => setOpen(false));
  }

  /* ---------- Link ativo no menu ---------- */
  if ("IntersectionObserver" in window) {
    const links = $$('.site-nav__list a[href^="#"]');
    const byId = new Map(links.map((a) => [a.getAttribute("href").slice(1), a]));
    const clear = () => links.forEach((a) => a.removeAttribute("aria-current"));

    const spy = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          clear();
          const link = byId.get(entry.target.id);
          if (link) link.setAttribute("aria-current", "location");
        });
      },
      /* faixa fina no meio da tela: a seção que cruza ela é a atual */
      { rootMargin: "-45% 0px -54% 0px" },
    );

    byId.forEach((_, id) => {
      const section = document.getElementById(id);
      if (section) spy.observe(section);
    });
    $$(".hero, .cta").forEach((el) => spy.observe(el));
  }

  /* ---------- Demo da análise ---------- */
  const demo = $("#demo");

  if (demo) {
    const play = () => demo.classList.add("is-playing");

    if (reduceMotion.matches || !("IntersectionObserver" in window)) {
      play();
    } else {
      const watcher = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          play();
          watcher.disconnect();
        },
        { threshold: 0.5 },
      );
      watcher.observe(demo);
    }

    const replay = $(".demo__replay", demo);
    if (replay) {
      replay.addEventListener("click", () => {
        demo.classList.remove("is-playing");
        void demo.offsetWidth; // aplica o estado inicial antes de reiniciar
        demo.classList.add("is-playing");
      });
    }
  }

  /* ---------- Abas das telas ---------- */
  const tabs = $("[data-tabs]");

  if (tabs) {
    const panels = $$(".screen", tabs);

    const list = document.createElement("div");
    list.className = "screens__tabs";
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-label", "Telas do aplicativo");

    const buttons = panels.map((panel, i) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "screens__tab";
      button.id = `tab-${i}`;
      button.textContent = panel.dataset.label;
      button.setAttribute("role", "tab");
      button.setAttribute("aria-controls", `painel-${i}`);

      panel.id = `painel-${i}`;
      panel.setAttribute("role", "tabpanel");
      panel.setAttribute("aria-labelledby", button.id);
      panel.tabIndex = 0;

      list.append(button);
      return button;
    });

    tabs.prepend(list);
    tabs.classList.add("is-enhanced");

    const select = (index, moveFocus = false) => {
      panels.forEach((panel, j) => {
        panel.hidden = j !== index;
        buttons[j].setAttribute("aria-selected", String(j === index));
        buttons[j].tabIndex = j === index ? 0 : -1;
      });
      if (moveFocus) buttons[index].focus();
    };

    buttons.forEach((button, i) => button.addEventListener("click", () => select(i)));

    list.addEventListener("keydown", (e) => {
      const current = buttons.indexOf(document.activeElement);
      if (current < 0) return;
      const last = buttons.length - 1;
      const target = {
        ArrowRight: current === last ? 0 : current + 1,
        ArrowLeft: current === 0 ? last : current - 1,
        Home: 0,
        End: last,
      }[e.key];
      if (target === undefined) return;
      e.preventDefault();
      select(target, true);
    });

    select(0);

    /* Quando a seção se aproxima, carrega as outras telas para a troca ser instantânea */
    if ("IntersectionObserver" in window) {
      const images = $$('img[loading="lazy"]', tabs);
      const near = new IntersectionObserver(
        ([entry]) => {
          if (!entry.isIntersecting) return;
          images.forEach((img) => (img.loading = "eager"));
          near.disconnect();
        },
        { rootMargin: "600px" },
      );
      near.observe(tabs);
    }
  }
})();
