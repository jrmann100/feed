<script lang="ts">
  import { onMount } from "svelte";
  import { loadAssignments } from "./assignments.js";
  import Omni from "./Omni.svelte";
  import Time from "./Time.svelte";
  import Settings from "./Settings.svelte";
  import TaskList from "./TaskList.svelte";

  import { profileName, profileIcon } from "./userdata.js";

  let menuVisible: boolean;
  let menuButton: HTMLDivElement;

  onMount(loadAssignments);

  let activateOmnibox: Function;

  const handleKeydown = (ev: KeyboardEvent) => {
    if (ev.key == "/" && activateOmnibox && !menuVisible) {
      ev.preventDefault();
      activateOmnibox();
    }
  };
</script>

<style>
  .menu-button {
    position: absolute;
    width: 3rem;
    height: 3rem;
    top: 1.5rem;
    right: 1.5rem;
    background-color: var(--white);
    background-image: var(--profile-icon);
    background-size: contain;
    border-radius: 1rem;
    border: 0.2rem solid var(--whiter);
    cursor: pointer;
  }
</style>

<div
  class="menu-button"
  bind:this={menuButton}
  on:click={() => (menuVisible = !menuVisible)}
  style="--profile-icon:url({$profileIcon})"
  alt={$profileName} />

<svelte:body on:keydown={handleKeydown} />
<Settings bind:visible={menuVisible} bind:button={menuButton} />
<br />
<!-- Couldn't figure out how to add padding without stretching a body, so we've got a <br> -->
<Omni bind:trigger={activateOmnibox} />
<Time />
<TaskList />
<br />
<!-- There's some background glitch when the TaskList is at the very bottom. Should add a footer anyway. -->
