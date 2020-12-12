<script lang="ts">
  import { taskItems } from "./assignments";
  import Task from "./Task.svelte";

  let wrapper: HTMLDivElement;
  let animated: boolean = false;
  let loading: boolean = false;

  // Animate the loading of new task items by masking and expanding the wrapper.
  // There should be a settings option to enable/disable this.
  $: if ($taskItems.length > 0) {
    animate();
  }
  const animate = () => {
    animated = loading = true;
    wrapper.style.maxHeight = wrapper.style.height =
      wrapper.querySelector(".content").getBoundingClientRect().height + "px";
    setTimeout(() => {
      loading = false;
      wrapper.style.height =
        wrapper.querySelector(".content").getBoundingClientRect().height + "px";
      wrapper.style.maxHeight =
        wrapper.querySelector(".content").getBoundingClientRect().height +
        200 +
        "px";
      setTimeout(() => (wrapper.style.height = "auto"), 400);
    }, 500);
  };
</script>

<style>
  .wrapper {
    width: 30rem;
    margin: 2rem auto;
    padding: 1.5rem;
    border-radius: 1.5rem;
    max-width: 80vw;
    background-color: var(--white);
    transition: height 0.2s 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
    position: relative;
    box-shadow: var(--module-shadow);
    max-height: 5rem;
    height: 5rem;
    overflow: hidden;
    /* This is tricky. We want max-height and height to be equal while animating, but then shrink height back to its content size. */
  }

  .wrapper.animated.loading {
    transition: max-height 0.2s 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28),
      height 0.2s 0.2s cubic-bezier(0.18, 0.89, 0.32, 1.28);
  }

  :global(body.prefers-dark) .wrapper {
    border: 0.2rem solid var(--whiter);
  }

  .mask {
    /* Overflow is hidden when loading, so this is superfluous;
     * it's mostly for Safari, which is slow to render that change. */
    border-radius: inherit;
    position: absolute;
    background-color: var(--white);
    overflow: hidden;
    visibility: hidden;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .mask::after {
    content: "";
    position: absolute;
    background-color: var(--black);
    opacity: 0.1;
    left: 0;
    right: 0;
    bottom: 0;
    top: 100%;
  }

  .wrapper.animated.loading .mask {
    animation: startLoad 0.5s forwards;
  }

  .wrapper.animated.loading .mask::after {
    animation: constantLoad 1s infinite;
  }

  .wrapper.animated:not(.loading) .mask {
    animation: endLoad 0.5s;
  }

  @keyframes constantLoad {
    0% {
      top: 100%;
      bottom: 0;
    }

    30% {
      top: 0;
      bottom: 0;
    }

    60%,
    100% {
      top: 0;
      bottom: 100%;
    }
  }

  @keyframes startLoad {
    from {
      opacity: 1;
      visibility: visible;
    }

    to {
      opacity: 1;
      visibility: visible;
    }
  }

  @keyframes endLoad {
    0% {
      opacity: 1;
      visibility: visible;
    }

    100% {
      opacity: 0;
      visibility: visible;
    }
  }

  .wrapper {
    overflow: auto;
    /* Should this scroll, or expand to fit content? */
  }

  .wrapper.animated.loading {
    overflow: hidden;
  }

  .content::before {
    content: "tasks";
    font-size: 1.5rem;
    border-bottom: 0.1rem solid var(--black);
    margin-bottom: 0.5rem;
    width: max-content;
    display: block;
    position: relative;
  }

  .wrapper.animated.loading .content::before,
  .wrapper:not(.animated) .content::before {
    content: "tasks - loading " var(--items-length) "assignments...";
  }
</style>

<div
  class="wrapper"
  style="--items-length: '{$taskItems.length > 0 ? $taskItems.length + ' ' : ''}'"
  class:animated
  class:loading
  bind:this={wrapper}>
  <div class="mask" />
  <div class="content">
    <!-- As of now, only showing this week's assignments. -->
    {#each $taskItems.filter((item) => item.date.getTime() - new Date().getTime() < 604800000) as item}
      <Task bind:item />
    {/each}
  </div>
</div>
