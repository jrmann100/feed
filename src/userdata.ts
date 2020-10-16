/**
 * Manage user data, including profile information and bookmarks.
 * @module userdata
 */

import { writable, derived, Writable, Readable } from 'svelte/store';

/** A default profile photo from Google. */
const default_icon: string = "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg";
const default_name: string = "Signed out";
export const supportedColorSchemes = ["auto", "light", "dark"];


/** Link, for use in a Bookmark. */
export class Link {
    /**
     * A unique (per Bookmark) identifier for each link;
     * it's encouraged to repeat names across bookmarks, i.e. an "agenda" for every class.
     */
    name: string;
    /** The url for this Link. */
    url: string;
}

/** Bookmark, referenced by multiple aliases and providing access to Link destinations. */
export class Bookmark {
    /** A list of this Bookmark's Links. */
    links: Link[];
    /** A list of unique aliases by which this bookmark can be referenced. */
    aliases: string[];
}

/** The Google account's profile name, synced to local storage. */
export const profileName: Writable<string> = writable(localStorage.getItem("profileName") || default_name);

/** The Google account's profile photo, synced to local storage. */
export const profileIcon: Writable<string> = writable(localStorage.getItem("profileIcon" || default_icon));

/** The user's bookmarks, synced to local storage. */
export const profileBookmarks: Writable<Bookmark[]> = writable(JSON.parse(localStorage.getItem("profileBookmarks") || "[]"));

/** The Canvas calendar link (a .ics file) used to load assignments from that LMS. Synced to local storage. */
export const profileCanvasURL: Writable<string> = writable(localStorage.getItem("profileCanvasURL") || "");

/** The Canvas calendar link (a .ics file) used to load assignments from that LMS. Synced to local storage. */
export const profilePreferredGoogleUser: Writable<string> = writable(localStorage.getItem("profilePreferredGoogleUser") || "0");

/** */
export const profilePreferredColorScheme: Writable<string> = writable(localStorage.getItem("profilePreferredColorScheme") || "auto");

/** Once signed out of Google, reset profile data to defualt. */
export const profileGoogleSignout = () => {
    profileName.set(default_name);
    profileIcon.set(default_icon);
}

// Sync all profile data to local storage, preserving it after the page is unloaded.
profileName.subscribe(value => localStorage.setItem("profileName", value));
profileIcon.subscribe(value => localStorage.setItem("profileIcon", value));
profileBookmarks.subscribe(value => localStorage.setItem("profileBookmarks", JSON.stringify(value)));
profileCanvasURL.subscribe(value => localStorage.setItem("profileCanvasURL", value));
profilePreferredGoogleUser.subscribe(value => localStorage.setItem("profilePreferredGoogleUser", value));
profilePreferredColorScheme.subscribe(value => localStorage.setItem("profilePreferredColorScheme", value));

/**
 * A derived store of all profile aliases with their corresponding Bookmark's index in `$profileBookmarks`.
 * 
 * @example
 * $profileBookmarks = {{aliases: ["a", "b"]}, {aliases: ["c"]}}
 * // $profileAliases is now {a: 0, b: 0, c: 1}
 * $profileBookmarks[$profileAliases["a"]]
 * // Resolves to $profileBookmarks[0]
*/
export const profileAliases: Readable<[string, number]> = derived(profileBookmarks, $profileBookmarks =>
    // Convert a 2D array of aliases[][] to a 1D array of [alias, bookmarkIndex][].
    [].concat(
        ...$profileBookmarks.map((bookmark: Bookmark, bookmarkIndex: number) =>
            bookmark.aliases.map(alias => [alias, bookmarkIndex])))
        // Convert [alias, bookmarkIndex] pairs into { alias: bookmarkIndex } properties.
        .reduce((acc: [string, number][], keyval: [string, number]) => acc = { ...acc, [keyval[0]]: keyval[1] }, {}))

/**
 * A derived store of all link names `$profileBookmark.link.name`.
 */
export const profileLinkNames: Readable<string[]> = derived(profileBookmarks, $profileBookmarks =>
    // Convert a 2D array of links[][] to a 1D array of link names.
    [].concat(
        ...$profileBookmarks.map((bookmark: Bookmark) =>
            bookmark.links.map(link => link.name)))
        // Filter out duplicate links.
        .filter((name, i, names) => names.indexOf(name) == i))