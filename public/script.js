function docID(element) { return document.getElementById(element); }
function docClass(className) { return document.getElementsByClassName(className); }
function docQuery(query) { return document.querySelector(query); }

let c_width, c_height;

let grass_bitmap, farmand_bitmap;
let bitmaps = [];
let tile_hover = { x: 0, y: 0 };
const tile_size = 16;

const map_height = 100;
const map_width = 100;
let zoom, scale;
const dpr = window.devicePixelRatio;
function setZoom(value) {
	zoom = value;
	scale = dpr / zoom;
	highlight.style.width = tile_size * dpr + "px";
	highlight.style.height = tile_size * dpr + "px";
}

const c = docID("map");
const ctx = c.getContext("2d");

const highlight = docID("highlight");

let map_data = [[]];
async function getMapData() {
	try {
		const res = await fetch("/api/map");
		if (!res.ok) { throw new Error(`Response status: ${res.status}`); }
		const json = await res.json();


		for (let x = 0; x < map_width; x++) {
			map_data[x] = [];
			for (let y = 0; y < map_height; y++) {
				map_data[x][y] = json[x]?.[y] ?? 0;
			}
		}
	} catch(e) {
		console.error(e);
		return null;
	}
}

setZoom(2);

async function getImageBitmap(path) {
	try {
		const res = await fetch(path);
		if (!res.ok) { throw new Error(`Response status: ${res.status}`); }
		const blob = await res.blob();
		const bitmap = await createImageBitmap(blob);

		return bitmap;
	} catch(e) {
		console.error(e);
		return null;
	}
}


function resizeCanvas() {
	c_width = window.innerWidth;
	c_height = window.innerHeight;
	c.width = c_width / scale / zoom;
	c.height = c_height / scale / zoom;
	c.style.width = c_width + "px";
	c.style.height = c_height + "px";

	drawMap();
}


function drawMap() {
	for (let x = 0; x < map_width; x++) {
		for (let y = 0; y < map_height; y++) {
			ctx.drawImage(bitmaps[map_data[x][y]], tile_size*x, tile_size*y);
		}
	}
}

async function main() {
	getMapData();
	bitmaps[0] = await getImageBitmap("/images/tiles/farmland.png");
	bitmaps[1] = await getImageBitmap("/images/tiles/grass_patches.png");

	resizeCanvas();

	ctx.clearRect(0, 0, map_width*tile_size, map_height*tile_size);

	drawMap();
}

main();

document.onmousemove = (e) => {
	tile_hover.x = Math.floor(e.clientX / tile_size / dpr);
	tile_hover.y = Math.floor(e.clientY / tile_size / dpr);
	highlight.style.top = tile_hover.y * tile_size /(c.width / c.offsetWidth) + "px";
	highlight.style.left = tile_hover.x * tile_size /(c.height / c.offsetHeight) + "px";
}

async function updateTile(x, y, value) {
	try {
		const res = await fetch("/api/map", {
			method: "POST",
			headers: { "Content-Type": "application/json", "Accept": "adsfasdf" },
			body: JSON.stringify({ x: x, y: y, value: value })
		});

		if (!res.ok) { throw new Error(`Response status: ${res.status}`); }
	} catch(e) {
		console.error(e);
		return null;
	}

}

document.onclick = () => {
	map_data[tile_hover.x][tile_hover.y] = map_data[tile_hover.x][tile_hover.y] ? 0 : 1;
	ctx.clearRect(0, 0, map_width*tile_size, map_height*tile_size)
	drawMap();
	updateTile(tile_hover.x, tile_hover.y, map_data[tile_hover.x][tile_hover.y]);
}
