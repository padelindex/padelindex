<script lang="ts">
	import { onMount } from 'svelte';
	import { initLanding } from '$lib/landing-hero';

	onMount(() => initLanding());
</script>

<svelte:head>
	<title>PadelIndex — Das Ranking, das dein Spiel wirklich kennt.</title>
	<meta
		name="description"
		content="PadelIndex ist die unabhängige Rangliste für Padel-Amateure. Bayes'sches Rating für Doppel, Gegner-Bestätigung, vereinsübergreifend. Dein Level zählt überall, wo du spielst."
	/>
</svelte:head>

<!-- ============================ NAV ============================ -->
<nav class="nav">
  <div class="wrap nav-in">
    <a class="brand" href="#top" aria-label="PadelIndex Startseite">
      <svg viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="20" cy="20" r="13" fill="none" stroke="currentColor" stroke-width="3"
                stroke-dasharray="63.7 81.68" stroke-linecap="round" transform="rotate(-90 20 20)" opacity=".9"/>
        <g fill="currentColor">
          <rect x="12.6" y="21.5" width="3" height="6" rx="1.5"/>
          <rect x="18.5" y="17.5" width="3" height="10" rx="1.5"/>
          <rect x="24.4" y="13.5" width="3" height="14" rx="1.5"/>
        </g>
        <circle cx="7.2" cy="17.6" r="2.9" fill="currentColor"/>
      </svg>
      <span>Padel<b>Index</b></span>
    </a>
    <div class="nav-links">
      <a href="#problem">Warum</a>
      <a href="#rating">Rating</a>
      <a href="#tokens">Tokens</a>
      <a href="#vereine">Für Vereine</a>
    </div>
    <a class="btn btn-primary" href="#anmelden">Platz sichern</a>
  </div>
</nav>

<!-- ============================ HERO ============================ -->
<header class="hero" id="top">
  <div class="mullions" aria-hidden="true">
    <i style="left:12%"></i><i style="left:31%"></i><i style="left:50%"></i>
    <i style="left:69%"></i><i style="left:88%"></i>
  </div>
  <div class="wrap hero-in">
    <div>
      <span class="eyebrow rv">Rangliste für Padel-Amateure</span>
      <h1 class="rv" style="transition-delay:.06s">Das Ranking,<br>das dein Spiel<br><em>wirklich kennt.</em></h1>
      <p class="hero-sub rv" style="transition-delay:.12s">
        PadelIndex misst, wie stark du wirklich spielst — über Vereinsgrenzen hinweg,
        aus bestätigten Ergebnissen, mit einem Modell, das für Doppel gebaut ist
        statt für Schach.
      </p>
      <div class="hero-cta rv" style="transition-delay:.18s">
        <a class="btn btn-primary" href="#anmelden">Platz auf der Liste sichern</a>
        <a class="btn btn-ghost" href="#rating">So rechnet es</a>
      </div>
      <p class="hero-note rv" style="transition-delay:.24s">Pilotphase · Oberland &amp; Umgebung</p>
    </div>

    <!-- Lebende Verteilung: das Signature-Element -->
    <div class="panel rv" style="transition-delay:.1s">
      <div class="panel-head">
        <div>
          <div class="who">Deine Bewertung</div>
          <div class="club">STC Oberland · Doppel</div>
        </div>
        <div style="position:relative;display:grid;place-items:center">
          <svg class="ring" viewBox="0 0 44 44" aria-hidden="true">
            <circle class="track" cx="22" cy="22" r="18"></circle>
            <circle class="fill" id="heroRing" cx="22" cy="22" r="18"
                    stroke-dasharray="0 113.1"></circle>
          </svg>
          <span class="ring-label num" id="heroConf">0%</span>
        </div>
      </div>

      <div class="score-row">
        <div class="score num" id="heroScore">3.10</div>
      </div>

      <div class="curve-box">
        <svg viewBox="0 0 600 210" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#16A394" stop-opacity=".42"/>
              <stop offset="100%" stop-color="#16A394" stop-opacity="0"/>
            </linearGradient>
          </defs>
          <line class="curve-axis" x1="0" y1="180" x2="600" y2="180"></line>
          <line class="curve-peak" id="heroPeak" x1="300" y1="20" x2="300" y2="180"></line>
          <path class="curve-fill" id="heroFill" d=""></path>
          <path class="curve-stroke" id="heroCurve" d=""></path>
          <g class="curve-tick">
            <text x="4" y="199">0</text><text x="196" y="199">2</text>
            <text x="392" y="199">4</text><text x="583" y="199">7</text>
          </g>
        </svg>
      </div>

      <dl class="readout">
        <div><dt>Matches</dt><dd id="heroMatches">1</dd></div>
        <div><dt>Sicherheit</dt><dd id="heroSigma">niedrig</dd></div>
        <div><dt>Spanne</dt><dd id="heroRange">±1.9</dd></div>
      </dl>

      <div class="slider">
        <label for="mSlider"><span>Matches nachziehen</span><span class="num" id="sliderVal">1</span></label>
        <input id="mSlider" type="range" min="1" max="60" value="1"
               aria-label="Anzahl gespielter Matches">
      </div>
    </div>
  </div>
