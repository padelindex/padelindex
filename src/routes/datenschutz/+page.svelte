<svelte:head>
	<title>Datenschutz — PadelIndex</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href="/">
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
	</div>
</nav>

<section class="sec">
	<div class="wrap legal" style="max-width: 72ch">
		<span class="eyebrow">Rechtliches</span>
		<h2 style="margin-top: 18px">Datenschutzerklärung</h2>

		<h3>1. Verantwortlicher</h3>
		<p>
			Alec Hahn<br />
			Geltingerstrasse 12<br />
			82515 Wolfratshausen<br />
			Deutschland<br />
			E-Mail: <a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>
		</p>

		<h3>2. Übersicht der Verarbeitungen</h3>
		<p>
			PadelIndex verarbeitet zwei Arten personenbezogener Daten: die E-Mail-Adresse, die du beim
			Eintragen in die Warteliste oder bei der Registrierung angibst, und die öffentlichen
			Ranglisten-Daten von Padel-Spielerinnen und -Spielern (Name bzw. abgekürzter Name, Level,
			Match-Ergebnisse). Beide sind unten getrennt beschrieben.
		</p>

		<h3>3. Hosting</h3>
		<p>
			Diese Website läuft auf Cloudflare Workers. Cloudflare verarbeitet dabei zwangsläufig
			technische Verbindungsdaten (u. a. IP-Adresse, Zeitpunkt des Zugriffs, angefragte Seite), um
			die Website überhaupt ausliefern zu können. Rechtsgrundlage ist unser berechtigtes Interesse
			an einem stabilen, sicheren Betrieb (Art. 6 Abs. 1 lit. f DSGVO). Diese Zugriffsdaten werden
			nicht mit den Ranglisten- oder Kontodaten verknüpft.
		</p>

		<h3>4. Auftragsverarbeiter</h3>
		<p>Wir setzen folgende externe Dienste ein, die dabei als Auftragsverarbeiter für uns tätig werden:</p>
		<p>
			<b>Supabase</b> (Datenbank, Login) — speichert alle Konto-, Ranking- und Match-Daten.
			<!--
			  TODO (Formulierungsvorschlag, bitte prüfen und ergänzen sobald bekannt):
			  "Serverstandort: [Region aus den Supabase-Projekteinstellungen einsetzen,
			  z. B. EU Central (Frankfurt)]. Mit Supabase besteht ein
			  Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO: [Ja/Nein — falls noch
			  nicht abgeschlossen, über das Supabase-Dashboard unter Project Settings →
			  Legal Documents nachholen]."
			-->
			Serverstandort und Stand des Auftragsverarbeitungsvertrags: wird ergänzt.
		</p>
		<p>
			<b>Cloudflare</b> (Hosting, Auslieferung) — liefert die Website aus und verarbeitet dafür
			technische Verbindungsdaten (siehe Abschnitt 3).
			<!--
			  TODO (Formulierungsvorschlag): "Cloudflare ist ein US-Anbieter mit
			  Serverstandorten weltweit (Edge-Netzwerk); die konkrete Verarbeitung für diese
			  Website läuft über [Region/Vertragsgrundlage aus dem Cloudflare-Vertrag
			  einsetzen]. Mit Cloudflare besteht ein Auftragsverarbeitungsvertrag inkl.
			  Standardvertragsklauseln für Datenübermittlungen in die USA."
			-->
			Vertragsgrundlage für die Datenübermittlung: wird ergänzt.
		</p>
		<p>
			<b>Resend</b> (Transaktions-E-Mails) — verschickt in unserem Auftrag E-Mails, die für den
			Betrieb notwendig sind (z. B. Bestätigungslinks, Benachrichtigungen über Spielanfragen und
			Challenges). Resend erhält dafür die E-Mail-Adresse und den Inhalt der jeweiligen Nachricht.
			<!--
			  TODO (Formulierungsvorschlag): "Mit Resend besteht ein Auftragsverarbeitungsvertrag
			  nach Art. 28 DSGVO: [Ja/Nein — Stand prüfen]."
			-->
		</p>

		<h3>5. Warteliste</h3>
		<p>
			Wenn du dich auf padelindex.de in die Warteliste einträgst, speichern wir ausschließlich die
			von dir angegebene E-Mail-Adresse, um dich über den Start des Pilotbetriebs zu informieren.
			Rechtsgrundlage ist deine Einwilligung (Art. 6 Abs. 1 lit. a DSGVO). Du kannst diese
			Einwilligung jederzeit formlos per E-Mail an
			<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>
			widerrufen; wir löschen den Eintrag dann umgehend.
		</p>

		<h3>6. Öffentliche Spielerdaten und Rangliste</h3>
		<p>
			Kern von PadelIndex ist eine öffentlich einsehbare Rangliste je Verein: Name (oder bei noch
			nicht beanspruchten Profilen abgekürzt, z. B. „Robin K.“), Level-Wert, Anzahl Matches und
			grober Formverlauf.
		</p>
		<p>
			Für <b>registrierte, selbst angemeldete</b> Spielerinnen und Spieler ist die Verarbeitung zur
			Bereitstellung des Rankings Teil der Vertragserfüllung (Art. 6 Abs. 1 lit. b DSGVO) — wer sich
			registriert, tut das ausdrücklich, um in einem Ranking zu erscheinen.
		</p>
		<p>
			Für Profile, die aus <b>importierten Liga-Ergebnissen</b> stammen und noch nicht von der
			betroffenen Person selbst beansprucht wurden, liegt noch keine Einwilligung vor. Hier stützen
			wir uns auf unser berechtigtes Interesse, bestehende Liga-Ergebnisse sichtbar und vergleichbar
			zu machen (Art. 6 Abs. 1 lit. f DSGVO) — deshalb sind diese Namen grundsätzlich nur abgekürzt
			sichtbar, nie im Klartext. Dagegen kannst du jederzeit Widerspruch einlegen (Art. 21 DSGVO,
			siehe Abschnitt 9) — dein Profil verschwindet dann aus der öffentlichen Ansicht, ohne dass du
			dafür ein Konto brauchst.
			<!--
			  TODO (rechtliche Prüfung empfohlen): Die Einordnung importierter, unbeanspruchter
			  Profile unter Art. 6 Abs. 1 lit. f DSGVO (statt Einwilligung) ist eine begründbare,
			  aber keine abschließend geprüfte rechtliche Bewertung. Vor größerem Rollout
			  (mehr Vereine, mehr Spieler) anwaltlich gegenprüfen lassen.
			-->
		</p>

		<h3>7. Cookies und lokale Speicherung</h3>
		<p>
			Wir setzen ausschließlich technisch notwendige Cookies ein, um dich nach der Anmeldung
			eingeloggt zu halten (Session-Cookie von Supabase Auth). Es gibt aktuell keine
			Analyse-, Marketing- oder Tracking-Cookies und keine Werbenetzwerke auf dieser Seite.
		</p>

		<h3>8. Speicherdauer</h3>
		<p>
			Konto- und Ranglisten-Daten speichern wir, solange dein Konto bzw. Profil besteht.
			Warteliste-Einträge speichern wir bis zum Pilotstart oder bis zu deinem Widerruf. Nach einer
			Löschung oder einem erfolgreichen Widerspruch (Abschnitt 6 und 9) entfernen wir die
			betroffenen Daten aus der öffentlichen Ansicht sofort; die vollständige Löschung aus Backups
			erfolgt im Rahmen der technisch üblichen Backup-Zyklen.
		</p>

		<h3>9. Deine Rechte</h3>
		<p>Du hast jederzeit das Recht auf:</p>
		<p>
			Auskunft über die zu dir gespeicherten Daten (Art. 15 DSGVO), Berichtigung unrichtiger Daten
			(Art. 16 DSGVO), Löschung (Art. 17 DSGVO), Einschränkung der Verarbeitung (Art. 18 DSGVO),
			Datenübertragbarkeit (Art. 20 DSGVO) sowie Widerspruch gegen eine auf berechtigtem Interesse
			gestützte Verarbeitung (Art. 21 DSGVO). Für dein eigenes, öffentliches Spielerprofil findest
			du dazu einen direkten Link „Ich möchte hier nicht gelistet sein“ auf deiner Profilseite, der
			ohne Login funktioniert. Für alle anderen Anliegen genügt eine E-Mail an
			<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>.
		</p>
		<p>
			Du hast außerdem das Recht, dich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für
			uns zuständig ist das Bayerische Landesamt für Datenschutzaufsicht (BayLDA).
		</p>

		<h3>10. Sicherheit</h3>
		<p>
			Die Übertragung zwischen deinem Browser und unseren Servern ist durchgehend TLS-verschlüsselt
			(https). Zugriff auf Kontodaten und nicht-öffentliche Profildaten ist über Zugriffsregeln
			(Row Level Security) auf Datenbankebene beschränkt.
		</p>
	</div>
</section>

<style>
	.legal {
		margin-top: 20px;
	}
	.legal h3 {
		font-size: 18px;
		margin-top: 40px;
		margin-bottom: 12px;
	}
	.legal h3:first-of-type {
		margin-top: 28px;
	}
	.legal p {
		color: var(--muted-dark);
		margin-bottom: 0;
	}
	.legal a {
		color: inherit;
		text-decoration: underline;
	}
</style>
