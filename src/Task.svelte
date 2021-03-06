<script lang="ts">
  import type { Item } from "./assignments";

  /** The Item to which this Task is bound. */
  export let item: Item;

  /** Whether or not this task is expanded to show more content. */
  let expanded: boolean = false;

  // This is kind of confusing, but components aren't actually bound to Items.
  // Every other visible property is dynamically reloaded since they're in attributes,
  // but all expanded Tasks need to be closed on a reload - unless we wanted to
  // incorporate expansion into the Item class itself.
  $: if (item) expanded = false;
</script>

<style>
  .wrapper {
    height: max-content;
    padding: 0.5rem;
    border-bottom: var(--black) 0.1rem solid;
    box-sizing: border-box;
    font-size: 1.2rem;
    display: grid;
    grid-template-columns: 2rem 70% 20%;
    padding: 1rem 0.5rem;
  }

  .info {
    grid-column: 2;
    opacity: 0;
    visibility: hidden;
    transition: opacity 0.2s, visibility 0s 0.2s, max-height 0.2s,
      padding-top 0.2s;
    max-height: 0;
    padding-top: 0;
    overflow-y: scroll;
    grid-column: 2 / 4;
    margin: 0.5rem 0;
  }

  .wrapper.expanded .info {
    max-height: 8rem;
    padding-top: 0.5rem;
    opacity: 1;
    visibility: visible;
    transition: opacity 0.2s, max-height 0.2s, padding-top 0.2s;
  }

  .wrapper.expanded a {
    white-space: normal;
  }

  .complete {
    grid-column: 1;
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    cursor: pointer;
  }

  .complete svg {
    /* box-sizing: border-box; */

    display: block;
    width: 1.2rem;
    height: 1.2rem;
    border: 0.1rem solid var(--black);
    border-radius: 100%;
    transition: background-color 0.2s;
    /* padding: 0.1rem; */
  }

  .complete svg path {
    stroke: var(--black);
    stroke-width: 0.3;
    stroke-linecap: square;
  }

  .complete svg path {
    transition: transform 0.2s, stroke 0.2s;
    transform-origin: center;
  }

  .wrapper.expanded .complete svg path:first-of-type {
    transform: rotate(180deg);
  }
  .wrapper.expanded .complete svg path:last-of-type {
    transform: rotate(90deg);
  }

  .complete[data-completed="1"] svg {
    background-color: var(--black);
  }

  .complete[data-completed="1"] svg path {
    stroke: var(--white);
  }

  .complete[data-completed="-1"] svg path,
  .complete[data-completed="1"] {
    stroke: var(--white);
  }

  .complete[data-completed="-1"] svg {
    border-color: lightsalmon;
    background-color: lightsalmon;
  }

  a {
    grid-column: 2;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    width: 100%;
    text-decoration-color: var(--black);
    color: var(--black);
  }

  small {
    grid-column: 3;
    text-align: right;
  }
</style>

<div class="wrapper" class:expanded>
  <div
    class="complete"
    on:click={() => (expanded = !expanded)}
    data-completed={item.completed}>
    <svg viewBox="0 0 2 2"><path d="M 0.5,1 H 1.5" />
      <path d="M 1,0.5 V 1.5" /></svg>
  </div>
  <a href={item.url} target="_blank"> {item.name} </a>
  <small>{item.date.getTime() - new Date().getTime() > 86400000 ? item.date
          .toString()
          .split(
            ' '
          )[0] : item.date.toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}</small>
  <div class="info">{item.className}<br />{item.description}</div>
</div>
