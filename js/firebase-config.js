/**
 * js/firebase-config.js
 * Client-Side Firebase SDK Initialization for ClubHub / ClubClash.
 * Project: club-hub-9c2de (https://console.firebase.google.com/project/club-hub-9c2de/)
 */

// Firebase Web Configuration
const firebaseConfig = {
  projectId: "club-hub-9c2de",
  authDomain: "club-hub-9c2de.firebaseapp.com",
  storageBucket: "club-hub-9c2de.appspot.com",
  // Optional: add your web apiKey & appId from Firebase Console -> Project Settings -> General -> Web Apps
};

// Global Firebase initialization helper
let firebaseApp = null;
let firebaseAuth = null;

function initFirebaseClient() {
  if (typeof firebase !== "undefined" && !firebaseApp) {
    try {
      firebaseApp = firebase.initializeApp(firebaseConfig);
      firebaseAuth = firebase.auth();
      console.log("[Firebase] Initialized client for project club-hub-9c2de");
    } catch (e) {
      console.warn("[Firebase] Initialization warning:", e);
    }
  }
}

/**
 * Sign in using Google Provider (Firebase Auth)
 * Authenticates campus students with Google (@tint.edu.in)
 */
async function signInWithFirebaseGoogle() {
  if (!firebaseAuth) {
    initFirebaseClient();
  }
  if (!firebaseAuth) {
    alert("Firebase Auth SDK is not loaded. Please verify script inclusion in the HTML header.");
    return null;
  }

  try {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });

    const result = await firebaseAuth.signInWithPopup(provider);
    const idToken = await result.user.getIdToken();
    const user = result.user;

    console.log("[Firebase Auth] Signed in successfully as:", user.email);

    // Persist session
    localStorage.setItem("clubhub_firebase_token", idToken);
    localStorage.setItem("clubhub_firebase_user", JSON.stringify({
      uid: user.uid,
      displayName: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    }));

    return { user, idToken };
  } catch (error) {
    console.error("[Firebase Auth Error]:", error);
    alert("Google Sign-In failed: " + error.message);
    return null;
  }
}

// Auto-initialize if Firebase script is present
document.addEventListener("DOMContentLoaded", initFirebaseClient);

