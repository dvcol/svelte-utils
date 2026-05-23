# svelte-utils

Set of helpfully utils

## Installation

```sh
pnpm install @dvcol/svelte-utils
```

## Migrating from 1.x to 2.0

2.0 is attachments-first. The Svelte 4-style `Action` exports have been
removed. Replace `use:foo={opts}` call sites with `{@attach useFoo(opts)}`,
and use property getters for fields that should react to changes.

| 1.x | 2.0 |
|---|---|
| `<div use:focusin={opts}>` | `<div {@attach useFocusin(opts)}>` |
| `<div use:hovering={opts}>` | `<div {@attach useHovering(opts)}>` |
| `<div use:mutation={cb}>` | `const m = useMutation(opts); <div {@attach m.observe}>` (read `m.records` / `m.current` in an effect) |
| `<div use:resize={cb}>` | `const r = useResize(opts); <div {@attach r.observe}>` (read `r.entries` / `r.current` in an effect) |
| `<div use:swipe={onSwipe}>` | `<div {@attach useSwipe(onSwipe)}>` |
| `import { useSwipe } from '@dvcol/svelte-utils/touch'` | (removed; use `@dvcol/svelte-utils/swipe`) |
| `useWatchMedia(q)` | `useMedia(q)` then read `m.current` |

### Reactive options

Plain field reads are tracked at `@attach` evaluation time and tear down the
attachment when they change. For field-level reactivity, use property getters:

```svelte
<!-- BAD: changes to `focused` re-create the attachment -->
<div {@attach useFocusin({ focusin: focused, mirror: true })}/>

<!-- GOOD: changes to `focused` only re-run the inner $effect -->
<script lang="ts">
 const focusin = useFocusin({ get focusin() { return focused; }, mirror: true })
</script>

<div {@attach focusin}/>
```

`peerDependencies.svelte` is now `>=5.29` (attachments stable).
