<script lang="ts">
	import { m } from '$lib/paraglide/messages.js';
	import { localizeHref } from '$lib/paraglide/runtime';
</script>

<svelte:head>
	<title>{m.ds_meta_title()}</title>
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
		<h2 style="margin-top: 18px">{m.ds_h2()}</h2>

		<h3>{m.ds_h3_1()}</h3>
		<p>
			Alec Hahn<br />
			Geltingerstrasse 12<br />
			82515 Wolfratshausen<br />
			{m.ds_address_country()}<br />
			E-Mail: <a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>
		</p>

		<h3>{m.ds_h3_2()}</h3>
		<p>
			{m.ds_p2()}
		</p>

		<h3>{m.ds_h3_3()}</h3>
		<p>
			{m.ds_p3()}
		</p>

		<h3>{m.ds_h3_4()}</h3>
		<p>{m.ds_p4_intro()}</p>
		<p>
			<b>Supabase</b>
			{m.ds_p4_supabase_desc()}
			{m.ds_p4_supabase_status()}
		</p>
		<p>
			<b>Cloudflare</b>
			{m.ds_p4_cloudflare_desc()}
			{m.ds_p4_cloudflare_status()}
		</p>
		<p>
			<b>Resend</b>
			{m.ds_p4_resend_desc()}
			{m.ds_p4_resend_status()}
		</p>
		<p>
			<b>Support Board</b>
			{m.ds_p4_supportboard_desc()}
			{m.ds_p4_supportboard_status()}
		</p>

		<h3>{m.ds_h3_5()}</h3>
		<p>
			{m.ds_p5_pre()}
			<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>
			{m.ds_p5_post()}
		</p>

		<h3>{m.ds_h3_6()}</h3>
		<p>
			{m.ds_p6()}
		</p>

		<h3>{m.ds_h3_7()}</h3>
		<p>
			{m.ds_p7_1()}
		</p>
		<p>
			{m.ds_p7_2_pre()} <b>{m.ds_p7_2_bold()}</b>
			{m.ds_p7_2_post()}
		</p>
		<p>
			{m.ds_p7_3_pre()} <b>{m.ds_p7_3_bold()}</b>
			{m.ds_p7_3_post()}
		</p>

		<h3>{m.ds_h3_8()}</h3>
		<p>
			{m.ds_p8()}
		</p>

		<h3>{m.ds_h3_9()}</h3>
		<p>
			{m.ds_p9()}
		</p>

		<h3>{m.ds_h3_10()}</h3>
		<p>{m.ds_p10_intro()}</p>
		<p>
			{m.ds_p10_1_pre()}
			<a href="mailto:kontakt@padelindex.de">kontakt@padelindex.de</a>.
		</p>
		<p>
			{m.ds_p10_2()}
		</p>

		<h3>{m.ds_h3_11()}</h3>
		<p>
			{m.ds_p11()}
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
