/**
 * Manage LMS and other third-party integrations.
 * @module assignments
 */

import {
    profileName,
    profileIcon,
    profileGoogleSignout,
    profileCanvasURL
} from "./userdata";

import { get, writable, Writable } from 'svelte/store';

/**
 * Binary search: locates the index at which a number should be inserted to maintain sorted order.
 * @param A An array of numbers.
 * @param T The number to search for.
 * @returns The index at which the number should be inserted.
 */
const search = (A: number[], T: number) => {
    let L = 0;
    let R = A.length - 1;
    while (L <= R) {
        let m = Math.floor((L + R) / 2);
        if (A[m] < T) L = m + 1;
        else if (A[m] > T) R = m - 1;
        else return m;
    }
    return L;
};

/** The main list of Items, rendered into the TaskList as Tasks. */
export const taskItems: Writable<Item[]> = writable([]);

export class Item {
    /** The name of the assignment. */
    name: string;
    /** The class to which this assignment belongs. */
    className: string;
    /** A description of this activity (available in Classroom). */
    description: string;
    /** A direct URL to this assignment in its respecive LMS. */
    url: string;
    /** The due date for this assignment. */
    date: Date;
    /** A status indicating the completion of this assignment: `1` for completed, `0` for incomplete, and `-1` for unknown. */
    completed: 0 | 1 | -1 = -1;

    /** Constructor: insert new item into the taskItems list such that it remains sorted by date. */
    constructor(name: string, className: string, description: string, url: string, date: Date, completed: 1 | 0 | -1 = -1) {
        this.name = name;
        this.className = className;
        this.description = description;
        this.url = url;
        this.date = date;
        this.completed = completed;
        let insert = search(
            get(taskItems).map((item: Item) => item.date.getTime()),
            this.date.getTime()
        );
        taskItems.set([
            ...get(taskItems).slice(0, insert),
            this,
            ...get(taskItems).slice(insert),
        ]);
    }
};

/** Google API object, loaded from the Google library. */
let gapi: any;

/** Setup the Google Classroom API and login/logout callbacks. */
const setupGAPI = () => {
    gapi.client
        .init({
            clientId:
                "254795124493-hqrmlh9oqs85knd24o98c3644hmiqoc3.apps.googleusercontent.com",
            discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/classroom/v1/rest",
            ],
            scope: [
                "profile",
                "https://www.googleapis.com/auth/classroom.courses.readonly",
                "https://www.googleapis.com/auth/classroom.coursework.me.readonly",
            ].join(" "),
        })
        .then(
            () => {
                gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
                updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
            },
            (error: any) => {
                console.error(JSON.stringify(error, null, 2));
            }
        );
};

/** Update the user profile on Google sign-in status change. */
const updateSigninStatus = (isSignedIn: boolean) => {
    if (isSignedIn) {
        let profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
        if (profile.getName() != get(profileName)) {
            profileName.set(profile.getName());
            profileIcon.set(profile.getImageUrl());
        }

        setupClassroom();
    } else {
        profileGoogleSignout();
    }
}

/** Sign in or out of Google, depending on the current status. */
export const googleChangeSignIn = () => gapi.auth2.getAuthInstance().isSignedIn.get() ? gapi.auth2.getAuthInstance().signOut() : gapi.auth2.getAuthInstance().signIn();

/** Load assignments from the Google Classroom API. */
const setupClassroom = async () => {
    // Get every course the student has ever enrolled in, then ignore all archived courses.
    const allCourses = await gapi.client.classroom.courses.list();
    const currCourses = allCourses.result.courses.filter(
        (course: any) => course.courseState != "ARCHIVED"
    );
    // Get every assignment from every course.
    const assignmentGroups = (
        await Promise.all(
            currCourses.map(async (course) => {
                const works = await gapi.client.classroom.courses.courseWork.list({
                    courseId: course.id,
                });
                return works.result.courseWork;
            })
        )
    ).filter((group) => group != undefined);

    // Convert 2D assignment groups (all per class) to 1D assignments (all per student).
    // https://stackoverflow.com/a/39805778/9068081
    const assignments = [].concat(...assignmentGroups);

    // Submissions and assignments are handled separately, as would be in the teacher view.
    // So every assignment is converted into a classroomItem with its corresponding submission.

    let classroomItems: { assignment: any, submission: any }[] = await Promise.all(
        assignments.map(async (assignment) => {
            // Get every submission for every assignment (there is only ever one per student).
            const submissionsList = await gapi.client.classroom.courses.courseWork.studentSubmissions.list(
                {
                    courseId: assignment.courseId,
                    courseWorkId: assignment.id,
                }
            );
            return {
                assignment: assignment,
                submission: submissionsList.result.studentSubmissions[0],
            };
        })
    );

    // Convert every assignment/submission pair into an Item.
    classroomItems
        .filter((item) => item.submission.state == "CREATED")
        .forEach(
            (item) =>
                new Item(
                    item.assignment.title,
                    currCourses.find(
                        (course: any) => course.id == item.assignment.courseId
                    ).name,
                    item.assignment.description,
                    item.assignment.alternateLink.replace(
                        "classroom.google.com/",
                        "classroom.google.com/u/1/"
                    ),
                    item.assignment.dueDate
                        ? new Date(
                            Date.UTC(
                                item.assignment.dueDate.year,
                                item.assignment.dueDate.month - 1,
                                item.assignment.dueDate.day,
                                item.assignment.dueTime.hours,
                                item.assignment.dueTime.minutes || 0
                            )
                        )
                        : new Date(),
                    // Classroom items might not always have a due date.
                    // We're tentatively setting the due date to be right now, but these should really be marked in their own category.
                    item.submission.state != "CREATED" ? 1 : 0
                )
        );

    console.log(
        `Loaded ${classroomItems.length} Google Classroom assignments from ${currCourses.length} courses: `,
        classroomItems.map((item) => item.assignment.title)
    );
    // This return value shouldn't be needed.
    return classroomItems;
};

