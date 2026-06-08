<script lang="ts">
	/* Small diamond / sparkle monogram mark, ported from shared.jsx. */
	let { size = 22 }: { size?: number } = $props();
</script>

<svg width={size} height={size} viewBox="0 0 24 24" style="display:block">
	<path d="M12 1 L15 9 L23 12 L15 15 L12 23 L9 15 L1 12 L9 9 Z" fill="var(--color-gold)" />
</svg>
