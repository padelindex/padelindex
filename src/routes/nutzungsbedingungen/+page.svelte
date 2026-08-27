<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import MinimalNav from '$lib/components/MinimalNav.svelte';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<svelte:head>
	<title>{m.nb_meta_title()}</title>
	<meta name="robots" content="noindex, follow" />
</svelte:head>

<MinimalNav />

<section class="sec">
	<div class="wrap legal" style="max-width: 72ch">
		<span class="eyebrow">{m.legal_eyebrow()}</span>
		<h1 style="margin-top: 18px">{m.nb_h2()}</h1>

		<h3>{m.nb_h3_1()}</h3>
		<p>
			{m.nb_p1()}
		</p>

		<h3>{m.nb_h3_2()}</h3>
		<p>
			{m.nb_p2()}
		</p>

		<h3>{m.nb_h3_3()}</h3>
		<p>
			{m.nb_p3()}
		</p>

		<h3>{m.nb_h3_4()}</h3>
		<p>
			{m.nb_p4()}
		</p>

		<h3>{m.nb_h3_5()}</h3>
		<p>
			{m.nb_p5_pre()}
			<a href={localizeHref('/impressum')}>{m.nb_p5_link()}</a>{m.nb_p5_post()}
		</p>

		<h3>{m.nb_h3_6()}</h3>
		<p>
			{m.nb_p6()}
		</p>

		<h3>{m.nb_h3_7()}</h3>
		<p>
			{m.nb_p7()}
		</p>

		<h3>{m.nb_h3_8()}</h3>
		<p>
			{m.nb_p8()}
		</p>

		<h3>{m.nb_h3_9()}</h3>
		<p>
			{m.nb_p9()}
		</p>

		<h3>{m.nb_h3_10()}</h3>
		<p>
			{m.nb_p10_pre()}
			<a href={localizeHref('/profil-entfernen')}>{m.nb_p10_link()}</a>
			{m.nb_p10_post()}
		</p>

		<h3>{m.nb_h3_11()}</h3>
		<p>
			{m.nb_p11()}
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
