
const http = require("http");

const students = {};
const courses = {};
const registrations = [];

let nextRegistrationID = 1;

const server = http.createServer((req, res) => {
    res.setHeader("Content-Type", "application/json; charset=utf-8");

    function send(statusCode, data) {
        res.writeHead(statusCode);
        res.end(JSON.stringify(data));
    }

    let body = "";

    req.on("data", chunk => {
        body += chunk;
    });

    req.on("end", () => {
        let data = {};

        try {
            if (body) {
                data = JSON.parse(body);
            }
        } catch (error) {
            return send(400, {
                result: "ERROR_BAD_JSON"
            });
        }

        const studentMatch = req.url.match(
            /^\/students\/([a-zA-Z0-9_-]+)$/
        );

        const courseMatch = req.url.match(
            /^\/courses\/([a-zA-Z0-9_-]+)$/
        );

        if (req.method === "PUT" && studentMatch) {
            const studentID = studentMatch[1];

            if (
                data.status !== undefined &&
                typeof data.status !== "string"
            ) {
                return send(400, {
                    result: "ERROR_BAD_REQUEST"
                });
            }

            if (
                data.coursesTaken !== undefined &&
                !Array.isArray(data.coursesTaken)
            ) {
                return send(400, {
                    result: "ERROR_BAD_REQUEST"
                });
            }

            students[studentID] = {
                status: data.status ?? "active",
                coursesTaken: data.coursesTaken ?? []
            };

            return send(200, {
                result: "OK"
            });
        }

        if (req.method === "PUT" && courseMatch) {
            const courseID = courseMatch[1];

            if (
                data.prerequisites !== undefined &&
                !Array.isArray(data.prerequisites)
            ) {
                return send(400, {
                    result: "ERROR_BAD_REQUEST"
                });
            }

            courses[courseID] = {
                courseID: courseID,
                prerequisites: data.prerequisites ?? []
            };

            return send(200, {
                result: "OK"
            });
        }

        if (req.method === "GET" && courseMatch) {
            const course = courses[courseMatch[1]];

            if (!course) {
                return send(404, {
                    result: "ERROR_NO_COURSE"
                });
            }

            return send(200, course);
        }

        if (
            req.method === "POST" &&
            req.url === "/registrations"
        ) {
            if (
                typeof data.studentID !== "string" ||
                !data.studentID ||
                typeof data.courseID !== "string" ||
                !data.courseID
            ) {
                return send(400, {
                    result: "ERROR_BAD_REQUEST"
                });
            }

            const student = students[data.studentID];

            if (!student) {
                return send(200, {
                    result: "ERROR_NO_STUDENT"
                });
            }

            if (student.status !== "active") {
                return send(200, {
                    result: "ERROR_INACTIVE_STUDENT"
                });
            }

            const course = courses[data.courseID];

            if (!course) {
                return send(200, {
                    result: "ERROR_NO_COURSE"
                });
            }

            const missing = course.prerequisites.filter(
                prerequisite =>
                    !student.coursesTaken.includes(prerequisite)
            );

            if (missing.length > 0) {
                return send(200, {
                    result: "ERROR_PREREQUISITES",
                    missing: missing
                });
            }

            const registration = {
                registrationID: nextRegistrationID++,
                studentID: data.studentID,
                courseID: data.courseID
            };

            registrations.push(registration);

            return send(201, {
                result: "OK",
                registrationID: registration.registrationID
            });
        }

        if (
            req.method === "GET" &&
            req.url === "/registrations"
        ) {
            return send(200, registrations);
        }

        return send(404, {
            result: "ERROR_NOT_FOUND"
        });
    });
});

server.listen(3000, () => {
    console.log(
        "Бүртгэлийн API: http://localhost:3000"
    );
});
