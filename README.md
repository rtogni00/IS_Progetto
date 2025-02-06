# Software Engineering Project

This repository tracks the development of an event management app for the
Software Engineering course at the University of Trento.

## Documentation

### D1

Project description, featuring:

-   Project goal;
-   Functional requirements;
-   Non-functional requirements;
-   Front-end design sketch.

### D2

Diagrams formally describing system functionalities, including:

-   Use case diagrams;
-   Component diagrams;
-   Sequence diagrams;
-   Class diagrams.

Description of the relationship between high-level view given by
diagrams and actual API implementation.

### D3

-   Implementation details expressed through user stories and user flow diagrams;
-   Web API documentaiton, along with development approach and code organization strategy;
-   Testing;
-   Front-end showcase;
-   Deployment.

### D4

Final report.

## Database

The back-end is based on MongoDB and Mongoose. Mongoose collections are defined under `/node_app/models`.

## API

Documentation created using swagger, see `swagger/evenTrentoAPIs.yaml`. API routes are defined in `node_app/routes`

## Front-end

Entry point in `index.html` (main page). Page structure under `pages/`, corresponding javascript
files under `scripts/`. Pages include:

-   `login.html` &rarr; connects to db, if login successful then redirects to main page
-   `register.html` &rarr; connects to db, if successful then redirects to login page
-   `eventList.html` &rarr; shows list of events available
-   `eventDetails.html` &rarr; shows details of selected event
-   `userPersonalArea.html` &rarr; shows user's profile, along with saved events and events
    they are enrolled in
