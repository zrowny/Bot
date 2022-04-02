// ==UserScript==
// @name         PlaceNL Bot
// @namespace    https://github.com/PlaceNL/Bot
// @version      4
// @description  De bot voor PlaceNL!
// @author       NoahvdAa
// @match        https://www.reddit.com/r/place/*
// @match        https://new.reddit.com/r/place/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=reddit.com
// @require	     https://cdn.jsdelivr.net/npm/toastify-js
// @resource     TOASTIFY_CSS https://cdn.jsdelivr.net/npm/toastify-js/src/toastify.min.css
// @updateURL    https://github.com/TrafficConeGod/Bot/raw/master/placenlbot.user.js
// @downloadURL  https://github.com/TrafficConeGod/Bot/raw/master/placenlbot.user.js
// @grant        GM_getResourceText
// @grant        GM_addStyle
// ==/UserScript==

// Sorry about the messy code, I'll clean it up later

var placeOrders = [];	
var accessToken;
var canvas = document.createElement('canvas');

const COLOR_MAPPINGS = {
    '#BE0039': 1,
    '#FF4500': 2,
    '#FFA800': 3,
    '#FFD635': 4,
    '#00A368': 6,
    '#00CC78': 7,
    '#7EED56': 8,
    '#00756F': 9,
    '#009EAA': 10,
    '#2450A4': 12,
    '#3690EA': 13,
    '#51E9F4': 14,
    '#493AC1': 15,
    '#6A5CFF': 16,
    '#811E9F': 18,
    '#B44AC0': 19,
    '#FF3881': 22,
    '#FF99AA': 23,
    '#6D482F': 24,
    '#9C6926': 25,
    '#000000': 27,
    '#898D90': 29,
    '#D4D7D9': 30,
    '#FFFFFF': 31
};

(async function () {
	GM_addStyle(GM_getResourceText('TOASTIFY_CSS'));
	canvas.width = 2000;
	canvas.height = 1000;
	canvas = document.body.appendChild(canvas);

	Toastify({
		text: 'Getting access token... ',
		duration: 10000
	}).showToast();
	accessToken = await getAccessToken();
	Toastify({
		text: 'Access token collected!',
		duration: 10000
	}).showToast();

	setInterval(updateOrders, 5 * 60 * 1000); // Update orders every 5 minutes
	await updateOrders();
	attemptPlace();
})();

async function attemptPlace() {
	var ctx;
	try {
		const canvasUrl = await getCurrentImageUrl('0');
		const canvasUrl2 = await getCurrentImageUrl('1');
		console.warn("cv " + canvasUrl);
		console.warn("cv2 " + canvasUrl2);
		ctx = await getCanvasFromUrl(canvasUrl, 0, 0);
		await getCanvasFromUrl(canvasUrl2, 1000, 0);
	} catch (e) {
		console.warn("Error creating reference canvas:", e);
		Toastify({
			text: 'Error creating reference canvas. Trying again in 15 sec...',
			duration: 10000
		}).showToast();
		setTimeout(attemptPlace, 15000); // Try again in 15sec.
		return;
	}

	for (const order of placeOrders) {
		const x = order[0];
		const y = order[1];
		const colorId = order[2];
		const rgbaAtLocation = ctx.getImageData(x, y, 1, 1).data;
		const hex = rgbToHex(rgbaAtLocation[0], rgbaAtLocation[1], rgbaAtLocation[2]);
		const currentColorId = COLOR_MAPPINGS[hex];
		// Deze pixel klopt al.
		if (currentColorId == colorId) continue;

		Toastify({
			text: `Trying to post pixel to ${x}, ${y}...`,
			duration: 10000
		}).showToast();
		console.log(`Trying to post pixel to ${x}, ${y}...`);
		await place(x, y, colorId);

		Toastify({
			text: `Waiting for cooldown...`,
			duration: 315000
		}).showToast();
		setTimeout(attemptPlace, 315000); // 5min en 15sec, just to be safe.
		return;
	}

	Toastify({
		text: 'All pixels are already in the right place!',
		duration: 10000
	}).showToast();
	setTimeout(attemptPlace, 30000); // Try again 30sec.
}

