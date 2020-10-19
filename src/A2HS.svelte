<script lang="ts">
    import { onMount } from "svelte";

    let enabled = false;
    let wrapper: HTMLDivElement = undefined;

    // Documentation: https://stackoverflow.com/a/51847335/9068081
    /**
     * The BeforeInstallPromptEvent is fired at the Window.onbeforeinstallprompt handler
     * before a user is prompted to "install" a web site to a home screen on mobile.
     */
    interface BeforeInstallPromptEvent extends Event {
        /**
         * Returns an array of DOMString items containing the platforms on which the event was dispatched.
         * This is provided for user agents that want to present a choice of versions to the user such as,
         * for example, "web" or "play" which would allow the user to chose between a web version or
         * an Android version.
         */
        readonly platforms: Array<string>;

        /**
         * Returns a Promise that resolves to a DOMString containing either "accepted" or "dismissed".
         */
        readonly userChoice: Promise<{
            outcome: "accepted" | "dismissed";
            platform: string;
        }>;

        /**
         * Allows a developer to show the install prompt at a time of their own choosing.
         * This method returns a Promise.
         */
        prompt(): Promise<void>;
    }

    let deferredPrompt: BeforeInstallPromptEvent = undefined;

    // From https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Add_to_home_screen
    onMount(() => {
        window.addEventListener(
            "beforeinstallprompt",
            (e: BeforeInstallPromptEvent) => {
                console.log(e);
                // Prevent Chrome 67 and earlier from automatically showing the prompt
                e.preventDefault();
                // Stash the event so it can be triggered later.
                deferredPrompt = e;
                // Update UI to notify the user they can add to home screen
                enabled = true;
            }
        );
    });

    const installClicked = () => {
        // hide our user interface that shows our A2HS button
        enabled = false;
        // Show the prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === "accepted") {
                console.log("User accepted the A2HS prompt");
            } else {
                console.log("User dismissed the A2HS prompt");
            }
            deferredPrompt = null;
        });
    };
</script>

<style>
    .wrapper {
        max-width: 0;
        flex-shrink: 100;
        transition: opacity 0.2s, border-width 0.2s, min-width 0.5s,
            max-width 0.5s, flex-shrink 0.5s;
        min-width: 0;
        min-height: 3rem;
        width: auto;
        background-color: var(--white);
        border: 0rem solid var(--whiter);
        cursor: pointer;
        display: flex;
        border-radius: 1rem;
        overflow: hidden;
        opacity: 0;
    }
    .wrapper.enabled {
        border-width: 0.2rem;
        opacity: 1;
        flex-shrink: 0;
        min-width: 3rem;
        max-width: 3rem;
        width: auto;
    }

    .wrapper svg {
        min-width: 3rem;
        width: 3rem;
        height: 3rem;
        fill: var(--black);
    }
</style>

<div
    title="Click to install as an application"
    class="wrapper"
    bind:this={wrapper}
    class:enabled
    on:click={installClicked}>
    <svg
        xmlns="http://www.w3.org/2000/svg"
        height="24"
        viewBox="0 0 24 24"
        width="24">
        <path
            d="M16.59 9H15V4c0-.55-.45-1-1-1h-4c-.55 0-1 .45-1 1v5H7.41c-.89 0-1.34 1.08-.71 1.71l4.59 4.59c.39.39 1.02.39 1.41 0l4.59-4.59c.63-.63.19-1.71-.7-1.71zM5 19c0 .55.45 1 1 1h12c.55 0 1-.45 1-1s-.45-1-1-1H6c-.55 0-1 .45-1 1z" /></svg>
</div>
