<script lang="ts">
  import { onMount } from "svelte";
  import { loadAssignments, setupLMSes } from "./assignments.js";
  import Omni from "./Omni.svelte";
  import Time from "./Time.svelte";
  import Settings from "./Settings.svelte";
  import TaskList from "./TaskList.svelte";
  import A2HS from "./A2HS.svelte";

  import {
    profileName,
    profileIcon,
    profilePreferredColorScheme,
  } from "./userdata.js";

  // By default, both classes will be set at once.
  $: if (
    $profilePreferredColorScheme === "light" ||
    ($profilePreferredColorScheme === "auto" &&
      window.matchMedia("(prefers-color-scheme: light)").matches)
  ) {
    document.body.classList.remove("prefers-dark");
    document.body.classList.add("prefers-light");
  } else {
    document.body.classList.add("prefers-dark");
    document.body.classList.remove("prefers-light");
  }

  let menuVisible: boolean;
  let menuButton: HTMLDivElement;

  onMount(() => {
    setupLMSes().then(() => loadAssignments);
  });

  let omni: any;

  const handleKeydown = (ev: KeyboardEvent) => {
    if (ev.key === "/" && !menuVisible) {
      ev.preventDefault();
      omni.focus();
    }
  };
</script>

<style>
  .header {
    text-align: center;
    width: calc(100% - 3rem);
    box-sizing: border-box;
    margin-left: 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .menu-button {
    min-width: 3rem;
    min-height: 3rem;
    background-color: var(--white);
    background-image: var(--profile-icon);
    background-size: contain;
    border-radius: 1rem;
    border: 0.2rem solid var(--whiter);
    cursor: pointer;
  }

  /* Safari doesn't support the gap property. */
  @supports (-webkit-touch-callout: none) {
    .menu-button {
      margin-left: 0.5rem;
    }
  }
</style>

<svelte:body on:keydown={handleKeydown} />
<!-- Couldn't figure out how to add padding without stretching a body, so we've got a <br> -->
<br />
<div class="header">
  <!-- We have this as a spacer in the flexbox, so that the omnibox will be space-between'ed to the center -->
  <A2HS />
  <Omni bind:this={omni} />
  <div
    class="menu-button"
    bind:this={menuButton}
    on:click={() => (menuVisible = !menuVisible)}
    style="--profile-icon:url({$profileIcon})"
    alt={$profileName} />
</div>
<Settings bind:visible={menuVisible} bind:button={menuButton} />
<Time />
<TaskList />
<!-- There's some background glitch when the TaskList is at the very bottom. Should add a footer anyway. -->