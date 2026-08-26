<script lang="ts">
	// Tailwind wird bewusst nur für dieses eine Admin-Dashboard geladen
	// (siehe lib/styles/admin-advertising.css) — der Rest der Plattform
	// bleibt auf dem bestehenden CSS-System in lib/styles/landing.css.
	import '$lib/styles/admin-advertising.css';
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import { campaignCtr, type Campaign, type CampaignPosition } from '$lib/advertising';
	import CampaignForm from '$lib/components/admin/CampaignForm.svelte';

	let { data }: { data: PageData } = $props();

	let showCreate = $state(false);
	let editingCampaign = $state<Campaign | null>(null);
	let toggleBusyId = $state<string | null>(null);

	const positionLabels: Record<CampaignPosition, string> = {
		desktop_leaderboard: 'Desktop Leaderboard',
		content_ad: 'Content-Anzeige',
		mobile_banner: 'Mobile Banner'
	};

	const dateFormat = new Intl.DateTimeFormat('de-DE', { dateStyle: 'medium', timeStyle: 'short' });

	function formatRuntime(campaign: Campaign): string {
		return `${dateFormat.format(new Date(campaign.startDate))} – ${dateFormat.format(new Date(campaign.endDate))}`;
	}
</script>

<svelte:head>
	<title>Werbung &amp; Sponsoring — PadelIndex Admin</title>
	<meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-slate-50">
	<header class="border-b border-slate-200 bg-white">
		<div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
			<div>
				<a href="/admin" class="text-xs font-medium text-teal-700 hover:underline">← Super-Admin</a>
				<h1 class="mt-1 text-xl font-semibold text-slate-900">Werbung &amp; Sponsoring</h1>
				<p class="mt-0.5 text-sm text-slate-500">
					Kampagnen für die <code class="rounded bg-slate-100 px-1 py-0.5 text-xs"
						>&lt;AdBanner&gt;</code
					>-Slots auf der Plattform.
				</p>
			</div>
			<button
				type="button"
				class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
				onclick={() => (showCreate = true)}
			>
				+ Neue Kampagne
			</button>
		</div>
	</header>

	<main class="mx-auto max-w-7xl px-6 py-8">
		{#if data.campaigns.length === 0}
			<p
				class="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500"
			>
				Noch keine Kampagnen angelegt.
			</p>
		{:else}
			<div class="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
				<div class="overflow-x-auto">
					<table class="w-full min-w-[880px] text-left text-sm">
						<thead
							class="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase tracking-wide text-slate-500"
						>
							<tr>
								<th class="px-4 py-3">Sponsor</th>
								<th class="px-4 py-3">Kampagne</th>
								<th class="px-4 py-3">Platzierung</th>
								<th class="px-4 py-3">Laufzeit</th>
								<th class="px-4 py-3 text-right">Impressionen</th>
								<th class="px-4 py-3 text-right">Klicks</th>
								<th class="px-4 py-3 text-right">CTR</th>
								<th class="px-4 py-3">Status</th>
								<th class="px-4 py-3"></th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100">
							{#each data.campaigns as campaign (campaign.id)}
								<tr class="hover:bg-slate-50">
									<td class="px-4 py-3 font-medium text-slate-900">{campaign.sponsorName}</td>
									<td class="px-4 py-3 text-slate-600">{campaign.campaignName}</td>
									<td class="px-4 py-3">
										<span
											class="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
										>
											{positionLabels[campaign.position]}
										</span>
									</td>
									<td class="px-4 py-3 whitespace-nowrap text-slate-600"
										>{formatRuntime(campaign)}</td
									>
									<td class="px-4 py-3 text-right tabular-nums text-slate-600">
										{campaign.impressions.toLocaleString('de-DE')}
									</td>
									<td class="px-4 py-3 text-right tabular-nums text-slate-600">
										{campaign.clicks.toLocaleString('de-DE')}
									</td>
									<td class="px-4 py-3 text-right tabular-nums text-slate-600">
										{campaignCtr(campaign).toLocaleString('de-DE')}%
									</td>
									<td class="px-4 py-3">
										<form
											method="POST"
											action="?/toggleActive"
											use:enhance={() => {
												toggleBusyId = campaign.id;
												return async ({ update }) => {
													await update();
													toggleBusyId = null;
												};
											}}
										>
											<input type="hidden" name="id" value={campaign.id} />
											<input
												type="hidden"
												name="isActive"
												value={(!campaign.isActive).toString()}
											/>
											<button
												type="submit"
												disabled={toggleBusyId === campaign.id}
												class={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${
													campaign.isActive ? 'bg-teal-600' : 'bg-slate-300'
												} disabled:opacity-60`}
												aria-pressed={campaign.isActive}
												aria-label={campaign.isActive
													? 'Kampagne deaktivieren'
													: 'Kampagne aktivieren'}
											>
												<span
													class={`h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
														campaign.isActive ? 'translate-x-6' : 'translate-x-1'
													}`}
												></span>
											</button>
										</form>
									</td>
									<td class="px-4 py-3 text-right">
										<button
											type="button"
											class="rounded-lg px-3 py-1.5 text-xs font-medium text-teal-700 hover:bg-teal-50"
											onclick={() => (editingCampaign = campaign)}
										>
											Bearbeiten
										</button>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	</main>
</div>

{#if showCreate}
	<CampaignForm onClose={() => (showCreate = false)} />
{/if}

{#if editingCampaign}
	<CampaignForm campaign={editingCampaign} onClose={() => (editingCampaign = null)} />
{/if}
