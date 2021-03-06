<script lang="ts">
  import {
    profileBookmarks,
    profileAliases,
    profileCanvasURL,
    profileName,
    profilePreferredGoogleUser,
    profilePreferredColorScheme,
    supportedColorSchemes,
    profileLinkNames,
    Bookmark,
  } from "./userdata";

  import { googleChangeSignIn, loadAssignments } from "./assignments";
  import SettingsCard from "./SettingsCard.svelte";

  /** Whether or not the modal window is shown. */
  export let visible: boolean = false;
  /** The window wrapper element. */
  export let wrapper: HTMLDivElement = undefined;
  /** An element which opens the settings window on click. */
  export let button: HTMLElement = undefined;

  export let masked: boolean = false;

  let preferredColorSchemeIndex = supportedColorSchemes.indexOf(
    $profilePreferredColorScheme
  );

  /**
   * Autofocus an element that uses the use: directive.
   * Functionally equivalent to the `autofocus` attribute.
   * @param el The element to focus.
   */

  let scrollLock = false;
  const focus = (el: HTMLElement) => {
    if (!scrollLock) {
      el.focus();
    }
  };
</script>

<style>
  .wrapper {
    position: fixed;
    top: 30%;
    left: 10%;
    right: 10%;
    max-height: 60%;
    background-color: var(--white);
    opacity: 0;
    transition: visibility 0s 0.2s, left 0s 0.2s, top 0s 0.2s,
      max-height 0s 0.2s, right 0s 0.4s, border-radius 0.2s, opacity 0.2s;
    border-radius: 2rem;
    visibility: hidden;
    box-shadow: var(--module-shadow);
    padding: 2rem;
    overflow: scroll;
    border: 0.2rem solid var(--whiter);
    z-index: 2;
  }

  .wrapper.visible {
    top: 10%;
    left: 10%;
    max-height: 80%;
    right: 10%;
    border-radius: 2rem;
    opacity: 1;
    transition: visibility 0s, left 0.5s, top 0.4s, max-height 0.4s, right 0.4s,
      border-radius 0.2s, opacity 0.2s;
    visibility: visible;
  }

  .wrapper.masked {
    overflow: hidden;
  }

  .bookmark-form,
  input {
    display: grid;
  }

  .bookmark-form {
    grid-template-columns: 40% 50% 10%;
    max-width: 60vw;
    margin: auto;
  }

  .bookmark-title {
    max-width: 60vw;
    margin: auto;
  }

  .alias-text {
    text-transform: lowercase;
  }

  .alias-text {
    grid-column: 1 / 2;
  }

  .alias-del {
    grid-column: 2;
    width: 2rem;
  }

  .link-del {
    grid-column: 3;
    width: 2rem;
  }

  .alias-add,
  .link-add {
    grid-column: 1;
    margin-bottom: 2rem;
  }

  .link-name {
    grid-column: 1;
  }

  .link-url {
    grid-column: 2;
  }

  .bookmark-del {
    grid-column: 1;
    max-width: 8rem;
  }

  h2 {
    grid-column: 1 / -1;
  }

  .bookmark-form::before {
    content: "Configure your bookmark here.\A\A\A";
    white-space: pre;
  }
  .bookmark-form:invalid::before {
    content: "Please correctly fill out all aliases,\Aor delete empty rows.\A\A";
    color: lightcoral;
  }

  /* It looks like the form needs a submit button for validation to work. */
  input[type="submit"] {
    display: none;
  }

  input,
  select {
    margin: 0.2rem;
    padding: 0.5rem;
    height: max-content;
    border-radius: 0.5rem;
    background-color: transparent;
    border: 0.1rem solid var(--black);
    color: var(--black);
    font-size: 0.8rem;
  }

  select {
    border-top-right-radius: 0;
    border-bottom-right-radius: 0;
  }

  input[type="button"].del:hover {
    background-color: salmon;
  }

  input[type="button"] {
    cursor: pointer;
    transition: background-color 0.2s, color 0.2s;
  }

  input[type="button"]:hover {
    background-color: royalblue;
    color: var(--whiter);
  }

  .card-wrapper {
    display: flex;
    flex-wrap: wrap;
  }
</style>

