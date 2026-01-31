import express from "express";
import path from "path";
import fs from "fs";

const app = express();
const port = 3636;
const rootDir = new URL("../public", import.meta.url).pathname;

app.use((req, res, next) => {
	if (req.method == "GET") {
		// resolve path
		const requestedPath = path.normalize(path.join(rootDir, req.path));

		if (!requestedPath.startsWith(rootDir)) {
			return res.status(403).send("Forbidden");
		}
	}

	next();
});

app.get('/api/map', (req, res) => {
	const jsonPath = new URL("../db/map.json", import.meta.url).pathname;
	res.sendFile(jsonPath, (err) => {
		if (err) {
			console.error(err);
			res.status(500).send({ error: 'Failed to load JSON' });
		}
	});
});

app.use(express.json());

app.use(express.static(rootDir));

app.post("/api/:action", (req, res) => {
	if (req.params.action == "map") {
		try {
			const map_path = new URL("../db/map.json", import.meta.url).pathname;
			const raw = fs.readFileSync(map_path, "utf-8");
			const data = JSON.parse(raw);

			const { x, y, value } = req.body;
			if (!data[x]) { data[x] = {}; }
			data[x][y] = value;

			fs.writeFileSync(map_path, JSON.stringify(data, null, 2), "utf-8");
			res.status(200).send("OK");
		} catch (err) {
			console.error(err);
			res.status(500).send({ error: "Failed to update JSON" });
		}
	}
})

app.listen(port, () => {
	console.log(`Listening on port ${port}`)
});
