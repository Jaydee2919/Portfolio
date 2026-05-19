(function () {
  let content = structuredClone(window.siteContent);
  let fileHandle = null;
  let dirty = false;

  const editor = document.querySelector("#editor");
  const status = document.querySelector("#status");
  const openButton = document.querySelector("#open-file");
  const saveButton = document.querySelector("#save-file");
  const downloadButton = document.querySelector("#download-file");
  const hasLocalServer = location.protocol === "http:" || location.protocol === "https:";

  const sectionLabels = {
    highlights: "Highlights",
    expertise: "Expertise",
    projects: "Projects",
    post: "LinkedIn post",
    about: "About",
    proof: "Proof blocks",
    contact: "Contact",
  };

  function setStatus(message) {
    status.textContent = message;
  }

  function markDirty() {
    dirty = true;
    setStatus("Unsaved changes");
  }

  function contentFileText() {
    return `window.siteContent = ${JSON.stringify(content, null, 2)};\n`;
  }

  function parseContentFile(text) {
    const match = text.match(/window\.siteContent\s*=\s*([\s\S]*?);\s*$/);
    if (!match) {
      throw new Error("This does not look like a content.js file.");
    }
    return JSON.parse(match[1]);
  }

  function node(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text !== undefined && text !== null) element.textContent = text;
    return element;
  }

  function panel(id, title, description) {
    const section = node("section", "panel");
    section.id = id;

    const heading = node("div", "panel-heading");
    const copy = node("div");
    copy.append(node("h2", "", title));
    if (description) copy.append(node("p", "", description));
    heading.append(copy);

    const body = node("div", "panel-body");
    section.append(heading, body);
    editor.append(section);
    return body;
  }

  function inputField(label, value, onInput, options = {}) {
    const field = node("div", `field ${options.full ? "full" : ""}`.trim());
    const id = `field-${Math.random().toString(36).slice(2)}`;
    const labelNode = node("label", "", label);
    labelNode.setAttribute("for", id);

    const input = document.createElement(options.multiline ? "textarea" : "input");
    input.id = id;
    input.value = value || "";
    if (options.placeholder) input.placeholder = options.placeholder;
    input.addEventListener("input", () => {
      onInput(input.value);
      markDirty();
    });

    field.append(labelNode, input);
    return field;
  }

  function selectField(label, value, choices, onInput) {
    const field = node("div", "field");
    const id = `field-${Math.random().toString(36).slice(2)}`;
    const labelNode = node("label", "", label);
    labelNode.setAttribute("for", id);
    const select = document.createElement("select");
    select.id = id;
    choices.forEach((choice) => {
      const option = node("option", "", choice.label);
      option.value = choice.value;
      select.append(option);
    });
    select.value = value || choices[0].value;
    select.addEventListener("change", () => {
      onInput(select.value);
      markDirty();
    });
    field.append(labelNode, select);
    return field;
  }

  function checkbox(label, checked, onChange) {
    const row = node("label", "check-row");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;
    input.addEventListener("change", () => {
      onChange(input.checked);
      markDirty();
      render();
    });
    row.append(input, node("span", "", label));
    return row;
  }

  function fieldGrid(...children) {
    const grid = node("div", "field-grid");
    children.forEach((child) => grid.append(child));
    return grid;
  }

  function itemEditor(title, item, index, items, renderFields) {
    const wrapper = node("article", "item-editor");
    const heading = node("div", "item-heading");
    heading.append(node("strong", "", title));

    const actions = node("div", "item-actions");
    const up = node("button", "", "Up");
    up.type = "button";
    up.disabled = index === 0;
    up.addEventListener("click", () => {
      [items[index - 1], items[index]] = [items[index], items[index - 1]];
      markDirty();
      render();
    });

    const down = node("button", "", "Down");
    down.type = "button";
    down.disabled = index === items.length - 1;
    down.addEventListener("click", () => {
      [items[index], items[index + 1]] = [items[index + 1], items[index]];
      markDirty();
      render();
    });

    const remove = node("button", "danger", "Delete");
    remove.type = "button";
    remove.addEventListener("click", () => {
      items.splice(index, 1);
      markDirty();
      render();
    });

    actions.append(up, down, remove);
    heading.append(actions);

    const body = node("div", "item-body");
    renderFields(body, item);
    wrapper.append(heading, body);
    return wrapper;
  }

  function repeater(parent, title, items, emptyItem, renderFields) {
    const list = node("div", "item-list");
    items.forEach((item, index) => {
      list.append(itemEditor(`${title} ${index + 1}`, item, index, items, renderFields));
    });
    const add = node("button", "add-button", `Add ${title.toLowerCase()}`);
    add.type = "button";
    add.addEventListener("click", () => {
      items.push(structuredClone(emptyItem));
      markDirty();
      render();
    });
    parent.append(list, add);
  }

  function renderSitePanel() {
    const body = panel("site-panel", "Site basics", "These values control the browser title, header name, footer, and contact defaults.");
    body.append(
      fieldGrid(
        inputField("Name", content.site.name, (value) => (content.site.name = value)),
        inputField("Browser title", content.site.title, (value) => (content.site.title = value)),
        inputField("LinkedIn URL", content.site.linkedinUrl, (value) => (content.site.linkedinUrl = value)),
        inputField("Email", content.site.email, (value) => (content.site.email = value)),
        inputField("Phone label", content.site.phone, (value) => (content.site.phone = value)),
        inputField("Phone link", content.site.phoneHref, (value) => (content.site.phoneHref = value)),
        inputField("Meta description", content.site.description, (value) => (content.site.description = value), { full: true, multiline: true }),
        inputField("Footer text", content.site.footer, (value) => (content.site.footer = value), { full: true })
      )
    );
  }

  function renderSectionsPanel() {
    const body = panel("sections-panel", "Section visibility", "Turn major website sections on or off. Custom sections can be added lower down.");
    const checks = node("div", "check-grid");
    Object.entries(sectionLabels).forEach(([key, label]) => {
      checks.append(checkbox(label, content.sections[key] !== false, (checked) => (content.sections[key] = checked)));
    });
    body.append(checks);
  }

  function renderHeroPanel() {
    const body = panel("hero-panel", "Hero", "This is the first content block visitors see.");
    body.append(
      fieldGrid(
        inputField("Eyebrow", content.hero.eyebrow, (value) => (content.hero.eyebrow = value)),
        inputField("Headline", content.hero.headline, (value) => (content.hero.headline = value)),
        inputField("Main paragraph", content.hero.paragraphs[0], (value) => (content.hero.paragraphs[0] = value), { full: true, multiline: true }),
        inputField("Supporting paragraph", content.hero.paragraphs[1], (value) => (content.hero.paragraphs[1] = value), { full: true, multiline: true })
      )
    );

    repeater(body, "Hero button", content.hero.actions, { label: "New button", href: "#contact", style: "secondary" }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Label", item.label, (value) => (item.label = value)),
          inputField("Link", item.href, (value) => (item.href = value)),
          selectField("Style", item.style, [{ label: "Primary", value: "primary" }, { label: "Secondary", value: "secondary" }], (value) => (item.style = value))
        )
      );
    });

    repeater(body, "Hero fact", content.hero.facts, { label: "Fact label", title: "Fact title", body: "Fact detail" }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Label", item.label, (value) => (item.label = value)),
          inputField("Title", item.title, (value) => (item.title = value)),
          inputField("Detail", item.body, (value) => (item.body = value), { full: true })
        )
      );
    });
  }

  function renderHighlightsPanel() {
    const body = panel("highlights-panel", "Highlights", "These are the top impact metrics.");
    body.append(inputField("Section kicker", content.highlights.kicker, (value) => (content.highlights.kicker = value)));
    repeater(body, "Highlight", content.highlights.items, { value: "New", text: "Add impact detail." }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Value", item.value, (value) => (item.value = value)),
          inputField("Text", item.text, (value) => (item.text = value), { full: true, multiline: true })
        )
      );
    });
  }

  function renderExpertisePanel() {
    const body = panel("expertise-panel", "Expertise", "Add, delete, and reorder expertise rows.");
    body.append(
      fieldGrid(
        inputField("Eyebrow", content.expertise.eyebrow, (value) => (content.expertise.eyebrow = value)),
        inputField("Section title", content.expertise.title, (value) => (content.expertise.title = value), { full: true, multiline: true })
      )
    );
    repeater(body, "Expertise", content.expertise.items, { number: "00", title: "New expertise", text: "Describe this expertise." }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Number", item.number, (value) => (item.number = value)),
          inputField("Title", item.title, (value) => (item.title = value)),
          inputField("Text", item.text, (value) => (item.text = value), { full: true, multiline: true })
        )
      );
    });
  }

  function renderProjectsPanel() {
    const body = panel("projects-panel", "Projects", "Project bullets are one per line.");
    body.append(
      fieldGrid(
        inputField("Eyebrow", content.projects.eyebrow, (value) => (content.projects.eyebrow = value)),
        inputField("Section title", content.projects.title, (value) => (content.projects.title = value), { full: true, multiline: true })
      )
    );
    repeater(body, "Project", content.projects.items, { meta: "Company / Program", title: "New project", description: "Project summary.", bullets: ["Key highlight."] }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Meta", item.meta, (value) => (item.meta = value)),
          inputField("Title", item.title, (value) => (item.title = value)),
          inputField("Description", item.description, (value) => (item.description = value), { full: true, multiline: true }),
          inputField("Bullets", (item.bullets || []).join("\n"), (value) => (item.bullets = value.split("\n").filter(Boolean)), { full: true, multiline: true })
        )
      );
    });
  }

  function renderPostPanel() {
    const body = panel("post-panel", "LinkedIn post", "Use the embed URL from LinkedIn, not the whole iframe.");
    body.append(
      fieldGrid(
        inputField("Eyebrow", content.post.eyebrow, (value) => (content.post.eyebrow = value)),
        inputField("Title", content.post.title, (value) => (content.post.title = value), { full: true, multiline: true }),
        inputField("Description", content.post.description, (value) => (content.post.description = value), { full: true, multiline: true }),
        inputField("CTA label", content.post.ctaLabel, (value) => (content.post.ctaLabel = value)),
        inputField("CTA URL", content.post.ctaUrl, (value) => (content.post.ctaUrl = value)),
        inputField("Embed URL", content.post.embedUrl, (value) => (content.post.embedUrl = value), { full: true })
      )
    );
    content.post.cards ||= [];
    repeater(body, "LinkedIn card", content.post.cards, { title: "New LinkedIn post", summary: "Short description.", url: "https://www.linkedin.com/in/jayantaiimk/recent-activity/all/", image: "", thumbnailText: "LinkedIn" }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Title", item.title, (value) => (item.title = value)),
          inputField("URL", item.url, (value) => (item.url = value)),
          inputField("Thumbnail image path", item.image || "", (value) => (item.image = value), { full: true }),
          inputField("Thumbnail text", item.thumbnailText || "", (value) => (item.thumbnailText = value)),
          inputField("Summary", item.summary, (value) => (item.summary = value), { full: true, multiline: true })
        )
      );
    });
  }

  function renderAboutPanel() {
    const body = panel("about-panel", "About", "This section now appears directly below the top section. Use paragraphs for the main story and cards for supporting points.");
    const aboutBody = Array.isArray(content.about.body) ? content.about.body.join("\n\n") : content.about.body;
    body.append(
      fieldGrid(
        inputField("Eyebrow", content.about.eyebrow, (value) => (content.about.eyebrow = value)),
        inputField("Title", content.about.title, (value) => (content.about.title = value), { full: true, multiline: true }),
        inputField("Body paragraphs", aboutBody, (value) => (content.about.body = value.split(/\n\s*\n/).filter(Boolean)), { full: true, multiline: true })
      )
    );
    if (!content.about.points) content.about.points = [];
    repeater(body, "About point", content.about.points, { title: "New point", text: "Point detail." }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Title", item.title, (value) => (item.title = value)),
          inputField("Text", item.text, (value) => (item.text = value), { full: true, multiline: true })
        )
      );
    });
  }

  function renderProofPanel() {
    const body = panel("proof-panel", "Proof blocks", "Short supporting blocks near the bottom of the page.");
    repeater(body, "Proof block", content.proof.items, { title: "New proof", text: "Proof detail." }, (itemBody, item) => {
      itemBody.append(
        fieldGrid(
          inputField("Title", item.title, (value) => (item.title = value)),
          inputField("Text", item.text, (value) => (item.text = value), { full: true, multiline: true })
        )
      );
    });
  }

  function renderCustomPanel() {
    const body = panel("custom-panel", "Custom sections", "Add optional sections between proof and contact.");
    repeater(body, "Custom section", content.customSections, { visible: true, id: "custom-section", eyebrow: "New section", title: "Section title", body: "Section body.", items: [] }, (itemBody, item) => {
      itemBody.append(
        checkbox("Show this custom section", item.visible !== false, (checked) => (item.visible = checked)),
        fieldGrid(
          inputField("ID", item.id, (value) => (item.id = value)),
          inputField("Eyebrow", item.eyebrow, (value) => (item.eyebrow = value)),
          inputField("Title", item.title, (value) => (item.title = value), { full: true, multiline: true }),
          inputField("Body", item.body, (value) => (item.body = value), { full: true, multiline: true }),
          inputField("Cards", (item.items || []).map((card) => `${card.title} | ${card.text}`).join("\n"), (value) => {
            item.items = value
              .split("\n")
              .filter(Boolean)
              .map((line) => {
                const [title, ...textParts] = line.split("|");
                return { title: title.trim(), text: textParts.join("|").trim() };
              });
          }, { full: true, multiline: true, placeholder: "Title | Text" })
        )
      );
    });
  }

  function renderContactPanel() {
    const body = panel("contact-panel", "Contact", "Buttons can point to email, phone, LinkedIn, calendar links, or any URL.");
    body.append(
      fieldGrid(
        inputField("Eyebrow", content.contact.eyebrow, (value) => (content.contact.eyebrow = value)),
        inputField("Title", content.contact.title, (value) => (content.contact.title = value), { full: true, multiline: true })
      )
    );
    repeater(body, "Contact button", content.contact.actions, { label: "New button", href: "#", style: "secondary", external: false }, (itemBody, item) => {
      itemBody.append(
        checkbox("Open in new tab", item.external === true, (checked) => (item.external = checked)),
        fieldGrid(
          inputField("Label", item.label, (value) => (item.label = value)),
          inputField("Link", item.href, (value) => (item.href = value)),
          selectField("Style", item.style, [{ label: "Primary", value: "primary" }, { label: "Secondary", value: "secondary" }], (value) => (item.style = value))
        )
      );
    });
  }

  function render() {
    editor.replaceChildren();
    renderSitePanel();
    renderSectionsPanel();
    renderHeroPanel();
    renderHighlightsPanel();
    renderExpertisePanel();
    renderProjectsPanel();
    renderPostPanel();
    renderAboutPanel();
    renderProofPanel();
    renderCustomPanel();
    renderContactPanel();
  }

  async function openContentFile() {
    if (hasLocalServer) {
      const response = await fetch("content.js", { cache: "no-store" });
      if (!response.ok) throw new Error("Could not load content.js from the local editor server.");
      content = parseContentFile(await response.text());
      dirty = false;
      render();
      setStatus("Loaded content.js from the local editor server.");
      return;
    }

    if (!window.showOpenFilePicker) {
      setStatus("This browser cannot open files directly. You can still edit the loaded content and use Download content.js.");
      return;
    }

    const [handle] = await window.showOpenFilePicker({
      types: [{ description: "JavaScript", accept: { "text/javascript": [".js"] } }],
      multiple: false,
    });
    const file = await handle.getFile();
    const text = await file.text();
    content = parseContentFile(text);
    fileHandle = handle;
    dirty = false;
    render();
    setStatus(`Opened ${file.name}`);
  }

  async function saveContentFile() {
    if (hasLocalServer) {
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content),
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      dirty = false;
      setStatus("Saved content.js. Refresh the preview page to see the latest changes.");
      return;
    }

    if (!fileHandle && window.showSaveFilePicker) {
      fileHandle = await window.showSaveFilePicker({
        suggestedName: "content.js",
        types: [{ description: "JavaScript", accept: { "text/javascript": [".js"] } }],
      });
    }

    if (!fileHandle) {
      downloadContentFile();
      setStatus("Direct save is unavailable in this browser. A content.js download was created.");
      return;
    }

    const writable = await fileHandle.createWritable();
    await writable.write(contentFileText());
    await writable.close();
    dirty = false;
    setStatus("Saved content.js");
  }

  function downloadContentFile() {
    const blob = new Blob([contentFileText()], { type: "text/javascript" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "content.js";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  openButton.addEventListener("click", () => openContentFile().catch((error) => setStatus(error.message)));
  saveButton.addEventListener("click", () => saveContentFile().catch((error) => setStatus(error.message)));
  downloadButton.addEventListener("click", () => {
    downloadContentFile();
    setStatus("Downloaded content.js");
  });

  window.addEventListener("beforeunload", (event) => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });

  render();
})();
