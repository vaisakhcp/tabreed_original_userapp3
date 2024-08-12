// import firebase from 'firebase/app';
// import 'firebase/firestore';

// const firebaseConfig = {
//     apiKey: "AIzaSyCP6O3yvZcTVu94skESdWQYe6uXIR2A_jY",
//     authDomain: "plantproject-1d44a.firebaseapp.com",
//     projectId: "plantproject-1d44a",
//     storageBucket: "plantproject-1d44a.appspot.com",
//     messagingSenderId: "462982100285",
//     appId: "1:462982100285:web:2d1460b2127227cfa5c154",
//     measurementId: "G-MLDVJFEWN4"
// };

// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();

// export { db };

// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyCP6O3yvZcTVu94skESdWQYe6uXIR2A_jY",
    authDomain: "plantproject-1d44a.firebaseapp.com",
    projectId: "plantproject-1d44a",
    storageBucket: "plantproject-1d44a.appspot.com",
    messagingSenderId: "462982100285",
    appId: "1:462982100285:web:2d1460b2127227cfa5c154",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
