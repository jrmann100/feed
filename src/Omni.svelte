<script>
  import { profileBookmarks, profileAliases } from "./userdata.js";
  let div, content;
  let error = "";

  export const showError = (text) => {
    if (div) {
      error = text;
      setTimeout(() => {
        error = "";
      }, 3000);
    }
  };

  export const trigger = (ev) => {
    if (div) {
      div.focus();
    }
  };

  const keydown = (ev) => {
    if (ev.key == "Enter") {
      ev.preventDefault();
      let command = content.toLowerCase().split(" ");
      content = "";
      if (!command[0] || !command[1]) {
        showError("Enter a command in the format [link] [alias].");
        return;
      }
      if (Object.keys($profileAliases).includes(command[1])) {
        let linkIndex = $profileBookmarks[$profileAliases[command[1]]].links
          .map((link) => link.name)
          .indexOf(command[0]);
        if (linkIndex != -1) {
          window.open(
            $profileBookmarks[$profileAliases[command[1]]].links[linkIndex].url
          );
        } else {
          showError(`No link ${command[0]} for alias ${command[1]}.`);
        }
      } else {
        showError(`No alias match for ${command[1]}.`);
      }
    }
  };
</script>

<style>
  input {
    margin-top: 1rem;
    display: block;
    margin-left: auto;
    margin-right: auto;
    padding: 0.5rem;
    font-size: 1.5rem;
    height: max-content;
    border-radius: 0.5rem;
    width: 30rem;
    max-width: 90vw;
    background-color: transparent;
    border: 0.2rem solid var(--whiter);
    color: var(--whiter);
    transition: background-color 0.2s;
  }

  input:focus {
    color: var(--darker);
    background-color: var(--whiter);
  }

  input::placeholder {
    color: var(--whiter);
    opacity: 1;
  }

  input.error {
    background-color: var(--whiter);
  }

  input.error::placeholder {
    color: salmon;
  }
</style>

<input
  type="text"
  bind:this={div}
  class:error={error != ''}
  bind:value={content}
  on:keydown={keydown}
  placeholder={error || 'Enter a command (press "/" to focus)'} />
