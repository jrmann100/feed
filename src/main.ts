import App from './App.svelte';

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./serviceWorker.js').then(registration => console.log("Service Worker registered."));
};

const app = new App({
	target: document.body,
});

export default app;