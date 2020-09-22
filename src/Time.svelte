<script lang="ts">
  import { onMount } from "svelte";

  // The current time and date, updated every minute.
  let dateTime = new Date();

  // Parse an updated dateTime into time (HHMM) and date (MMDD) text.
  $: time =
    (dateTime.getHours() == 12 ? 12 : dateTime.getHours() % 12)
      .toString()
      .padStart(2, "0") + dateTime.getMinutes().toString().padStart(2, "0");
  $: progress = dateTime.getMinutes() / 60;
  $: date =
    (dateTime.getMonth() + 1).toString().padStart(2, "0") +
    dateTime.getDate().toString().padStart(2, "0");

  // Refresh the date every minute. 
  onMount(() => {
    const interval = setInterval(() => {
      dateTime = new Date();
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  });
</script>

<style>
  .time-module {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 2rem;
    flex-direction: column;
    color: var(--whiter);
  }

  .time-module .time {
    font-size: 4rem;
  }

  .time-module .progress {
    stroke: var(--whiter);
    width: 20rem;
    max-width: 90vw;
    border-radius: 0.2rem;
  }
  .time-module .date {
    font-size: 2.5rem;
  }

  svg.progress path:first-of-type {
    stroke: lightskyblue;
  }

  @media (prefers-color-scheme: dark) {
    svg.progress path:first-of-type {
      stroke: darkslategray;
    }
  }
  svg.progress path:last-of-type {
    stroke-dasharray: 10;
    stroke-dashoffset: var(--progress-offset);
    opacity: 0;
    animation: progress-animation 0.5s 0.5s ease, fadein 0.5s 0.5s forwards;
    transition: stroke-dashoffset 0.2s;
  }

  @keyframes progress-animation {
    from {
      stroke-dashoffset: 10;
    }
    to {
      stroke-dashoffset: var(--progress-offset);
    }
  }
  @keyframes fadein {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
</style>

<div class="time-module">
  <div class="time">{time}</div>
  <svg class="progress" viewBox="0 0 10 0.5">
    <path d="M0,0 H10" />
    <path d="M0,0 H10" style="--progress-offset:{10 - 10 * progress}" />
  </svg>
  <div class="date">{date}</div>
</div>
