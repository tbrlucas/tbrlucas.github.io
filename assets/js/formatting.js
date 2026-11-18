(() => {
  const esc = value => String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[char]);
  const safeUrl = value => /^https:\/\//i.test(String(value || "").trim()) ? esc(String(value).trim()) : "";
  const inline = value => {
    let text = esc(value);
    text = text.replace(/!\[([^\]]*)\]\((https:\/\/[^)\s]+)\)/g, (match, alt, url) => {
      const safe = safeUrl(url);
      return safe ? '<img class="formatted-image" src="' + safe + '" alt="' + alt + '" loading="lazy" referrerpolicy="no-referrer">' : alt;
    });
    text = text.replace(/\[([^\]]+)\]\((https:\/\/[^)\s]+)\)/g, (match, label, url) => {
      const safe = safeUrl(url);
      return safe ? '<a href="' + safe + '" target="_blank" rel="noopener noreferrer">' + label + '</a>' : label;
    });
    text = text.replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>");
    text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, "$1<em>$2</em>");
    return text;
  };
  const render = value => {
    const lines = String(value || "").replace(/\r/g, "").split("\n");
    const output = [];
    let i = 0;
    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) { i++; continue; }
      const heading = /^(#{1,2})\s+(.+)$/.exec(line.trim());
      if (heading) {
        const tag = heading[1].length === 1 ? "h2" : "h3";
        output.push("<" + tag + ">" + inline(heading[2]) + "</" + tag + ">");
        i++; continue;
      }
      if (/^\s*-\s+/.test(line)) {
        const items = [];
        while (i < lines.length && /^\s*-\s+/.test(lines[i])) {
          items.push("<li>" + inline(lines[i].replace(/^\s*-\s+/, "")) + "</li>");
          i++;
        }
        output.push("<ul>" + items.join("") + "</ul>");
        continue;
      }
      const paragraph = [];
      while (i < lines.length && lines[i].trim()
        && !/^(#{1,2})\s+/.test(lines[i].trim())
        && !/^\s*-\s+/.test(lines[i])) {
        paragraph.push(inline(lines[i]));
        i++;
      }
      output.push("<p>" + paragraph.join("<br>") + "</p>");
    }
    return output.join("\n");
  };
  window.TBRLucasFormatting = Object.freeze({render});
})();