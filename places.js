window.onload = () => {
	if (navigator.geolocation) {
		updatePlaces();

		setInterval(() => {
			updatePlaces();
		}, 20000);
	} else {
		alert('Geolocation не поддерживается вашим браузером');
	}
};

function updatePlaces() {
	navigator.geolocation.getCurrentPosition(
		function (position) {
			// than use it to load from remote APIs some places nearby
			dynamicLoadPlaces(position.coords).then((places) => {
				clearPlaces();
				renderPlaces(places);
			});
		},
		(err) => alert('Error in retrieving position', err),
		{
			enableHighAccuracy: true,
			maximumAge: 0,
			timeout: 20000,
		}
	);
}

function clearPlaces() {
	const scene = document.querySelector('a-scene');
	const images = scene.querySelectorAll('a-image');
	images.forEach((image) => {
		scene.removeChild(image);
	});
}

function convertObjectToPrettyString(obj) {
	let text = '';
	for (let item in obj) {
		text += `${item}: ${obj[item]}\n`;
	}
	return text;
}

// getting places from REST APIs
function dynamicLoadPlaces(position) {
	var url =
		'https://overpass-api.de/api/interpreter?data=[out:json];node(around:' +
		'100' +
		',' +
		position.latitude +
		',' +
		position.longitude +
		')["name"];out;';

	try {
		return fetch(url).then((res) => {
			return res.json().then((res) => {
				return res.elements;
			});
		});
	} catch (err) {
		console.error('Error with places API', err);
	}
}

function renderPlaces(places) {
	const scene = document.querySelector('a-scene');

	places.forEach((place) => {
		const latitude = place.lat;
		const longitude = place.lon;

		// add place icon
		const icon = document.createElement('a-image');
		icon.setAttribute('gps-entity-place', `latitude: ${latitude}; longitude: ${longitude}`);
		icon.setAttribute('name', convertObjectToPrettyString(place.tags));
		icon.setAttribute('src', './geometka.png');

		// for debug purposes, just show in a bigger scale, otherwise I have to personally go on places...
		icon.setAttribute('scale', '20 20 20');

		icon.addEventListener('loaded', () =>
			window.dispatchEvent(new CustomEvent('gps-entity-place-loaded'))
		);

		const clickListener = function (ev) {
			ev.stopPropagation();
			ev.preventDefault();

			const name = ev.target.getAttribute('name');

			const el = ev.detail.intersection && ev.detail.intersection.object.el;

			if (el && el === ev.target) {
				const label = document.createElement('span');
				const container = document.createElement('div');
				container.setAttribute('id', 'place-label');
				label.innerText = name;
				container.appendChild(label);
				document.body.appendChild(container);

				setTimeout(() => {
					container.parentElement.removeChild(container);
				}, 1500);
			}
		};

		icon.addEventListener('click', clickListener);

		scene.appendChild(icon);
	});
}
