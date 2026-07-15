// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// 1. ➕ استيراد دالة الفايرستور للتعامل مع قاعدة البيانات
import { getFirestore } from "firebase/firestore"; 

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDn4rqv3y4Fk3tr08un7HXeG3grHgzjeOw",
  authDomain: "dashboard-app-f1c05.firebaseapp.com",
  projectId: "dashboard-app-f1c05",
  storageBucket: "dashboard-app-f1c05.firebasestorage.app",
  messagingSenderId: "825101882024",
  appId: "1:825101882024:web:aa4bdc944c888d399b689d",
  measurementId: "G-H04EFJ33K9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// 2. 🚀 تشغيل وتصدير قاعدة البيانات باسم db ليتعرف عليها الفورم فوراً
export const db = getFirestore(app);