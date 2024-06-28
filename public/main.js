if ('serviceWorker' in navigator) {
    // Vérifiez si l'application est servie via HTTPS ou sur localhost
    if (window.location.protocol === 'https:' || window.location.hostname === 'localhost') {
        navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
        })
        .catch((error) => {
            console.log('Service Worker registration failed:', error);
        });
    } else {
        console.warn('Service Workers can only be registered over HTTPS or on localhost');
    }
}