</header>

<!-- ============================ PROBLEM ============================ -->
<section class="sec" id="problem" style="background:var(--night-2)">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow rv">Das Problem</span>
      <h2 class="rv" style="transition-delay:.05s">Fast jeder kennt sein Level nur ungefähr.</h2>
      <p class="muted rv" style="transition-delay:.1s">
        Level werden heute geschätzt, in Fragebögen angeklickt oder pro Verein anders
        vergeben. Sobald du woanders spielst, gilt die Zahl nichts mehr. Das sind die
        vier Sätze, die man auf jedem Platz hört.
      </p>
    </div>

    <div class="gripes">
      <article class="gripe rv">
        <span class="tag">Stillstand</span>
        <p class="q">„Ich bin klar besser geworden — die Zahl bewegt sich trotzdem nicht."</p>
        <p class="a">Bei PadelIndex bewegt sich dein Wert nach jedem bestätigten Match, und du siehst,
          welcher Anteil davon aus Gegnerstärke, Satzverlauf und Serie kommt.</p>
      </article>
      <article class="gripe rv" style="transition-delay:.07s">
        <span class="tag">Partnerpech</span>
        <p class="q">„Mein Partner hatte einen schlechten Tag. Warum sinkt mein Level?"</p>
        <p class="a">Weil klassisches Elo für 1-gegen-1 gebaut ist. Unser Modell bewertet dich
          innerhalb des Teams — wer ein schwächeres Duo trägt, wird nicht dafür bestraft.</p>
      </article>
      <article class="gripe rv" style="transition-delay:.14s">
        <span class="tag">Aufgeblähte Werte</span>
        <p class="q">„Der spielt nur in seiner Runde und steht plötzlich ganz oben."</p>
        <p class="a">Jedes Ergebnis braucht die Bestätigung des Gegnerteams. Ergebnisse ohne
          Gegenüber zählen nicht — erfundene Matches also auch nicht.</p>
      </article>
      <article class="gripe rv" style="transition-delay:.21s">
        <span class="tag">Blackbox</span>
        <p class="q">„6:1, 6:2 gewonnen, Wert steigt um nichts. Verstehe ich nicht."</p>
        <p class="a">Deshalb legen wir die Rechnung offen: nach jedem Match steht da, was sich
          verändert hat und warum. Auch dann, wenn die Zahl nicht gefällt.</p>
      </article>
    </div>
  </div>
</section>

