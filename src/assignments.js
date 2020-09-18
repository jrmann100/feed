import {
    profileName,
    profileIcon,
    profileGoogleSignout,
    profileCanvasURL
} from "./userdata.js";

import { get, writable } from 'svelte/store';

const search = (A, T) => {
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

export const taskItems = writable([]);

export const Item = class {
    constructor(name, className, description, url, date, completed = -1) {
        this.name = name;
        this.className = className;
        this.description = description;
        this.url = url;
        this.date = date;
        this.completed = completed;
        let insert = search(
            get(taskItems).map((item) => item.date.getTime()),
            this.date.getTime()
        );
        taskItems.set([
            ...get(taskItems).slice(0, insert),
            this,
            ...get(taskItems).slice(insert),
        ]);
    }
};

let googleAuth;

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
                googleAuth = gapi.auth2.getAuthInstance();
                googleAuth.isSignedIn.listen(updateSigninStatus);
                updateSigninStatus(googleAuth.isSignedIn.get());
            },
            (error) => {
                console.error(JSON.stringify(error, null, 2));
            }
        );
};

const updateSigninStatus = (isSignedIn) => {
    if (isSignedIn) {
        let profile = googleAuth.currentUser.get().getBasicProfile();
        if (profile.getName() != get(profileName)) {
            profileName.set(profile.getName());
            profileIcon.set(profile.getImageUrl());
        }

        setupClassroom();
    } else {
        profileGoogleSignout();
    }
}

export const googleChangeSignIn = () => ((auth2) => auth2.isSignedIn.get() ? auth2.signOut() : auth2.signIn()).call(undefined, gapi.auth2.getAuthInstance());

const setupClassroom = async () => {
    const allCourses = await gapi.client.classroom.courses.list();
    const currCourses = allCourses.result.courses.filter(
        (course) => course.courseState != "ARCHIVED"
    );
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

    const submissions = await Promise.all(
        assignments.map(async (assignment) => { })
    );

    let classroomItems = await Promise.all(
        assignments.map(async (assignment) => {
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
    classroomItems
        .filter((item) => item.submission.state == "CREATED")
        .forEach(
            (item) =>
                new Item(
                    item.assignment.title,
                    currCourses.find(
                        (course) => course.id == item.assignment.courseId
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
    return classroomItems;
};

const setupICAL = async () => {
    const response = await fetch(
        new Request(
            "https://cors-anywhere.herokuapp.com/" +
            ((url) => url.hostname + url.pathname).call(undefined, new URL(get(profileCanvasURL))),
            {
                mode: "cors",
            }
        )
    );

    if (!response.ok) {
        console.error(`HTTP error fetching calendar! status: ${response.status}`);
        return;
    }

    const calendarData = await response.blob().then((blob) => blob.text());

    let canvasItems = new ICAL.Component(
        ICAL.parse(calendarData)
    ).getAllSubcomponents("vevent");
    console.log(
        `Loaded ${canvasItems.length} Canvas assignments: `,
        canvasItems.map(
            (item) => (item.getFirstPropertyValue("summary").match(/.+?(?= \()/) ||
            item.getFirstPropertyValue("summary").match(/.+?(?= \[)/))[0]
    ));

    // This is broken in Safari.
    const assembleCanvasURL = (url) => {
        return (
            url.match(/^.*(?=\/calendar)/) +
            "/courses/" +
            url.match(/(?<=course_)[0-9]*/) +
            "/assignments/" +
            url.match(/(?<=assignment_)[0-9]*/)
        );
    };
    window.item = canvasItems[0];

    canvasItems
        .filter(
            (item) =>
                new Date().getTime() <=
                item.getFirstPropertyValue("dtstart").toJSDate().getTime()
        )
        .forEach((item) => {
            window.item = item;
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
            );
        });
};

const loadScript = (src) => {
    return new Promise(function (resolve, reject) {
        let s;
        s = document.createElement("script");
        s.src = src;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
    });
};

export const loadAssignments = () => {
    taskItems.set([]);
    loadScript("https://unpkg.com/ical.js@1.4.0/build/ical.js").then(setupICAL);
    loadScript("https://apis.google.com/js/api:client.js").then(() =>
        gapi.load("auth2", setupGAPI)
    );
}