function updateOrders() {
	fetch('https://trafficconegod.github.io/Bot/orders.json').then(async (response) => {
		if (!response.ok) return console.warn('Kan orders niet ophalen! (non-ok status code)');
		const data = await response.json();

		if (JSON.stringify(data) !== JSON.stringify(placeOrders)) {
			Toastify({
				text: `New orders loaded. Total pixels: ${data.length}.`,
				duration: 10000
			}).showToast();
		}

		placeOrders = data;
	}).catch((e) => console.warn('Can\'t fetch orders!', e));
}

function place(x, y, color) {
	return fetch('https://gql-realtime-2.reddit.com/query', {
		method: 'POST',
		body: JSON.stringify({
			'operationName': 'setPixel',
			'variables': {
				'input': {
					'actionName': 'r/replace:set_pixel',
					'PixelMessageData': {
						'coordinate': {
							'x': x,
							'y': y
						},
						'colorIndex': color,
						'canvasIndex': 0
					}
				}
			},
			'query': 'mutation setPixel($input: ActInput!) {\n  act(input: $input) {\n    data {\n      ... on BasicMessage {\n        id\n        data {\n          ... on GetUserCooldownResponseMessageData {\n            nextAvailablePixelTimestamp\n            __typename\n          }\n          ... on SetPixelResponseMessageData {\n            timestamp\n            __typename\n          }\n          __typename\n        }\n        __typename\n      }\n      __typename\n    }\n    __typename\n  }\n}\n'
		}),
		headers: {
			'origin': 'https://hot-potato.reddit.com',
			'referer': 'https://hot-potato.reddit.com/',
			'apollographql-client-name': 'mona-lisa',
			'Authorization': `Bearer ${accessToken}`,
			'Content-Type': 'application/json'
		}
	});
}

async function getAccessToken() {
	const usingOldReddit = window.location.href.includes('new.reddit.com');
	const url = usingOldReddit ? 'https://new.reddit.com/r/place/' : 'https://www.reddit.com/r/place/';
	const response = await fetch(url);
	const responseText = await response.text();

	// TODO: ew
	return responseText.split('\"accessToken\":\"')[1].split('"')[0];
}

async function getCurrentImageUrl(id = '0') {
    return new Promise((resolve, reject) => {
        const ws = new WebSocket('wss://gql-realtime-2.reddit.com/query', 'graphql-ws');

        ws.onopen = () => {
            ws.send(JSON.stringify({
                'type': 'connection_init',
                'payload': {
                    'Authorization': `Bearer ${accessToken}`
                }
            }));
            ws.send(JSON.stringify({
                'id': '1',
                'type': 'start',
                'payload': {
                    'variables': {
                        'input': {
                            'channel': {
                                'teamOwner': 'AFD2022',
                                'category': 'CANVAS',
                                'tag': id
                            }
                        }
                    },
                    'extensions': {},
                    'operationName': 'replace',
                    'query': 'subscription replace($input: SubscribeInput!) {\n  subscribe(input: $input) {\n    id\n    ... on BasicMessage {\n      data {\n        __typename\n        ... on FullFrameMessageData {\n          __typename\n          name\n          timestamp\n        }\n      }\n      __typename\n    }\n    __typename\n  }\n}'
                }
            }));
        };

        ws.onmessage = (message) => {
            const { data } = message;
            const parsed = JSON.parse(data);

            // TODO: ew
            if (!parsed.payload || !parsed.payload.data || !parsed.payload.data.subscribe || !parsed.payload.data.subscribe.data) return;

            ws.close();
            resolve(parsed.payload.data.subscribe.data.name);
        }

        ws.onerror = reject;
    });
}

function getCanvasFromUrl(url, x, y) {
	GM.xmlHttpRequest({
		method: "GET",
		url: url,
		headers: {
			"Accept": "image/avif,image/webp"
		},
		onload: response => {
			console.log(
				response.status,
				response.statusText,
				response.readyState,
				response.responseHeaders,
				response.responseText,
				response.finalUrl
			);
		}
	});
	return new Promise((resolve, reject) => {
		var ctx = canvas.getContext('2d');
		var img = new Image();
		img.crossOrigin = 'anonymous';
		img.onload = () => {
			ctx.drawImage(img, x, y);
			resolve(ctx);
		};
		img.onerror = reject;
		img.src = url;
	});
}

function rgbToHex(r, g, b) {
	return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}
