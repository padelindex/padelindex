<script lang="ts">
	// ============================================================
	// PadelIndex — Search-first Spieler-Auswahl (Match melden)
	// ============================================================
	// Tippen filtert den bereits geladenen Kader (kein Netzwerk-Roundtrip
	// pro Tastendruck — der Kader ist beim Seitenaufruf schon vollständig
	// geladen und für einen Vereins-Kader klein genug, siehe
	// routes/c/[slug]/match/neu/+page.server.ts). Kein Treffer -> explizite
	// "manuell hinzufügen"-Aktion (statt wie vorher automatisch aus jedem
	// unbekannten Namen ein Schatten-Profil zu machen).
	//
	// Formular-Vertrag bewusst unverändert gegenüber der vorherigen
	// Datalist-Variante: {fieldPrefix}Id / {fieldPrefix}Name /
	// {fieldPrefix}Email — resolveMatchPlayerSlots() auf dem Server (siehe
	// matches.ts) kennt diesen Vertrag schon und brauchte für dieses Update
	// keine Änderung.
	import { normalizeName } from '$lib/claim-match';

	type RosterOption = { id: string; handle: string; name: string };

	let {
		roster,
		excludeIds = [],
		fieldPrefix,
		label,
		selectedId = $bindable('')
	}: {
		roster: RosterOption[];
		excludeIds?: string[];
		fieldPrefix: string;
		label: string;
		selectedId?: string;
	} = $props();

	let query = $state('');
	let open = $state(false);
	let highlightIndex = $state(-1);
	let manualMode = $state(false);
	let manualEmail = $state('');

	const available = $derived(roster.filter((p) => !excludeIds.includes(p.id)));
	const filtered = $derived(
		query.trim()
			? available.filter((p) => normalizeName(p.name).includes(normalizeName(query)))
			: available
	);

	function select(p: RosterOption) {
		selectedId = p.id;
		query = p.name;
		open = false;
		highlightIndex = -1;
	}

	function onInput() {
		selectedId = '';
		open = true;
		highlightIndex = -1;
	}

	function switchToManual() {
		manualMode = true;
		open = false;
		selectedId = '';
	}

	function switchToSearch() {
		manualMode = false;
		manualEmail = '';
		query = '';
	}

	function onKeydown(e: KeyboardEvent) {
		if (!open) return;
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			highlightIndex = Math.min(highlightIndex + 1, filtered.length - 1);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			highlightIndex = Math.max(highlightIndex - 1, -1);
		} else if (e.key === 'Enter') {
			if (highlightIndex >= 0 && filtered[highlightIndex]) {
				e.preventDefault();
				select(filtered[highlightIndex]);
			}
		} else if (e.key === 'Escape') {
			open = false;
			highlightIndex = -1;
		}
	}

	const searchInputId = $derived(`${fieldPrefix}-search`);
</script>

<div class="picker">
	<label for={manualMode ? `${fieldPrefix}-manual-name` : searchInputId}>
		{label}
		{#if manualMode}<span class="badge-new">Neuer Spieler</span>{/if}
	</label>

	{#if !manualMode}
		<div class="combobox">
			<input
				id={searchInputId}
				name="{fieldPrefix}Name"
				type="text"
				autocomplete="off"
				placeholder="Namen eingeben oder aus der Liste wählen…"
				bind:value={query}
				oninput={onInput}
				onfocus={() => (open = true)}
				onblur={() => setTimeout(() => (open = false), 150)}
				onkeydown={onKeydown}
				required
			/>
			{#if open}
				<ul class="dropdown" role="listbox">
					{#each filtered as p, i (p.id)}
						<li>
							<button
								type="button"
								class="option"
								class:highlighted={i === highlightIndex}
								onmousedown={() => select(p)}
							>
								{p.name}
							</button>
						</li>
					{:else}
						<li class="dropdown-empty">Keine Treffer.</li>
					{/each}
					<li class="not-found">
						<button type="button" onmousedown={switchToManual}>
							Spieler nicht gefunden? Hier manuell hinzufügen
						</button>
					</li>
				</ul>
			{/if}
		</div>
		<input type="hidden" name="{fieldPrefix}Id" value={selectedId} />
	{:else}
		<input
			id="{fieldPrefix}-manual-name"
			name="{fieldPrefix}Name"
			type="text"
			placeholder="Name"
			value={query}
			required
		/>
		<input
			name="{fieldPrefix}Email"
			type="email"
			bind:value={manualEmail}
			placeholder="E-Mail (optional) — für die Einladung"
		/>
		<button type="button" class="link" onclick={switchToSearch}>Zurück zur Suche</button>
		<p class="note">
			Legt ein neues, unbeanspruchtes Profil ("Schatten-Profil") an — es zählt für die Rangliste,
			sobald das Match bestätigt ist.
			{#if manualEmail}Wir schicken direkt eine Einladung per E-Mail.{/if}
		</p>
	{/if}
</div>

<style>
	.picker {
		position: relative;
	}

	label {
		display: block;
		font-size: 13px;
		margin: 18px 0 8px;
		color: var(--muted-light);
	}

	.combobox {
		position: relative;
	}

	input[type='text'],
	input[type='email'] {
		width: 100%;
		box-sizing: border-box;
		padding: 12px 16px;
		border-radius: 100px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		font-family: var(--body);
		font-size: 14px;
	}

	input[type='email'] {
		margin-top: 8px;
	}

	.dropdown {
		position: absolute;
		z-index: 20;
		top: calc(100% + 6px);
		left: 0;
		right: 0;
		margin: 0;
		padding: 6px;
		list-style: none;
		max-height: 240px;
		overflow-y: auto;
		border-radius: 16px;
		border: 1px solid var(--line-light, rgba(0, 0, 0, 0.14));
		background: #fff;
		box-shadow: 0 12px 28px rgba(0, 0, 0, 0.12);
	}

	.dropdown li + li {
		margin-top: 2px;
	}

	.dropdown button.option {
		display: block;
		width: 100%;
		text-align: left;
		padding: 9px 12px;
		border: 0;
		border-radius: 10px;
		background: none;
		font-family: var(--body);
		font-size: 14px;
		cursor: pointer;
	}

	.dropdown button.option:hover,
	.dropdown button.option.highlighted {
		background: rgba(15, 110, 92, 0.1);
	}

	.dropdown-empty {
		padding: 9px 12px;
		font-size: 13px;
		color: var(--muted-light);
	}

	.not-found {
		margin-top: 4px;
		padding-top: 6px;
		border-top: 1px solid var(--line-light, rgba(0, 0, 0, 0.1));
	}

	.not-found button {
		display: block;
		width: 100%;
		text-align: left;
		padding: 9px 12px;
		border: 0;
		border-radius: 10px;
		background: none;
		font-family: var(--body);
		font-size: 13px;
		color: var(--court-deep, #0f6e5c);
		cursor: pointer;
	}

	.not-found button:hover {
		background: rgba(15, 110, 92, 0.1);
	}

	.badge-new {
		display: inline-block;
		margin-left: 8px;
		padding: 2px 9px;
		border-radius: 100px;
		background: rgba(15, 110, 92, 0.12);
		color: var(--court-deep, #0f6e5c);
		font-size: 11px;
		font-weight: 600;
	}

	.link {
		background: none;
		border: 0;
		padding: 0;
		margin-top: 8px;
		font-size: 13px;
		color: var(--muted-light);
		text-decoration: underline;
		cursor: pointer;
	}

	.note {
		margin: 8px 0 0;
		font-size: 12.5px;
		color: var(--court-deep, #0f6e5c);
	}
</style>
