<script lang="ts">
	// Formular für Anlage UND Bearbeitung einer Kampagne (routes/admin/
	// advertising). impressions/clicks tauchen hier bewusst nicht auf —
	// die zählt ausschließlich increment_campaign_stat() über AdBanner.svelte
	// hoch, ein Admin soll sie nicht versehentlich überschreiben können.
	import { enhance } from '$app/forms';
	import { CAMPAIGN_POSITIONS, type Campaign, type CampaignPosition } from '$lib/advertising';

	let {
		campaign = null,
		onClose
	}: {
		campaign?: Campaign | null;
		onClose: () => void;
	} = $props();

	let busy = $state(false);
	let errorMessage = $state<string | null>(null);

	const isEdit = $derived(campaign !== null);
	const action = $derived(isEdit ? '?/update' : '?/create');

	const positionLabels: Record<CampaignPosition, string> = {
		desktop_leaderboard: 'Desktop Leaderboard',
		content_ad: 'Content-Anzeige',
		mobile_banner: 'Mobile Banner'
	};

	/** ISO-String → Wert für <input type="datetime-local">, in Ortszeit des Browsers. */
	function toLocalInputValue(iso: string | undefined): string {
		if (!iso) return '';
		const d = new Date(iso);
		const pad = (n: number) => String(n).padStart(2, '0');
		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
	}

	const inputClass =
		'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/30';
	const labelClass = 'mb-1 block text-sm font-medium text-slate-700';
</script>

<div
	class="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8"
	role="presentation"
	onclick={(e) => e.target === e.currentTarget && onClose()}
>
	<div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
		<div class="mb-5 flex items-center justify-between">
			<h2 class="text-lg font-semibold text-slate-900">
				{isEdit ? 'Kampagne bearbeiten' : 'Neue Kampagne'}
			</h2>
			<button
				type="button"
				class="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
				onclick={onClose}
				aria-label="Schließen"
			>
				✕
			</button>
		</div>

		{#if errorMessage}
			<p class="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{errorMessage}</p>
		{/if}

		<form
			method="POST"
			{action}
			class="space-y-4"
			use:enhance={() => {
				busy = true;
				errorMessage = null;
				return async ({ result, update }) => {
					busy = false;
					if (result.type === 'failure') {
						errorMessage = (result.data?.error as string) ?? 'Speichern fehlgeschlagen.';
						return;
					}
					await update();
					onClose();
				};
			}}
		>
			{#if isEdit && campaign}
				<input type="hidden" name="id" value={campaign.id} />
			{/if}

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="block">
					<span class={labelClass}>Sponsor</span>
					<input
						name="sponsorName"
						required
						maxlength="120"
						value={campaign?.sponsorName ?? ''}
						class={inputClass}
					/>
				</label>
				<label class="block">
					<span class={labelClass}>Kampagnenname</span>
					<input
						name="campaignName"
						required
						maxlength="120"
						value={campaign?.campaignName ?? ''}
						class={inputClass}
					/>
				</label>
			</div>

			<label class="block">
				<span class={labelClass}>Banner-URL</span>
				<input
					type="url"
					name="bannerUrl"
					required
					placeholder="https://…"
					value={campaign?.bannerUrl ?? ''}
					class={inputClass}
				/>
			</label>

			<label class="block">
				<span class={labelClass}>Logo-URL (optional)</span>
				<input
					type="url"
					name="logoUrl"
					placeholder="https://…"
					value={campaign?.logoUrl ?? ''}
					class={inputClass}
				/>
			</label>

			<label class="block">
				<span class={labelClass}>Ziel-URL</span>
				<input
					type="url"
					name="targetUrl"
					required
					placeholder="https://…"
					value={campaign?.targetUrl ?? ''}
					class={inputClass}
				/>
			</label>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="block">
					<span class={labelClass}>Start</span>
					<input
						type="datetime-local"
						name="startDate"
						required
						value={toLocalInputValue(campaign?.startDate)}
						class={inputClass}
					/>
				</label>
				<label class="block">
					<span class={labelClass}>Ende</span>
					<input
						type="datetime-local"
						name="endDate"
						required
						value={toLocalInputValue(campaign?.endDate)}
						class={inputClass}
					/>
				</label>
			</div>

			<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
				<label class="block">
					<span class={labelClass}>Platzierung</span>
					<select name="position" required class={inputClass}>
						{#each CAMPAIGN_POSITIONS as pos (pos)}
							<option value={pos} selected={campaign?.position === pos}>
								{positionLabels[pos]}
							</option>
						{/each}
					</select>
				</label>
				<label class="block">
					<span class={labelClass}>Region (optional)</span>
					<input
						name="targetRegion"
						maxlength="80"
						placeholder="z. B. muenchen"
						value={campaign?.targetRegion ?? ''}
						class={inputClass}
					/>
				</label>
			</div>

			<label class="flex items-center gap-2 text-sm text-slate-700">
				<input
					type="checkbox"
					name="isActive"
					checked={campaign?.isActive ?? false}
					class="h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
				/>
				Aktiv (wird sofort ausgeliefert, sobald im Datumsfenster)
			</label>

			<div class="flex justify-end gap-3 pt-2">
				<button
					type="button"
					class="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100"
					onclick={onClose}
				>
					Abbrechen
				</button>
				<button
					type="submit"
					disabled={busy}
					class="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700 disabled:opacity-60"
				>
					{busy ? 'Speichert…' : isEdit ? 'Speichern' : 'Anlegen'}
				</button>
			</div>
		</form>
	</div>
</div>
