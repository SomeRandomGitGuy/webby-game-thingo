import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const port = 3636;
const rootDir = new URL("../public", import.meta.url).pathname;

app.use(function (req, res, next) {
	// resolve path
	const requestedPath = path.normalize(path.join(rootDir, req.path));

	if (!requestedPath.startsWith(rootDir)) {
		return res.status(403).send("Forbidden");
	}

	next();
});

app.use(express.static(rootDir));

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
});
