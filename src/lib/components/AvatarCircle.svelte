<script lang="ts">
	// Reine Anzeige: Bild, falls avatarUrl gesetzt ist, sonst Initialen in
	// einem farbigen Kreis. Kein Upload-Verhalten — dafür siehe
	// AvatarUpload.svelte, das diese Komponente intern verwendet.
	import { avatarColor, avatarInitials } from '$lib/avatar';

	let {
		avatarUrl,
		name,
		size = 64
	}: { avatarUrl: string | null; name: string; size?: number } = $props();
</script>

{#if avatarUrl}
	<img
		class="avatar-img"
		src={avatarUrl}
		alt={name}
		width={size}
		height={size}
		style="--size: {size}px"
	/>
{:else}
	<span
		class="avatar-fallback"
		style="--size: {size}px; background: {avatarColor(name)}"
		role="img"
		aria-label={name}
	>
		{avatarInitials(name)}
	</span>
{/if}

<style>
	.avatar-img,
	.avatar-fallback {
		width: var(--size);
		height: var(--size);
		border-radius: 50%;
		flex-shrink: 0;
	}

	.avatar-img {
		object-fit: cover;
		display: block;
	}

	.avatar-fallback {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		color: #fff;
		font-weight: 600;
		font-family: var(--body);
		font-size: calc(var(--size) * 0.38);
		user-select: none;
	}
</style>
