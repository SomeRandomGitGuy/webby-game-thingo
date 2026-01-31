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
let map_offset = { x: 0, y: 0 }
let zoom, scale;
const dpr = window.devicePixelRatio;

const c = docID("map");
const ctx = c.getContext("2d");

const highlight_elem = docID("highlight");
let highlight = {};

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

function setZoom(value) {
	zoom = value;
	scale = dpr * zoom;
	highlight_elem.style.width = tile_size * scale + "px";
	highlight_elem.style.height = tile_size * scale + "px";
	resizeCanvas();
}

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
	c.width = c_width / scale;
	c.height = c_height / scale;
	c.style.width = c_width + "px";
	c.style.height = c_height + "px";

	drawMap();
}


function drawMap() {
	ctx.clearRect(0, 0, c_width, c_height);
	for (let x = 0; x < map_width; x++) {
		for (let y = 0; y < map_height; y++) {
			ctx.drawImage(bitmaps[map_data[x][y]], tile_size*x - map_offset.x, tile_size*y - map_offset.y);
		}
	}
}

async function main() {
	getMapData();
	bitmaps[3] = await getImageBitmap("/images/tiles/offices2.png");
	bitmaps[2] = await getImageBitmap("/images/tiles/offices1.png");
	bitmaps[1] = await getImageBitmap("/images/tiles/farmland.png");
	bitmaps[0] = await getImageBitmap("/images/tiles/grass_patches.png");

	setZoom(1);
}

main();

c.onmousemove = (e) => {
	tile_hover.x = Math.floor((e.clientX/scale + map_offset.x) / tile_size);
	tile_hover.y = Math.floor((e.clientY/scale + map_offset.y) / tile_size);
	highlight.x = (tile_hover.x * tile_size - map_offset.x) * scale;
	highlight.y = (tile_hover.y * tile_size - map_offset.y) * scale;

	highlight_elem.style.left = highlight.x + "px";
	highlight_elem.style.top = highlight.y + "px";
}

async function updateTile(x, y, value) {
	try {
		hover = { x: tile_hover.x, y: tile_hover.y };
		const res = await fetch("/api/map", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ x: x, y: y, value: value })
		});

		if (!res.ok) { throw new Error(`Response status: ${res.status}`); }

		map_data[hover.x][hover.y] = value;
		const tile_x = hover.x * tile_size - map_offset.x;
		const tile_y = hover.y * tile_size - map_offset.y;

		ctx.clearRect(tile_x, tile_y, tile_size, tile_size);
		ctx.drawImage(bitmaps[map_data[hover.x][hover.y]], tile_x, tile_y, tile_size, tile_size);
	} catch(e) {
		console.error(e);
		return null;
	}

}

c.onmousedown = () => {
	updateTile(tile_hover.x, tile_hover.y, (map_data[tile_hover.x][tile_hover.y]+1) % bitmaps.length);
}


c.mouseleave = () => { highlight_elem.style.display = "none"; }
c.mouseenter = () => { highlight_elem.style.display = "block"; }

window.onresize = () => { resizeCanvas(); }

map_offsetCache = { x: 0, y: 0 };
window.onwheel = (e) => {
	map_offsetCache.x += e.deltaX;
	map_offsetCache.y += e.deltaY;
	const moveX = Math.trunc(map_offsetCache.x);
	const moveY = Math.trunc(map_offsetCache.y);

	if (map_offsetCache.x != 0 || map_offsetCache.y != 0) {
		map_offsetCache.x -= moveX;
		map_offsetCache.y -= moveY;
		map_offset.x = Math.max(0, Math.min(map_offset.x + moveX, Math.floor(map_width * tile_size - c_width / scale)))
		map_offset.y = Math.max(0, Math.min(map_offset.y + moveY, Math.floor(map_height * tile_size - c_height / scale)))

		drawMap();
	}

	c.onmousemove(e);
}

window.addEventListener("keydown", (e) => {
	if (e.key == '-') { setZoom(zoom/1.2); }
	if (e.key == '=') { setZoom(zoom*1.2); }
	if (e.key == '0') { setZoom(1); }
})
