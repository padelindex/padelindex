<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<svelte:head>
	<title>{m.imp_meta_title()}</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<nav class="nav">
	<div class="wrap nav-in">
		<a class="brand" href={localizeHref('/')}>
			<img src="/logo.svg" width="30" height="30" alt="" />
			<span>Padel<b>Index</b></span>
		</a>
	</div>
</nav>

<section class="sec">
	<div class="wrap legal" style="max-width: 72ch">
		<span class="eyebrow">{m.legal_eyebrow()}</span>
		<h2 style="margin-top: 18px">{m.imp_h2()}</h2>

		<h3>{m.imp_h3_1()}</h3>
		<p>
			Alec Hahn<br />
			Geltingerstrasse 12<br />
			82515 Wolfratshausen<br />
			{m.imp_address_country()}
		</p>

		<h3>{m.imp_h3_contact()}</h3>
		<p>E-Mail: <a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a></p>

		<h3>{m.imp_h3_responsible()}</h3>
		<p>
			Alec Hahn<br />
			Geltingerstrasse 12<br />
			82515 Wolfratshausen
		</p>

		<h3>{m.imp_h3_dispute()}</h3>
		<p>
			{m.imp_p_dispute()}
		</p>

		<h3>{m.imp_h3_liability_content()}</h3>
		<p>
			{m.imp_p_liability_content()}
		</p>

		<h3>{m.imp_h3_ugc()}</h3>
		<p>
			{m.imp_p_ugc_pre()}
			<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>
			{m.imp_p_ugc_post()}
		</p>

		<h3>{m.imp_h3_links()}</h3>
		<p>
			{m.imp_p_links()}
		</p>

		<h3>{m.imp_h3_copyright()}</h3>
		<p>
			{m.imp_p_copyright()}
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