<!-- https://github.com/sveltejs/svelte/issues/3105 -->
<svelte:head>
  {#if visible}
    <style>
      body {
        overflow: hidden;
      }
    </style>
  {/if}
</svelte:head>

<svelte:body
  on:keyup={(e) => {
    if (visible && !masked && e.key === 'Escape') visible = false;
  }}
  on:click={(e) => {
    setTimeout(() => {
      // We need to check that body.contains(e.target) in case we've just deleted a settings option.
      if (visible && !wrapper.contains(e.target) && !button.contains(e.target) && document.body.contains(e.target)) visible = false;
    }, 100);
  }} />
<div class="wrapper" bind:this={wrapper} class:visible class:masked>
  <h1>Accounts</h1>
  <h2>Canvas Calendar URL</h2>
  <input
    type="url"
    size="30"
    bind:value={$profileCanvasURL}
    on:change={loadAssignments}
    required />
  <h2>Google OAuth</h2>
  <input
    type="button"
    value={$profileName != 'Signed out' ? 'Sign out ' + $profileName : 'Sign in with Google'}
    on:click={() => {
      googleChangeSignIn();
    }} />
  <br />
  <label for="preferredGoogleUser">If you're signed into multiple Google
    accounts, this is the
    <pre>classroom.google.com/u/[number]/</pre>
    in the URL for Classroom.</label>
  <input
    id="preferredGoogleUser"
    type="number"
    bind:value={$profilePreferredGoogleUser} />
  <br />
  <select
    bind:value={$profilePreferredColorScheme}>{#each supportedColorSchemes as colorScheme}
      <option value={colorScheme}>{colorScheme}</option>
    {/each}</select>
  <br />
  <hr />
  <h1>Bookmarks</h1>
  <input
    type="button"
    value="Add Bookmark"
    on:click={(e) => {
      scrollLock = true;
      $profileBookmarks = [...$profileBookmarks, { aliases: [''], links: [{ name: '', url: '' }] }];
      setTimeout(() => e.target.parentElement.scrollTo({
            top: e.target.parentElement.scrollHeight,
            behavior: 'smooth',
          }), 50);
      setTimeout(() => (scrollLock = false), 50);
    }} />
  <datalist id="linkNames">
    {#each $profileLinkNames as name}
      <option value={name} />
    {/each}
  </datalist>
  <div class="card-wrapper">
    {#each $profileBookmarks as bookmark, bookmarkIndex}
      <SettingsCard bind:masked name={bookmark.aliases[0]}>
        <h1 class="bookmark-title">{bookmark.aliases[0]}</h1>
        <form class="bookmark-form" action="#">
          <h2>Aliases</h2>
          {#each bookmark.aliases as alias, aliasIndex}
            <input
              class="alias-text"
              size="8"
              placeholder="Fill out alias."
              type="text"
              required
              use:focus
              bind:value={alias}
              on:change={(e) => {
                e.target.value = e.target.value.toLowerCase();
                e.target.setCustomValidity(Object.keys($profileAliases).includes(e.target.value) ? 'Alias must be unique.' : '');
                bookmark = bookmark;
              }} /><input
              class="alias-del del"
              type="button"
              value="✖"
              on:click={(e) => {
                bookmark.aliases = [...bookmark.aliases.slice(0, aliasIndex), ...bookmark.aliases.slice(aliasIndex + 1)];
                bookmark = bookmark;
              }} />
          {/each}
          <input
            class="alias-add"
            type="button"
            value="Add Alias"
            on:click={() => {
              bookmark.aliases = [...bookmark.aliases, ''];
            }} />
          <h2>Links</h2>
          {#each bookmark.links as link, linkIndex}
            <input
              list="linkNames"
              class="link-name"
              size="8"
              placeholder="Fill out this link name."
              type="text"
              required
              bind:value={link.name}
              on:change={(e) => {
                e.target.value = e.target.value.toLowerCase();
                e.target.setCustomValidity(bookmark.links
                    .map((link) => link.name)
                    .indexOf(
                      e.target.value
                    ) !== linkIndex ? 'Link name must be unique.' : '');
                bookmark = bookmark;
              }} />
            <input
              class="link-url"
              size="16"
              placeholder="Fill out this link URL."
              type="url"
              required
              use:focus
              bind:value={link.url}
              on:change={() => {
                bookmark = bookmark;
              }} /><input
              class="link-del del"
              type="button"
              value="✖"
              on:click={() => {
                bookmark.links = [...bookmark.links.slice(0, linkIndex), ...bookmark.links.slice(linkIndex + 1)];
                bookmark = bookmark;
              }} />
          {/each}
          <input
            class="link-add"
            type="button"
            value="Add Link"
            on:click={() => {
              bookmark.links = [...bookmark.links, { name: '', url: '' }];
            }} />
          <input type="submit" value="Validate" />
          <input
            class="bookmark-del del"
            type="button"
            value="Delete Bookmark"
            on:click={() => ($profileBookmarks = [...$profileBookmarks.slice(0, bookmarkIndex), ...$profileBookmarks.slice(bookmarkIndex + 1)])} />
          <!-- Add modules, like Zoom, here? Or auto-detect certain URLs? -->
          <input type="submit" value="Validate" />
        </form>
      </SettingsCard>
    {/each}
  </div>
</div>
