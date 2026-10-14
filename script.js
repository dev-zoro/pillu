/* ------------------------------------------------------------
   Birthday surprise — script (plain JavaScript, no libraries)

   Flow:
     1. Intro: "Happy Birthday ♥ Pillu"  → click the heart
     2. Heart grows, shows the cover photo, says "(click anywhere)"
     3. Click anywhere → page 1: two lines type out, then a heart with a photo
     4. Click anywhere → next page … until the last one
   ------------------------------------------------------------ */
(() => {
	"use strict";

	/* ==========  EDIT THIS PART  ========== */

	// Photo inside the big heart you click at the start.
	const COVER_PHOTO = "images/photo0.jpg";

	// Each page = 2 lines + 1 photo (shown in a heart under the lines).
	const PAGES = [
		{
			lines: [
				"Hello my love,",
				"You are the most wonderful person I\u2019ve ever met :)",
			],
			photo: "images/photo1.jpg",
		},

		{
			lines: [
				"You are the most beautiful!",
				"You are the most charming!",
			],
			photo: "images/photo2.jpg",
		},

		{
			lines: [
				"You are the most adorable!",
				"You are the best thing that ever happened to me",
			],
			photo: "images/photo3.jpg",
		},

		{
			lines: [
				"...\u201CWith you, I need nothing else\u201D",
				"I will love you until the end of my days \u2665",
			],
			photo: "images/photo4.jpg",
		},

		{
			lines: [
				"Trust me, \u2018We will have a wonderful journey for the rest of our lives \u2665\u2019 :*",
				"-- Love you always --",
			],
			photo: "images/photo5.jpg",
		},
	];

	// Shown under the last heart. Set to '' to hide it.
	const SIGNATURE = "Nikhil";

	// Typing speed (milliseconds per letter).
	const CHAR_MS = 55;

	/* ==========  END OF EDIT PART  ========== */

	const LINE_PAUSE = 450; // pause after a line finishes typing
	const SVG_NS = "http://www.w3.org/2000/svg";
	const XLINK_NS = "http://www.w3.org/1999/xlink";

	// Heart outline, drawn in a 100 x 90 box.
	const HEART_PATH =
		"M50 88C20 62 2 44 2 26 2 12 13 2 27 2 37 2 46 8 50 17 " +
		"54 8 63 2 73 2 87 2 98 12 98 26 98 44 80 62 50 88Z";

	const $ = (sel) => document.querySelector(sel);
	const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

	/* ---------- Photos: use yours, or a pink placeholder if the file is missing ---------- */

	function placeholder(n) {
		const svg =
			"<svg xmlns='http://www.w3.org/2000/svg' width='400' height='360' viewBox='0 0 400 360'>" +
			"<rect width='400' height='360' fill='#f48fb1'/>" +
			"<text x='200' y='188' font-family='sans-serif' font-size='30' fill='#fff' text-anchor='middle'>" +
			"Photo " +
			n +
			"</text></svg>";
		return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
	}

	function checkImage(src, n) {
		return new Promise((resolve) => {
			const img = new Image();
			const timer = setTimeout(() => resolve(src), 5000); // slow connection: just use the real file
			img.onload = () => {
				clearTimeout(timer);
				resolve(src);
			};
			img.onerror = () => {
				clearTimeout(timer);
				resolve(placeholder(n));
			};
			img.src = src;
		});
	}

	const SOURCES = [COVER_PHOTO, ...PAGES.map((p) => p.photo)];
	let photoURLs = SOURCES.map((_, n) => placeholder(n)); // replaced as soon as the real ones are checked
	const photosReady = Promise.all(SOURCES.map(checkImage)).then((urls) => {
		photoURLs = urls;
	});

	/* ---------- Heart builder (SVG with the photo clipped to the heart shape) ---------- */

	let heartCount = 0;

	function setHeartPhoto(svg, url) {
		const image = svg.querySelector("image");
		image.setAttribute("href", url);
		image.setAttributeNS(XLINK_NS, "href", url); // older Safari
	}

	function createHeart(photoUrl) {
		const clipId = "heart-clip-" + ++heartCount;
		const svg = document.createElementNS(SVG_NS, "svg");
		svg.setAttribute("class", "heart-svg");
		svg.setAttribute("viewBox", "-3 -3 106 96");
		svg.setAttribute("aria-hidden", "true");
		svg.innerHTML =
			'<defs><clipPath id="' +
			clipId +
			'"><path d="' +
			HEART_PATH +
			'"/></clipPath></defs>' +
			'<path class="heart-fill" d="' +
			HEART_PATH +
			'"/>' +
			'<image class="photo" x="0" y="0" width="100" height="90" ' +
			'preserveAspectRatio="xMidYMid slice" clip-path="url(#' +
			clipId +
			')"/>' +
			'<path class="heart-stroke" d="' +
			HEART_PATH +
			'"/>';
		setHeartPhoto(svg, photoUrl);
		return svg;
	}

	/* ---------- State ---------- */

	// intro → opening → cover → (transition → typing → ready) … → end
	let state = "intro";
	let pageIndex = 0;
	let skip = false; // true when she taps while text is typing: finish instantly
	let wake = null; // lets a tap cut a pause short

	function sleep(ms) {
		return new Promise((resolve) => {
			if (skip) return resolve();
			const timer = setTimeout(done, ms);
			function done() {
				clearTimeout(timer);
				wake = null;
				resolve();
			}
			wake = done;
		});
	}

	/* ---------- Screen 1: the intro heart ---------- */

	const heartBtn = $("#heartBtn");
	const introHeart = createHeart(photoURLs[0]);
	heartBtn.appendChild(introHeart);
	photosReady.then(() => setHeartPhoto(introHeart, photoURLs[0]));

	heartBtn.addEventListener("click", (event) => {
		if (state !== "intro") return;
		event.stopPropagation();
		state = "opening";
		heartBtn.blur();
		$("#intro").classList.add("opened");
		setTimeout(() => {
			state = "cover";
		}, 1700); // after the heart has finished growing
	});

	/* ---------- Screen 2: story pages ---------- */

	function buildPage(i) {
		const page = PAGES[i];
		const isLast = i === PAGES.length - 1;
		const root = $("#page");
		root.innerHTML = "";

		page.lines.forEach((text) => {
			const p = document.createElement("p");
			p.className = "line";
			p.innerHTML = '<span class="t"></span><span class="g"></span>';
			p.querySelector(".g").textContent = text; // full text is there (hidden) so the layout is stable
			root.appendChild(p);
		});

		const heart = document.createElement("div");
		heart.className = "story-heart";
		heart.appendChild(createHeart(photoURLs[i + 1]));
		root.appendChild(heart);

		if (isLast && SIGNATURE) {
			const sign = document.createElement("p");
			sign.className = "signature";
			sign.textContent = "\u2014 " + SIGNATURE;
			root.appendChild(sign);
		}

		if (isLast) {
			const replay = document.createElement("button");
			replay.className = "replay";
			replay.type = "button";
			replay.textContent = "\u21BB Replay";
			replay.addEventListener("click", (e) => {
				e.stopPropagation();
				location.reload();
			});
			root.appendChild(replay);
		} else {
			const hint = document.createElement("p");
			hint.className = "hint";
			hint.textContent = "(click anywhere)";
			root.appendChild(hint);
		}
	}

	async function typeLine(el, text) {
		const typed = el.querySelector(".t");
		const rest = el.querySelector(".g");
		for (let k = 1; k <= text.length && !skip; k++) {
			typed.textContent = text.slice(0, k);
			rest.textContent = text.slice(k);
			await sleep(/[,.!?:)]/.test(text[k - 1]) ? CHAR_MS * 4 : CHAR_MS); // breathe at punctuation
		}
		typed.textContent = text;
		rest.textContent = "";
	}

	async function showPage(i) {
		state = "typing";
		skip = false;
		buildPage(i);

		const root = $("#page");
		root.classList.remove("fading");

		await sleep(450);

		const lines = root.querySelectorAll(".line");
		for (let n = 0; n < lines.length; n++) {
			await typeLine(lines[n], PAGES[i].lines[n]);
			await sleep(LINE_PAUSE);
		}

		root.querySelector(".story-heart").classList.add("show");
		await sleep(1000);

		const sign = root.querySelector(".signature");
		if (sign) sign.classList.add("on");
		const hint = root.querySelector(".hint, .replay");
		if (hint) hint.classList.add("on");

		state = i === PAGES.length - 1 ? "end" : "ready";
	}

	async function startStory() {
		state = "transition";
		const intro = $("#intro");
		intro.classList.add("leaving");
		await delay(750);
		intro.hidden = true;
		$("#story").hidden = false;
		await photosReady;
		pageIndex = 0;
		showPage(pageIndex);
	}

	async function nextPage() {
		state = "transition";
		$("#page").classList.add("fading");
		await delay(500);
		pageIndex += 1;
		showPage(pageIndex);
	}

	/* ---------- "Click anywhere" ---------- */

	function advance() {
		if (state === "cover") {
			startStory();
		} else if (state === "typing") {
			skip = true; // finish the page right now
			if (wake) wake();
		} else if (state === "ready") {
			nextPage();
		}
	}

	document.addEventListener("click", advance);

	document.addEventListener("keydown", (event) => {
		if (
			event.key === "Enter" ||
			event.key === " " ||
			event.key === "ArrowRight"
		) {
			if (state === "intro") return; // in the intro, Enter/Space on the focused heart opens it
			if (event.target.closest && event.target.closest(".replay")) return;
			event.preventDefault();
			advance();
		}
	});
})();
