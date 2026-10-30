#!/usr/bin/env node
/**
 * HOSHIMA ESPORTS — INITIAL ADMIN BOOTSTRAP SCRIPT
 *
 * This script is intended strictly for offline manual operator execution.
 * It assigns 'admin' role and 'approved' status to an explicitly provided Firebase UID.
 *
 * Usage:
 *   node scripts/bootstrap-admin.mjs <TARGET_FIREBASE_UID>
 *
 * Or for local Firebase Emulator:
 *   FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 node scripts/bootstrap-admin.mjs <TARGET_FIREBASE_UID>
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc, updateDoc, serverTimestamp, connectFirestoreEmulator } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Automatically load .env.local if present
function loadEnvFile(filename) {
  const envPath = path.resolve(process.cwd(), filename);
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.slice(0, eqIdx).trim();
        const val = trimmed.slice(eqIdx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnvFile('.env.local');
loadEnvFile('.env');

const targetUid = process.argv[2]?.trim();

if (!targetUid) {
  console.error('\n[ERROR] Missing Target Firebase UID.');
  console.log('Usage: node scripts/bootstrap-admin.mjs <TARGET_FIREBASE_UID>');
  console.log('\nExample:');
  console.log('  node scripts/bootstrap-admin.mjs sK8d92NmxLa01kdP99214\n');
  process.exit(1);
}

// Basic UID format sanity check
if (targetUid.length < 10 || !/^[A-Za-z0-9_-]+$/.test(targetUid)) {
  console.error(`\n[ERROR] Invalid Firebase UID format: "${targetUid}".`);
  process.exit(1);
}

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || 'AIzaSyDUMMYKEYFORDEVELOPMENTANDTESTING000',
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || 'red-phoenix-bd7f7.firebaseapp.com',
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || 'red-phoenix-bd7f7',
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || 'red-phoenix-bd7f7.firebasestorage.app',
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '758310625150',
  appId: process.env.VITE_FIREBASE_APP_ID || '1:758310625150:web:39010fa2adcf17fac51d2f'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Check if connecting to emulator
const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST || process.env.VITE_FIRESTORE_EMULATOR_HOST;
if (emulatorHost) {
  const [host, port] = emulatorHost.split(':');
  connectFirestoreEmulator(db, host || '127.0.0.1', Number(port) || 8080);
  console.log(`[Bootstrap] Connected to Firestore Emulator at ${host}:${port || 8080}`);
}

async function bootstrapAdmin() {
  console.log(`\n======================================================`);
  console.log(`  HOSHIMA ESPORTS — FIRST ADMIN BOOTSTRAP PROCEDURE  `);
  console.log(`======================================================`);
  console.log(`Target Operative UID: ${targetUid}`);
  console.log(`Target Project ID:    ${firebaseConfig.projectId}`);

  const userRef = doc(db, 'users', targetUid);
  const userSnap = await getDoc(userRef);

  if (userSnap.exists()) {
    const existing = userSnap.data();
    console.log(`Found existing profile: ${existing.displayName || existing.gamingUsername || 'Operative'}`);
    console.log(`Current Role: ${existing.role || 'none'}, Status: ${existing.status || 'none'}`);

    await updateDoc(userRef, {
      role: 'admin',
      status: 'approved',
      updatedAt: serverTimestamp()
    });
  } else {
    console.log(`Profile document does not exist yet. Creating baseline Admin profile...`);
    await setDoc(userRef, {
      uid: targetUid,
      email: null,
      displayName: 'System Admin',
      gamingUsername: 'ADMIN_CHIEF',
      preferredGame: 'Valorant',
      role: 'admin',
      status: 'approved',
      color: '#ffd700',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }

  console.log(`\n[SUCCESS] Operative UID ${targetUid} promoted to Administrator!`);
  console.log(`Clearance assigned: role=admin, status=approved\n`);
  process.exit(0);
}

bootstrapAdmin().catch((err) => {
  console.error('\n[FATAL] Bootstrap failed:', err);
  process.exit(1);
});
