import { writable, derived } from 'svelte/store';

const default_icon = "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg";

export const profileName = writable(localStorage.getItem("profileName") || "Signed Out");
export const profileIcon = writable(localStorage.getItem("profileIcon" || default_icon));
export const profileBookmarks = writable(JSON.parse(localStorage.getItem("profileBookmarks") || "[]"));

export const profileCanvasURL = writable(localStorage.getItem("profileCanvasURL") || "");

export const profileGoogleSignout = () => {
    profileName.set("Signed out");
    profileIcon.set(default_icon);
}

export class Link {
    name: string;
    url: string;
}

export class Bookmark {
    links: typeof Link[];
    aliases: string[];
}

profileName.subscribe(value => localStorage.setItem("profileName", value));
profileIcon.subscribe(value => localStorage.setItem("profileIcon", value));
profileBookmarks.subscribe(value => localStorage.setItem("profileBookmarks", JSON.stringify(value)));
profileCanvasURL.subscribe(value => localStorage.setItem("profileCanvasURL", value));

// This makes it possible to check wich bookmark a given alias is bound to.
export const profileAliases = derived(profileBookmarks, $profileBookmarks =>
    // Convert a 2D array to a 1D array.
    [].concat(
        // Turn every bookmark into a (key, value) pair matching 2D items with 1D parent indexes.
        ...$profileBookmarks.map((bookmark: Bookmark, bookmarkIndex: number) =>
            bookmark.aliases.map(alias => [alias, bookmarkIndex])))
        // Convert (key, value) arrays into properties.
        .reduce((acc, keyval) => acc = { ...acc, [keyval[0]]: keyval[1] }, {}))