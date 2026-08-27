/* =============================================================
   PadelIndex — embed.js
   Ein Custom Element, keine Abhängigkeiten, Shadow DOM.
   Einbau auf der Vereinsseite:

     <script src="https://padelindex.de/embed.js" async></script>
     <padelindex-leaderboard club="stc-oberland" limit="10">
     </padelindex-leaderboard>

   Attribute:
     club     (Pflicht)  Slug des Vereins
     limit                Anzahl Zeilen, Standard 10
     accent               Clubfarbe als Hex, überschreibt --pi-accent
     api                  API-Basis, für lokale Tests
   ============================================================= */

(() => {
  'use strict';

  // Reines Debugging/Support-Hilfsmittel ("welche Version läuft bei
  // diesem Verein?") — hat keine Funktion im Skript selbst. Bei jeder
  // inhaltlichen Änderung hochzählen, siehe docs/embed-integration.md
  // (dort auch der aktuelle SRI-Hash, der nach jeder Änderung neu
  // berechnet werden muss).
  const EMBED_VERSION = '1.0.1';

  const API_DEFAULT = 'https://padelindex.de/api/v1';
  const SIGMA_MAX = 25 / 3; // Startunsicherheit -> confidence 0

  const CSS = `
    :host {
      --pi-surface: #FBFBF9;
      --pi-ink: #16232B;
      --pi-muted: #6B7C85;
      --pi-line: #E4E8E7;
      --pi-accent: #0F6E5C;
      --pi-signal: #8F5A15;
      --pi-radius: 10px;

      display: block;
      contain: content;
      color: var(--pi-ink);
      background: var(--pi-surface);
      border: 1px solid var(--pi-line);
      border-radius: var(--pi-radius);
      font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI",
                   Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 15px;
      line-height: 1.45;
      overflow: hidden;
    }

    * { box-sizing: border-box; margin: 0; }

    header {
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 16px 12px;
      border-bottom: 1px solid var(--pi-line);
    }
    .club {
      font-size: 15px;
      font-weight: 600;
      letter-spacing: -0.01em;
    }
    .eyebrow {
      font-size: 11px;
      font-weight: 500;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--pi-muted);
    }

    ol { list-style: none; padding: 0; }

    li {
      display: grid;
      grid-template-columns: 2.2ch 1fr auto auto;
      align-items: center;
      gap: 12px;
      padding: 10px 16px;
      border-bottom: 1px solid var(--pi-line);
    }
    li:last-child { border-bottom: 0; }

    .rank, .rating, .matches {
      font-variant-numeric: tabular-nums;
      font-feature-settings: "tnum" 1;
    }
    .rank { color: var(--pi-muted); font-size: 13px; text-align: right; }

    .who { min-width: 0; }
    .name {
      display: block;
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .meta { font-size: 12px; color: var(--pi-muted); }
    .meta[data-provisional="true"] { color: var(--pi-signal); }

    .matches { font-size: 12px; color: var(--pi-muted); }

    .score { display: flex; align-items: center; gap: 8px; }
    .rating { font-size: 17px; font-weight: 600; letter-spacing: -0.02em; }

    .ring { width: 22px; height: 22px; flex: none; display: block; }
    .ring circle { fill: none; stroke-width: 2.5; }
    .ring .track { stroke: var(--pi-line); }
    .ring .fill {
      stroke: var(--pi-accent);
      stroke-linecap: round;
      transform: rotate(-90deg);
      transform-origin: 50% 50%;
    }

    footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 9px 16px;
      border-top: 1px solid var(--pi-line);
      font-size: 11px;
      color: var(--pi-muted);
    }
    footer a { color: inherit; text-decoration: none; border-bottom: 1px solid var(--pi-line); }
    footer a:hover { color: var(--pi-ink); }
    footer a:focus-visible { outline: 2px solid var(--pi-accent); outline-offset: 2px; }

    /* Zustände */
    .state { padding: 22px 16px; font-size: 14px; color: var(--pi-muted); }
    .state strong { display: block; color: var(--pi-ink); font-weight: 600; margin-bottom: 4px; }
    button {
      margin-top: 10px;
      font: inherit;
      font-size: 13px;
      padding: 6px 12px;
      color: var(--pi-ink);
      background: transparent;
      border: 1px solid var(--pi-line);
      border-radius: 6px;
      cursor: pointer;
    }
    button:hover { border-color: var(--pi-accent); }
    button:focus-visible { outline: 2px solid var(--pi-accent); outline-offset: 2px; }

    .skeleton { height: 13px; border-radius: 3px; background: var(--pi-line); }
    .skeleton.w-name { width: 58%; }
    .skeleton.w-score { width: 42px; }

    li.enter { animation: fade .28s ease both; }
    @keyframes fade { from { opacity: 0; transform: translateY(3px); } }
    @media (prefers-reduced-motion: reduce) {
      li.enter { animation: none; }
    }
  `;

  const esc = (s) =>
    String(s ?? '').replace(/[&<>"']/g, (c) =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );

  /** Bogen für den Confidence-Ring: 0 = leer, 1 = voll */
  function ring(confidence) {
    const c = Math.max(0, Math.min(1, Number(confidence) || 0));
    const r = 9;
    const circ = 2 * Math.PI * r;
    return `
      <svg class="ring" viewBox="0 0 22 22" aria-hidden="true">
        <circle class="track" cx="11" cy="11" r="${r}"></circle>
        <circle class="fill" cx="11" cy="11" r="${r}"
          stroke-dasharray="${(circ * c).toFixed(2)} ${circ.toFixed(2)}"></circle>
      </svg>`;
  }

  class Leaderboard extends HTMLElement {
    static get observedAttributes() {
      return ['club', 'limit', 'accent'];
    }

    constructor() {
      super();
      this.attachShadow({ mode: 'open' });
      this._data = null;
    }

    connectedCallback() {
      this.render();
      this.load();
    }

    attributeChangedCallback(name, oldV, newV) {
      if (oldV === newV || !this.shadowRoot.childElementCount) return;
      if (name === 'accent') this.applyAccent();
      else this.load();
    }

    get api() {
      return this.getAttribute('api') || API_DEFAULT;
    }
    get club() {
      return this.getAttribute('club') || '';
    }
    get limit() {
      const n = parseInt(this.getAttribute('limit') || '10', 10);
      return Number.isFinite(n) ? Math.max(3, Math.min(50, n)) : 10;
    }

    applyAccent() {
      const a = this.getAttribute('accent');
      if (a && /^#[0-9a-f]{3,8}$/i.test(a)) {
        this.shadowRoot.host.style.setProperty('--pi-accent', a);
      }
    }

    render(body) {
      this.shadowRoot.innerHTML = `<style>${CSS}</style>${body ?? this.skeleton()}`;
      this.applyAccent();
      const retry = this.shadowRoot.querySelector('[data-retry]');
      if (retry) retry.addEventListener('click', () => this.load());
    }

    skeleton() {
      const rows = Array.from({ length: Math.min(this.limit, 6) })
        .map(
          () => `<li>
            <span class="rank"></span>
            <span class="who"><span class="skeleton w-name"></span></span>
            <span></span>
            <span class="skeleton w-score"></span>
          </li>`
        )
        .join('');
      return `
        <header>
          <span class="club">Ranking</span>
          <span class="eyebrow">wird geladen</span>
        </header>
        <ol aria-busy="true">${rows}</ol>`;
    }

    state(title, text, retry) {
      return `
        <header><span class="club">Ranking</span></header>
        <div class="state">
          <strong>${esc(title)}</strong>${esc(text)}
          ${retry ? '<button data-retry type="button">Erneut versuchen</button>' : ''}
        </div>`;
    }

    async load() {
      if (!this.club) {
        this.render(this.state('Kein Verein angegeben', 'Dem Widget fehlt das Attribut club.'));
        return;
      }
      this.render();

      try {
        const url = `${this.api}/clubs/${encodeURIComponent(this.club)}/leaderboard?limit=${this.limit}`;
        const res = await fetch(url, { headers: { accept: 'application/json' } });

        if (res.status === 404) {
          this.render(
            this.state(
              'Verein nicht gefunden',
              'Diesen Verein gibt es bei PadelIndex noch nicht.'
            )
          );
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this._data = await res.json();
        this.paint();
      } catch (err) {
        this.render(
          this.state('Ranking gerade nicht erreichbar', 'Bitte in einem Moment nochmal.', true)
        );
      }
    }

    paint() {
      const d = this._data;
      const players = Array.isArray(d?.players) ? d.players : [];
      const clubName = esc(d?.club?.name || 'Ranking');

      if (players.length === 0) {
        this.render(
          this.state(
            'Noch keine bestätigten Matches',
            'Das Ranking startet mit dem ersten Ergebnis.'
          )
        );
        return;
      }

      const rows = players
        .map((p, i) => {
          const conf = p.confidence ?? 1 - Math.min(1, (p.sigma ?? SIGMA_MAX) / SIGMA_MAX);
          const meta = p.provisional
            ? `provisorisch · ${p.matches ?? 0} Matches`
            : `${p.matches ?? 0} Matches`;
          return `
            <li class="enter" style="animation-delay:${Math.min(i, 12) * 30}ms">
              <span class="rank">${p.rank ?? i + 1}</span>
              <span class="who">
                <span class="name">${esc(p.name)}</span>
                <span class="meta" data-provisional="${!!p.provisional}">${esc(meta)}</span>
              </span>
              <span class="matches"></span>
              <span class="score">
                ${ring(conf)}
                <span class="rating"
                  title="Sicherheit ${Math.round(conf * 100)} %">${Number(p.rating).toFixed(2)}</span>
              </span>
            </li>`;
        })
        .join('');

      const updated = d.updated_at
        ? new Date(d.updated_at).toLocaleDateString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
          })
        : '';

      this.render(`
        <header>
          <span class="club">${clubName}</span>
          <span class="eyebrow">Level-Ranking</span>
        </header>
        <ol>${rows}</ol>
        <footer>
          <span>${updated ? `Stand ${updated}` : ''}</span>
          <a href="https://padelindex.de/c/${encodeURIComponent(this.club)}"
             target="_blank" rel="noopener">PadelIndex</a>
        </footer>
      `);
    }
  }

  Leaderboard.version = EMBED_VERSION;

  if (!customElements.get('padelindex-leaderboard')) {
    customElements.define('padelindex-leaderboard', Leaderboard);
  }
})();