/** Load assignments from a Canvas personal calendar. */
const setupICAL = async () => {
    /** ICAL library object, loaded from the library. */
    const ICAL: any = (window as any).ICAL;
    // Fetch the calendar through a proxy that will add CORS to our request.
    // This isn't necessarily secure, but the calendar is publicly accessible regardless.
    // Without the proxy and still relying on the Canvas calendar, we'd need to make our own server,
    // and this app is designed to be able to run independently.
    const response = await fetch(
        new Request(
            "https://cors-anywhere.herokuapp.com/" +
            ((url: URL) => url.hostname + url.pathname).call(undefined, new URL(get(profileCanvasURL))),
            {
                mode: "cors",
            }
        )
    );

    if (!response.ok) {
        console.error(`HTTP error fetching calendar! status: ${response.status}`);
        return;
    }

    // Get the text body of the response.
    const calendarData = await response.text();

    // Parse the calendar data.
    let canvasItems = new ICAL.Component(
        ICAL.parse(calendarData)
    ).getAllSubcomponents("vevent");
    console.log(
        `Loaded ${canvasItems.length} Canvas assignments: `,
        canvasItems.map(
            (item: any) => (item.getFirstPropertyValue("summary").match(/.+?(?= \()/) ||
                item.getFirstPropertyValue("summary").match(/.+?(?= \[)/))[0]
        ));

    // Assemble a direct link to any Canvas assignment.
    // These regexes are broken in Safari, and I'm not sure how to fix them.
    const assembleCanvasURL = (href: string) => {
        const url = new URL(href);
        return (
            url.origin +
            "/courses/" +
            url.searchParams.get("include_contexts").replace("course_", "") +
            "/assignments/" +
            url.hash.replace("#assignment_", "")
        );
    };


    // Ignore past assignments.
    canvasItems
        .filter(
            (item: any) =>
                new Date().getTime() <=
                item.getFirstPropertyValue("dtstart").toJSDate().getTime()
        )
        // Convert each Canvas calendar event into an Item.
        .forEach((item: any) => {
            new Item(
                (item.getFirstPropertyValue("summary").match(/.+?(?= \()/) ||
                    item.getFirstPropertyValue("summary").match(/.+?(?= \[)/))[0],
                item.getFirstPropertyValue("summary").match(/\[([^\]]+)\]/)[0],
                item.getFirstPropertyValue("description"),
                assembleCanvasURL(item.getFirstPropertyValue("url")),
                item.getFirstPropertyValue("dtstart").toJSDate(),
                new Date().getTime() >
                    item.getFirstPropertyValue("dtstart").toJSDate().getTime()
                    ? 1
                    : -1
                // Since Canvas won't tell us if something is done, we'll only show upcoming assignments.
                // Note that past assignments (currently they don't even make it to this point) are marked as complete,
                // but current/future is incomplete because the calendar doesn't update to let us know if they're finished.
            );
        });
};

/** Load an external script. */
const loadScript = (src: string) => {
    return new Promise((resolve, reject) => {
        let s: HTMLScriptElement = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
};

/** Load APIs and their respective assignments for all LMSes. */
export const loadAssignments = () => {
    taskItems.set([]);
    loadScript("https://unpkg.com/ical.js@1.4.0/build/ical.js").then(setupICAL);
    loadScript("https://apis.google.com/js/api:client.js").then(() => {
        gapi = (window as any).gapi; gapi.load("auth2", setupGAPI);
    }
    );
}