<!-- ============================ RATING ============================ -->
<section class="sec sec-light" id="rating">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow rv">So rechnet es</span>
      <h2 class="rv" style="transition-delay:.05s">Ein Wert mit Genauigkeitsgrad.</h2>
      <p class="muted rv" style="transition-delay:.1s">
        Wir speichern für dich keine einzelne Zahl, sondern eine Verteilung: eine Schätzung
        deines Könnens plus die Unsicherheit dazu. Angezeigt wird der konservative Rand
        dieser Verteilung auf einer Skala von 0 bis 7. Je mehr du spielst, desto enger
        wird die Kurve — und desto ruhiger dein Wert.
      </p>
    </div>

    <div class="factors">
      <article class="factor rv">
        <span class="k">01 — Erwartung</span>
        <h3>Wen du geschlagen hast</h3>
        <p>Ein Sieg gegen ein stärkeres Duo sagt mehr aus als einer gegen ein schwächeres.
          Überraschungen enthalten die meiste Information, also wiegen sie am schwersten.</p>
      </article>
      <article class="factor rv" style="transition-delay:.07s">
        <span class="k">02 — Deutlichkeit</span>
        <h3>Wie klar es war</h3>
        <p>6:0, 6:0 ist eine andere Aussage als 7:6, 5:7, 7:5. Der Satzverlauf geht in jede
          Rechnung ein — eine knappe Niederlage gegen starke Gegner kostet dich kaum etwas.</p>
      </article>
      <article class="factor rv" style="transition-delay:.14s">
        <span class="k">03 — Sicherheit</span>
        <h3>Wie gut wir dich kennen</h3>
        <p>Am Anfang schwankt dein Wert stark, das ist Absicht: nach etwa zehn bis
          fünfzehn Matches steht dein Bereich. Danach wird nur noch feinjustiert.</p>
      </article>
    </div>

    <table class="cmp rv">
      <thead>
        <tr><th>Merkmal</th><th>PadelIndex</th><th>Selbsteinschätzung &amp; einfaches Elo</th></tr>
      </thead>
      <tbody>
        <tr>
          <th>Startwert</th>
          <td data-l="PadelIndex" class="yes">Vorsichtig gesetzt, kalibriert sich schnell</td>
          <td data-l="Üblich" class="no">Fragebogen, oft danebenliegend</td>
        </tr>
        <tr>
          <th>Doppel</th>
          <td data-l="PadelIndex" class="yes">Einzelwert innerhalb des Teams</td>
          <td data-l="Üblich" class="no">Paar wird als eine Einheit behandelt</td>
        </tr>
        <tr>
          <th>Satzverlauf</th>
          <td data-l="PadelIndex" class="yes">Fließt in jede Rechnung ein</td>
          <td data-l="Üblich" class="no">Ignoriert — 6:0 zählt wie 7:6</td>
        </tr>
        <tr>
          <th>Bestätigung</th>
          <td data-l="PadelIndex" class="yes">Gegnerteam bestätigt, 48 Stunden Frist</td>
          <td data-l="Üblich" class="no">Häufig gar keine</td>
        </tr>
        <tr>
          <th>Nach einer Pause</th>
          <td data-l="PadelIndex" class="yes">Unsicherheit wächst, du kalibrierst neu</td>
          <td data-l="Üblich" class="no">Wert bleibt einfach stehen</td>
        </tr>
        <tr>
          <th>Nachvollziehbar</th>
          <td data-l="PadelIndex" class="yes">Jede Änderung aufgeschlüsselt</td>
          <td data-l="Üblich" class="no">Keine Erklärung</td>
        </tr>
        <tr>
          <th>Gilt wo?</th>
          <td data-l="PadelIndex" class="yes">Vereinsübergreifend, plattformunabhängig</td>
          <td data-l="Üblich" class="no">Pro Verein oder pro App eigene Skala</td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<!-- ============================ TOKENS ============================ -->
