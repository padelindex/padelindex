<!--
	Gemeinsamer Footer für /, /rating, /vereine, /faq, /ueber,
	/level-schaetzen, /ratgeber, /quiz (Website-Audit Block 5:
	"Footer-Erweiterung", Block 6: Level-Schätzer-Link ergänzt) — vorher
	dreifach kopierte Markup mit nur fünf Links, jetzt eine Stelle.

	Liga-Link zeigt bewusst direkt auf /liga/bavaro statt auf eine
	generische /liga-Übersicht: es gibt aktuell genau eine Liga, eine
	Index-Seite mit einem einzigen Eintrag wäre dünner Content ohne
	echten Mehrwert.

	Sprachumschalter (i18n-Plan Phase 3): einzige Stelle, an der /en und
	/es überhaupt verlinkt werden — ohne sie wären die lokalisierten
	Seiten nur per direkter URL oder nach Google-Indexierung erreichbar.
	localizeHref(path, {locale}) hängt den aktuellen, DELOKALISIERTEN
	Pfad um, damit "Englisch" auf /en/vereine landet, wenn man gerade
	/vereine liest — nicht immer zurück auf die Startseite.
-->
<script lang="ts">
	import { page } from '$app/state';
	import { m } from '$lib/paraglide/messages.js';
	import { deLocalizeHref, localizeHref, locales, type Locale } from '$lib/paraglide/runtime';

	const LOCALE_LABELS: Record<Locale, string> = { de: 'DE', en: 'EN', es: 'ES' };

	const currentPath = $derived(deLocalizeHref(page.url.pathname));
	const languageLinks = $derived(
		locales.map((locale) => ({
			locale,
			label: LOCALE_LABELS[locale],
			href: localizeHref(currentPath, { locale })
		}))
	);
</script>

<footer>
	<div class="wrap foot-in">
		<span>© 2026 PadelIndex</span>
		<div class="foot-links">
			<a href={localizeHref('/rating')}>{m.footer_rating()}</a>
			<a href={localizeHref('/level-schaetzen')}>{m.footer_level_schaetzer()}</a>
			<a href={localizeHref('/vereine')}>{m.footer_vereine()}</a>
			<a href={localizeHref('/karte')}>{m.footer_karte()}</a>
			<a href={localizeHref('/liga/bavaro')}>{m.footer_liga()}</a>
			<a href={localizeHref('/ratgeber')}>{m.footer_ratgeber()}</a>
			<a href={localizeHref('/ratgeber/padel-regeln')}>{m.footer_padel_regeln()}</a>
			<a href={localizeHref('/ratgeber/padel-ausruestung')}>{m.footer_padel_ausruestung()}</a>
			<a href={localizeHref('/quiz')}>{m.footer_padel_quiz()}</a>
			<a href={localizeHref('/ratgeber/padel-fuer-anfaenger')}>{m.footer_padel_fuer_anfaenger()}</a>
			<a href={localizeHref('/faq')}>{m.footer_faq()}</a>
			<a href={localizeHref('/ueber')}>{m.footer_ueber_uns()}</a>
			<a href={localizeHref('/anmelden')}>{m.footer_anmelden()}</a>
			<a href={localizeHref('/datenschutz')}>{m.footer_datenschutz()}</a>
			<a href={localizeHref('/impressum')}>{m.footer_impressum()}</a>
			<a href="mailto:kontakt@padelindex.de">{m.footer_kontakt()}</a>
		</div>
		<div class="foot-langs" aria-label={m.footer_sprache()}>
			{#each languageLinks as lang (lang.locale)}
				<a href={lang.href} lang={lang.locale} hreflang={lang.locale}>{lang.label}</a>
			{/each}
		</div>
	</div>
</footer>

<style>
	.foot-langs {
		display: flex;
		gap: 10px;
		font-family: var(--mono);
		font-size: 11.5px;
		letter-spacing: 0.04em;
	}

	.foot-langs a {
		opacity: 0.7;
		text-decoration: none;
	}

	.foot-langs a:hover,
	.foot-langs a:focus-visible {
		opacity: 1;
		text-decoration: underline;
	}
</style>
