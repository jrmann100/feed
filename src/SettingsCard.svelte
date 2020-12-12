<script lang="ts">
  // These two should be equal to each other. They're separate just for purposes of interaction with <Settings>.
  /** Whether or not the card is in fullscreen mode. **/
  export let expanded: boolean = false;
  /** Whether or not the parent element should disable scrolling. **/
  export let masked: boolean = false;
  /** Name, to display in the non-expanded state. **/
  export let name: string = "";
</script>

<style>
  .card {
    border-radius: 0.5rem;
    transition: z-index 0s 0.3s;
    position: relative;
    height: 6rem;
    width: 5rem;
    overflow: visible;
    margin: 1rem;
    display: inline-block;
    background-color: var(--white);
    z-index: 1;
    cursor: pointer;
  }

  /* :global(body.prefers-dark) */ .card::before {
    border: 0.08rem solid var(--black);
  }

  .card::before {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 100%;
    height: 100%;
    transform: translate(-50%, -50%);
    content: "";
    background-color: inherit;
    border-radius: inherit;
    z-index: -1;
    transition: width 0.3s, height 0.3s;
    box-shadow: 0 0.1rem 0.5rem rgba(0, 0, 0, 0.4);
  }

  .card.expanded {
    transition: z-index 0s;
    z-index: 2;
    cursor: initial;
  }

  .card.expanded::before {
    width: 200vw;
    height: 200vh;
    opacity: 1;
  }

  .card .min-content {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    margin: 0 auto;
    max-width: max-content;
    opacity: 1;
    visibility: visible;
    pointer-events: none;
    transition: opacity 0.2s 0.2s, visibility 0s;
  }

  .card.expanded .min-content {
    visibility: hidden;
    opacity: 0;
    transition: opacity 0.2s, visibility 0s 0.2s;
  }

  .card .max-content {
    opacity: 0;
    visibility: hidden;
    transform: scale(0.98);
    position: fixed;
    top: 10%;
    left: 10%;
    max-height: 80%;
    right: 10%;
    transition: transform 0s 0.2s, opacity 0.2s, visibility 0s 0.2s,
      box-shadow 0.2s ease-out;
    padding: 2rem;
    overflow: scroll;
    /* box-shadow: 0 0.1rem 0.5rem rgba(0, 0, 0, 0.4);
    border-radius: 0.5rem; */
  }

  .card.expanded .max-content {
    opacity: 1;
    visibility: visible;
    transform: scale(1);
    transition: transform 0.2s 0.2s, opacity 0.2s 0.2s, visibility 0s,
      box-shadow 0.2s 0.2s ease-out;
  }

  button {
    margin: 0.2rem;
    padding: 0.5rem;
    height: max-content;
    border-radius: 0.5rem;
    background-color: transparent;
    border: 0.1rem solid var(--black);
    color: var(--black);
    font-size: 0.8rem;
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
    position: sticky;
    top: 0;
    display: block;
    left: calc(100% - 2rem);
  }

  button:hover {
    background-color: royalblue;
    color: var(--whiter);
  }
</style>

<svelte:body
  on:keyup={(e) => {
    if (expanded && e.key === 'Escape') {
      expanded = false;
      // Otherwise the settings will think it's been unmasked
      // by the time the event fires, and close itself.
      setTimeout(() => (masked = false), 0);
    }
  }} />
<div
  class="card"
  class:expanded
  on:click|self={(ev) => {
    if (!expanded) {
      expanded = masked = true;
    }
  }}>
  <div class="min-content">{name}</div>
  <div class="max-content">
    <button
      on:click={(ev) => {
        expanded = masked = false;
      }}>✖</button>
    <slot />
  </div>
</div>