<section class="sec" id="tokens">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow rv">Index Tokens</span>
      <h2 class="rv" style="transition-delay:.05s">Spielen zahlt sich aus. Wörtlich.</h2>
      <p class="muted rv" style="transition-delay:.1s">
        Für jedes bestätigte Match bekommst du Tokens. Einlösen kannst du sie bei deinem
        Verein — gegen Trainerstunden, Ausrüstung, Startgebühren. Wie Meilen, nur für
        Padel.
      </p>
    </div>

    <div class="tokens">
      <div class="ledger rv">
        <div class="ledger-row ledger-head"><span>Bewegung</span><span>Tokens</span></div>
        <div class="ledger-row">
          <div><div>Match gespielt</div><div class="why">jedes bestätigte Ergebnis</div></div>
          <div class="amt">+10</div>
        </div>
        <div class="ledger-row">
          <div><div>Match gewonnen</div><div class="why">zusätzlich zum Grundwert</div></div>
          <div class="amt">+15</div>
        </div>
        <div class="ledger-row">
          <div><div>Vereinsliga</div><div class="why">offiziell erfasste Partie</div></div>
          <div class="amt">+10</div>
        </div>
        <div class="ledger-row">
          <div><div>50. Match</div><div class="why">Meilenstein</div></div>
          <div class="amt">+100</div>
        </div>
        <div class="ledger-row out">
          <div><div>Trainerstunde eingelöst</div><div class="why">Prämie deines Vereins</div></div>
          <div class="amt">−500</div>
        </div>
      </div>

      <div class="rv" style="transition-delay:.08s">
        <ul class="rules">
          <li><b>Nie Abzug durch Niederlagen.</b> Tokens werden gutgeschrieben, nicht eingesetzt.
            Wer verliert, verliert nichts außer dem Match.</li>
          <li><b>Kein Handel zwischen Spielern.</b> Keine Übertragung, keine Auszahlung,
            keine Kurse. Tokens sind ein Guthaben bei deinem Verein, nichts weiter.</li>
          <li><b>Prämien macht der Verein.</b> Jeder Club pflegt seinen eigenen Katalog —
            von Bällen über Bespannung bis zur Platzstunde.</li>
          <li><b>Erst bestätigt, dann gutgeschrieben.</b> Tokens entstehen, wenn das
            Gegnerteam das Ergebnis bestätigt hat. Nicht vorher.</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ============================ VEREINE ============================ -->
<section class="sec sec-light" id="vereine">
  <div class="wrap">
    <div class="sec-head">
      <span class="eyebrow rv">Für Vereine</span>
      <h2 class="rv" style="transition-delay:.05s">Die Rangliste läuft auf eurer Seite.</h2>
      <p class="muted rv" style="transition-delay:.1s">
        Eine Zeile Code, und das Ranking eures Vereins steht auf eurer Website — in euren
        Farben, ohne Plugin-Chaos, ohne dass ihr Daten pflegen müsst. Die Spieler tragen
        die Ergebnisse selbst ein, das Gegnerteam bestätigt.
      </p>
    </div>

    <div class="widget-demo">
      <div class="rv">
        <div class="lb">
          <div class="lb-head"><span class="n">STC Oberland</span><span class="e">Level-Ranking</span></div>
          <ol>
            <li>
              <span class="r">1</span>
              <span><span class="nm">Max M.</span><span class="mt">34 Matches</span></span>
              <span class="sc">
                <svg class="mini" viewBox="0 0 22 22"><circle class="t" cx="11" cy="11" r="9"/><circle class="f" cx="11" cy="11" r="9" stroke-dasharray="47.4 56.5"/></svg>
                <span class="v">4.82</span>
              </span>
            </li>
            <li>
              <span class="r">2</span>
              <span><span class="nm">Jonas K.</span><span class="mt">41 Matches</span></span>
              <span class="sc">
                <svg class="mini" viewBox="0 0 22 22"><circle class="t" cx="11" cy="11" r="9"/><circle class="f" cx="11" cy="11" r="9" stroke-dasharray="50.8 56.5"/></svg>
                <span class="v">4.61</span>
              </span>
            </li>
            <li>
              <span class="r">3</span>
              <span><span class="nm">Sofia B.</span><span class="mt">28 Matches</span></span>
              <span class="sc">
                <svg class="mini" viewBox="0 0 22 22"><circle class="t" cx="11" cy="11" r="9"/><circle class="f" cx="11" cy="11" r="9" stroke-dasharray="42.4 56.5"/></svg>
                <span class="v">4.40</span>
              </span>
            </li>
            <li>
              <span class="r">4</span>
              <span><span class="nm">Tobias R.</span><span class="mt prov">provisorisch · 6 Matches</span></span>
              <span class="sc">
                <svg class="mini" viewBox="0 0 22 22"><circle class="t" cx="11" cy="11" r="9"/><circle class="f" cx="11" cy="11" r="9" stroke-dasharray="19.8 56.5"/></svg>
                <span class="v">3.95</span>
              </span>
            </li>
            <li>
              <span class="r">5</span>
              <span><span class="nm">Elena V.</span><span class="mt">52 Matches</span></span>
              <span class="sc">
                <svg class="mini" viewBox="0 0 22 22"><circle class="t" cx="11" cy="11" r="9"/><circle class="f" cx="11" cy="11" r="9" stroke-dasharray="53.1 56.5"/></svg>
                <span class="v">3.88</span>
              </span>
            </li>
          </ol>
          <div class="lb-foot"><span>Stand 17.08.2026</span><span>PadelIndex</span></div>
        </div>
        <p class="muted" style="margin-top:14px;font-size:13px">
          Der Ring zeigt, wie sicher der Wert ist. Halb gefüllt heißt: da stehen noch wenige
          Matches hinter der Zahl.
        </p>
      </div>

      <div class="rv" style="transition-delay:.08s">
        <div class="snippet">
