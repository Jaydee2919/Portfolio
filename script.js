(function () {
  const data = window.siteContent;
  const main = document.querySelector("#top");
  const header = document.querySelector("#site-header");
  const footer = document.querySelector("#site-footer");

  if (!data || !main || !header || !footer) {
    return;
  }

  document.title = data.site.title;
  const description = document.querySelector('meta[name="description"]');
  if (description) {
    description.setAttribute("content", data.site.description);
  }

  function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function link(className, item) {
    const node = el("a", className, item.label);
    node.href = item.href;
    if (item.external || /^https?:\/\//.test(item.href)) {
      node.target = "_blank";
      node.rel = "noreferrer";
    }
    return node;
  }

  function button(item) {
    return link(`button button-${item.style || "secondary"}`, item);
  }

  function visible(section) {
    return data.sections[section] !== false;
  }

  function sectionHeader(config) {
    const headerNode = el("div", "section-header reveal");
    headerNode.append(el("p", "eyebrow", config.eyebrow));
    headerNode.append(el("h2", "", config.title));
    return headerNode;
  }

  function renderHeader() {
    header.replaceChildren();
    const brand = el("a", "brand", data.site.name);
    brand.href = "#top";

    const nav = el("nav", "site-nav");
    nav.setAttribute("aria-label", "Primary navigation");
    data.nav
      .filter((item) => !item.section || visible(item.section))
      .forEach((item) => nav.append(link("", item)));

    const linkedIn = link("header-link", {
      label: "LinkedIn",
      href: data.site.linkedinUrl,
      external: true,
    });

    header.append(brand, nav, linkedIn);
  }

  function renderHero() {
    const section = el("section", "hero");

    const inner = el("div", "hero-inner");
    inner.append(el("p", "eyebrow", data.hero.eyebrow));
    inner.append(el("h1", "", data.hero.headline));
    (data.hero.paragraphs || []).forEach((paragraph, index) => {
      inner.append(el("p", index === 0 ? "hero-lede" : "hero-note", paragraph));
    });

    const actions = el("div", "hero-actions");
    (data.hero.actions || []).forEach((item) => actions.append(button(item)));
    inner.append(actions);

    const facts = el("div", "hero-facts");
    facts.setAttribute("aria-label", "Profile facts");
    (data.hero.facts || []).forEach((item) => {
      const fact = el("div");
      fact.append(el("span", "", item.label));
      fact.append(el("strong", "", item.title));
      fact.append(el("p", "", item.body));
      facts.append(fact);
    });

    section.append(inner, facts);
    main.append(section);
  }

  function renderHighlights() {
    if (!visible("highlights")) return;
    const section = el("section", "section impact-section");
    section.id = "highlights";
    section.append(el("div", "section-kicker", data.highlights.kicker));

    const grid = el("div", "impact-grid");
    (data.highlights.items || []).forEach((item) => {
      const article = el("article", "impact-item reveal");
      article.append(el("span", "", item.value));
      article.append(el("p", "", item.text));
      grid.append(article);
    });
    section.append(grid);
    main.append(section);
  }

  function renderExpertise() {
    if (!visible("expertise")) return;
    const section = el("section", "section expertise-section");
    section.id = "expertise";
    section.append(sectionHeader(data.expertise));

    const list = el("div", "expertise-list");
    (data.expertise.items || []).forEach((item) => {
      const article = el("article", "expertise-item reveal");
      article.append(el("span", "", item.number));
      article.append(el("h3", "", item.title));
      article.append(el("p", "", item.text));
      list.append(article);
    });
    section.append(list);
    main.append(section);
  }

  function renderProjects() {
    if (!visible("projects")) return;
    const section = el("section", "section projects-section");
    section.id = "projects";
    section.append(sectionHeader(data.projects));

    const list = el("div", "project-list");
    (data.projects.items || []).forEach((item) => {
      const article = el("article", "project-item reveal");
      article.append(el("div", "project-meta", item.meta));
      article.append(el("h3", "", item.title));
      article.append(el("p", "", item.description));
      const bullets = el("ul");
      (item.bullets || []).forEach((bullet) => bullets.append(el("li", "", bullet)));
      article.append(bullets);
      list.append(article);
    });
    section.append(list);
    main.append(section);
  }

  function renderPost() {
    if (!visible("post")) return;
    const section = el("section", "section linkedin-post-section");
    section.id = "post";
    section.append(sectionHeader(data.post));

    const layout = el("div", "post-layout");
    const copy = el("div", "post-copy reveal");
    copy.append(el("p", "", data.post.description));
    copy.append(button({ label: data.post.ctaLabel, href: data.post.ctaUrl, style: "primary", external: true }));

    const frame = el("div", "post-frame reveal");
    const iframe = el("iframe");
    iframe.src = data.post.embedUrl;
    iframe.height = "601";
    iframe.width = "504";
    iframe.frameBorder = "0";
    iframe.allowFullscreen = true;
    iframe.title = "Embedded LinkedIn post";
    frame.append(iframe);

    layout.append(copy, frame);
    section.append(layout);
    main.append(section);
  }

  function renderAbout() {
    if (!visible("about")) return;
    const section = el("section", "section about-section");
    section.id = "about";
    section.append(sectionHeader(data.about));

    const grid = el("div", "about-grid about-grid-full");
    const copy = el("div", "about-copy reveal");
    const bodyItems = Array.isArray(data.about.body) ? data.about.body : [data.about.body];
    bodyItems.filter(Boolean).forEach((paragraph) => copy.append(el("p", "", paragraph)));

    const points = el("div", "about-points reveal");
    (data.about.points || []).forEach((item) => {
      const point = el("article", "about-point");
      point.append(el("h3", "", item.title));
      point.append(el("p", "", item.text));
      points.append(point);
    });

    grid.append(copy, points);
    section.append(grid);
    main.append(section);
  }

  function renderProof() {
    if (!visible("proof")) return;
    const section = el("section", "section proof-section");
    const grid = el("div", "proof-grid");
    (data.proof.items || []).forEach((item) => {
      const article = el("article", "proof-item reveal");
      article.append(el("h3", "", item.title));
      article.append(el("p", "", item.text));
      grid.append(article);
    });
    section.append(grid);
    main.append(section);
  }

  function renderCustomSections() {
    (data.customSections || [])
      .filter((sectionData) => sectionData.visible !== false)
      .forEach((sectionData, sectionIndex) => {
        const section = el("section", "section custom-section");
        section.id = sectionData.id || `custom-${sectionIndex + 1}`;
        section.append(sectionHeader(sectionData));

        if (sectionData.body) {
          const body = el("div", "custom-body reveal");
          body.append(el("p", "", sectionData.body));
          section.append(body);
        }

        if (sectionData.items && sectionData.items.length) {
          const grid = el("div", "proof-grid");
          sectionData.items.forEach((item) => {
            const article = el("article", "proof-item reveal");
            article.append(el("h3", "", item.title));
            article.append(el("p", "", item.text));
            grid.append(article);
          });
          section.append(grid);
        }
        main.append(section);
      });
  }

  function renderContact() {
    if (!visible("contact")) return;
    const section = el("section", "section contact-section reveal");
    section.id = "contact";
    section.append(el("p", "eyebrow", data.contact.eyebrow));
    section.append(el("h2", "", data.contact.title));
    const actions = el("div", "contact-actions");
    (data.contact.actions || []).forEach((item) => actions.append(button(item)));
    section.append(actions);
    main.append(section);
  }

  function renderFooter() {
    footer.replaceChildren();
    const currentYear = new Date().getFullYear();
    footer.append(el("p", "", `© ${currentYear} ${data.site.name}. ${data.site.footer}`));
  }

  function initReveal() {
    const revealItems = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.18 }
    );

    revealItems.forEach((item) => revealObserver.observe(item));
  }

  renderHeader();
  renderHero();
  renderAbout();
  renderHighlights();
  renderExpertise();
  renderProjects();
  renderPost();
  renderProof();
  renderCustomSections();
  renderContact();
  renderFooter();
  initReveal();
})();
