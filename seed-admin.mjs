#!/usr/bin/env node
// seed-admin.mjs  –  Creates the Firestore profile for an existing Firebase Auth user
// Usage: node seed-admin.mjs

import https from 'https';
import readline from 'readline';

const PROJECT_ID    = 'assessment-dashboard-5610a';
const DATABASE_NAME = 'sydenham-asc';
const API_KEY       = 'AIzaSyBushgJwhQp6loPXN97wDtVGujf7jvkonc';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

function post(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const opts = {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
    };
    const req = https.request(url, opts, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function firestoreWrite(url, body, idToken, method = 'PATCH') {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const urlObj = new URL(url);
    const req = https.request({
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        'Authorization': `Bearer ${idToken}`,
      },
    }, res => {
      let raw = '';
      res.on('data', d => raw += d);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(raw); } });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🔑  Sydenham ASC – Admin Profile Setup\n');
  console.log('Your Firebase Auth account was already created.');
  console.log('This script will write the Firestore admin profile.\n');

  const name     = await ask('Your full name (e.g. Site Manager):   ');
  const email    = await ask('Your login email (the one you used):  ');
  const password = await ask('Your password:                         ');
  rl.close();

  // Sign in to get an idToken for the already-created account
  console.log('\n⏳  Signing in to get your credentials…');
  const signinUrl = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${API_KEY}`;
  const signinRes = await post(signinUrl, { email, password, returnSecureToken: true });

  if (signinRes.error) {
    console.error('❌  Sign-in failed:', signinRes.error.message);
    process.exit(1);
  }

  const uid     = signinRes.localId;
  const idToken = signinRes.idToken;
  console.log(`✅  Signed in — UID: ${uid}`);

  // Write admin profile to Firestore
  console.log('⏳  Writing admin profile to Firestore…');
  const now    = new Date().toISOString();
  const docUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/${DATABASE_NAME}/documents/users/${uid}`;

  const body = {
    fields: {
      uid:       { stringValue: uid },
      name:      { stringValue: name },
      email:     { stringValue: email },
      role:      { stringValue: 'admin' },
      active:    { booleanValue: true },
      centre:    { stringValue: 'sydenham' },
      createdAt: { stringValue: now },
      updatedAt: { stringValue: now },
    }
  };

  const res = await firestoreWrite(docUrl, body, idToken);

  if (res.error) {
    console.error('❌  Firestore error:', JSON.stringify(res.error, null, 2));
    process.exit(1);
  }

  console.log('✅  Admin profile created in Firestore!');
  console.log('\n🎉  All done! Log in at http://localhost:3000');
  console.log(`    Email:    ${email}`);
  console.log('    Password: (as entered above)\n');
}

main().catch(e => { console.error(e); process.exit(1); });
