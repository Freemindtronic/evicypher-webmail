/**
 * Reports are asynchronous updates from a background task. They are used to
 * display a task advancement to the user.
 *
 * @module
 */
/** All possible updates from all the background tasks. */
export var State;
(function (State) {
    State["Scanning"] = "Scanning in progress.";
    State["NotificationSent"] = "Notification sent.";
    State["WaitingForPhone"] = "Waiting for the favorite phone to be found.";
    State["WaitingForFirstResponse"] = "Waiting for the favorite phone to answer.";
    State["SubtaskInProgress"] = "Task in progress.";
    State["SubtaskComplete"] = "Task complete.";
    State["SubtaskFailed"] = "Task failed.";
})(State || (State = {}));
//# sourceMappingURL=report.js.map