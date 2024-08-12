// src/custom-service-worker.js
import { precacheAndRoute } from 'workbox-precaching';

self.addEventListener('install', (event) => {
  console.log('Service Worker installing.');
  // Add custom install logic here
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activating.');
  // Add custom activate logic here
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});

// This is needed to inject the manifest
precacheAndRoute(self.__WB_MANIFEST);
