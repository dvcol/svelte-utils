<script lang="ts">
  import type { Attachment } from 'svelte/attachments';

  interface Props {
    attach: Attachment<Element>;
    tag?: string;
  }

  const { attach, tag = 'div' }: Props = $props();
</script>

<svelte:element this={tag} {@attach attach} />
