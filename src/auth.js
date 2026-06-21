// ================================================================
// Auth module – Firebase Authentication wrapper
// ================================================================

import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
} from 'firebase/auth';
import {
  doc, getDoc, setDoc, collection,
  query, where, getDocs, serverTimestamp
} from 'firebase/firestore';
import { auth, db } from './firebase.js';
import { setState } from './store.js';
import { generateId } from './utils.js';
import { promptDialog } from './components/dialog.js';

// Listen to auth state changes and load user profile from Firestore
export function initAuth(onReady) {
  onAuthStateChanged(auth, async (firebaseUser) => {
    if (firebaseUser) {
      try {
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        if (userDoc.exists()) {
          const profile = userDoc.data();
          setState('currentUser', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: profile.name || firebaseUser.displayName || firebaseUser.email,
            role: profile.role,
            centreId: profile.centreId || 'sydenham',
            active: profile.active !== false,
          });
        } else {
          // First-time admin (seed)
          setState('currentUser', {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email,
            role: 'admin',
            centreId: 'sydenham',
            active: true,
          });
        }
      } catch (e) {
        console.error('Error loading user profile:', e);
        setState('currentUser', null);
      }
    } else {
      setState('currentUser', null);
    }
    onReady?.();
  });
}

export async function login(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

export async function logout() {
  await signOut(auth);
  setState('currentUser', null);
}

// Create a new user record in Firestore (called by admin when adding tutors/admins)
export async function createUserRecord(uid, { name, email, role, centreId = 'sydenham' }) {
  await setDoc(doc(db, 'users', uid), {
    name,
    email,
    role,
    centreId,
    active: true,
    createdAt: serverTimestamp(),
  });
}

// Get all users from Firestore (admin only)
export async function getAllUsers(role = null) {
  let q = collection(db, 'users');
  if (role) {
    q = query(collection(db, 'users'), where('role', '==', role));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserById(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

// ── Magic Link (passwordless) ──────────────────────────────────

/**
 * Send a Firebase magic sign-in link to the given email address.
 * Firebase sends the email using the template configured in Firebase Console
 * (Authentication → Templates → Sign-in link).
 */
export async function sendMagicLink(email) {
  const actionCodeSettings = {
    url: window.location.origin + '/?magiclink=1',
    handleCodeInApp: true,
  };
  await sendSignInLinkToEmail(auth, email, actionCodeSettings);
  window.localStorage.setItem('emailForSignIn', email);
}

/**
 * Complete the magic-link sign-in after the user clicks the emailed link.
 * Call this on page load when the URL contains a sign-in link.
 * Returns the signed-in UserCredential.
 */
export async function completeMagicLinkSignIn(url) {
  if (!isSignInWithEmailLink(auth, url)) {
    throw new Error('The provided URL is not a valid sign-in link.');
  }

  let email = window.localStorage.getItem('emailForSignIn');
  if (!email) {
    // Fallback: ask the user (handles the case where the link was opened on a
    // different device / browser than where the request was made).
    email = await promptDialog(
      'Security Check',
      'Please enter the email address you used to request the sign-in link:'
    );
    if (!email) throw new Error('Email is required to complete sign-in.');
  }

  const cred = await signInWithEmailLink(auth, email, url);
  window.localStorage.removeItem('emailForSignIn');
  return cred;
}