&lt;<span class="t">script</span> <span class="at">src</span>="https://padelindex.de/embed.js" <span class="at">async</span>&gt;&lt;/<span class="t">script</span>&gt;<br><br>&lt;<span class="t">padelindex-leaderboard</span><br>&nbsp;&nbsp;<span class="at">club</span>="stc-oberland"<br>&nbsp;&nbsp;<span class="at">limit</span>="10"<br>&nbsp;&nbsp;<span class="at">accent</span>="#0F6E5C"&gt;<br>&lt;/<span class="t">padelindex-leaderboard</span>&gt;
        </div>
        <p class="muted" style="margin-top:18px;font-size:14px">
          Läuft in WordPress, Elementor, Wix und allem, was HTML erlaubt. Die Styles sind
          gekapselt — euer Theme kann das Widget nicht zerlegen, und das Widget nicht euer Theme.
          Für WordPress gibt es zusätzlich einen Shortcode.
        </p>
      </div>
    </div>

    <div class="tiers">
      <div class="tier rv">
        <span class="lvl">Kostenlos</span>
        <h4>Einstieg</h4>
        <ul>
          <li>Top 10 des Vereins</li>
          <li>Spielerprofile öffentlich</li>
          <li>Hinweis auf PadelIndex</li>
        </ul>
      </div>
      <div class="tier hl rv" style="transition-delay:.06s">
        <span class="lvl">Basic</span>
        <h4>Vereinsranking</h4>
        <ul>
          <li>Vollständige Tabelle</li>
          <li>Filter nach Level, Geschlecht, Zeitraum</li>
          <li>Clubfarben und Logo</li>
          <li>Liga-Ergebnisse importieren</li>
        </ul>
      </div>
      <div class="tier rv" style="transition-delay:.12s">
        <span class="lvl">Pro</span>
        <h4>Volle Integration</h4>
        <ul>
          <li>Matchfinder nach Level</li>
          <li>Prämienkatalog für Tokens</li>
          <li>Eigene Subdomain</li>
          <li>Hinweis abschaltbar</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<!-- ============================ CTA ============================ -->
<section class="cta" id="anmelden">
  <div class="mullions" aria-hidden="true">
    <i style="left:20%"></i><i style="left:40%"></i><i style="left:60%"></i><i style="left:80%"></i>
  </div>
  <div class="wrap cta-in">
    <span class="eyebrow rv">Pilotphase</span>
    <h2 class="rv" style="transition-delay:.05s">Der erste Wert entsteht<br>mit deinem ersten Match.</h2>
    <p class="muted rv" style="transition-delay:.1s; margin-top:22px">
      Wir starten mit zwei Vereinen im Oberland. Trag dich ein, dann melden wir uns,
      sobald dein Club dabei ist — oder wir fragen ihn für dich.
    </p>
    <div class="signup rv" style="transition-delay:.15s">
      <input id="mail" type="email" placeholder="deine@mail.de" aria-label="E-Mail-Adresse">
      <button class="btn btn-primary" id="joinBtn" type="button">Platz sichern</button>
    </div>
    <p class="signup-msg num" id="joinMsg" role="status"></p>
  </div>
</section>

<footer>
  <div class="wrap foot-in">
    <span>© 2026 PadelIndex</span>
    <div class="foot-links">
      <a href="#rating">Rating</a>
      <a href="#vereine">Vereine</a>
      <a href="/datenschutz">Datenschutz</a>
      <a href="/impressum">Impressum</a>
    </div>
  </div>
</footer>
