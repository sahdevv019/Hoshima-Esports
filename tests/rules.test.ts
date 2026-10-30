import { describe, it, beforeAll, afterAll, beforeEach } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment
} from '@firebase/rules-unit-testing';
import * as fs from 'fs';
import * as path from 'path';

let testEnv: RulesTestEnvironment;
const PROJECT_ID = 'hoshima-esports-test';

describe('Firestore Security Rules', () => {
  beforeAll(async () => {
    const rulesPath = path.resolve(__dirname, '../firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');

    testEnv = await initializeTestEnvironment({
      projectId: PROJECT_ID,
      firestore: {
        rules
      }
    });
  });

  afterAll(async () => {
    if (testEnv) {
      await testEnv.cleanup();
    }
  });

  beforeEach(async () => {
    if (testEnv) {
      await testEnv.clearFirestore();
    }
  });

  describe('users collection', () => {
    it('unauthenticated users cannot read or write user profiles', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const db = unauth.firestore();
      await assertFails(db.collection('users').doc('user1').get());
      await assertFails(
        db.collection('users').doc('user1').set({
          uid: 'user1',
          displayName: 'Test',
          gamingUsername: 'TEST',
          preferredGame: 'Free Fire Max',
          role: 'pending',
          status: 'pending'
        })
      );
    });

    it('authenticated user can create their own pending profile', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const db = alice.firestore();
      await assertSucceeds(
        db.collection('users').doc('alice').set({
          uid: 'alice',
          email: 'alice@hoshima.gg',
          displayName: 'Alice Operative',
          gamingUsername: 'ALICE_PRO',
          preferredGame: 'Free Fire Max',
          bio: 'Ready to frag',
          color: '#00e5ff',
          role: 'pending',
          status: 'pending'
        })
      );
    });

    it('non-admin user CANNOT self-assign admin role on create', async () => {
      const bob = testEnv.authenticatedContext('bob');
      const db = bob.firestore();
      await assertFails(
        db.collection('users').doc('bob').set({
          uid: 'bob',
          email: 'bob@hoshima.gg',
          displayName: 'Bob Hacker',
          gamingUsername: 'BOB_ROOT',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        })
      );
    });

    it('user cannot create profile for another user', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const db = alice.firestore();
      await assertFails(
        db.collection('users').doc('bob').set({
          uid: 'bob',
          displayName: 'Bob',
          gamingUsername: 'BOB',
          preferredGame: 'Free Fire Max',
          role: 'pending',
          status: 'pending'
        })
      );
    });

    it('user can read their own profile, but cannot read others', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('alice').set({
          uid: 'alice',
          email: 'alice@hoshima.gg',
          displayName: 'Alice',
          gamingUsername: 'ALICE',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
        await adminDb.collection('users').doc('bob').set({
          uid: 'bob',
          email: 'bob@hoshima.gg',
          displayName: 'Bob',
          gamingUsername: 'BOB',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const alice = testEnv.authenticatedContext('alice');
      const db = alice.firestore();
      await assertSucceeds(db.collection('users').doc('alice').get());
      await assertFails(db.collection('users').doc('bob').get());
    });

    it('user can update their own safe profile fields, but not role, status, email, or uid', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('alice').set({
          uid: 'alice',
          email: 'alice@hoshima.gg',
          displayName: 'Alice',
          gamingUsername: 'ALICE',
          preferredGame: 'Free Fire Max',
          bio: 'Initial bio',
          color: '#00e5ff',
          role: 'member',
          status: 'approved'
        });
      });

      const alice = testEnv.authenticatedContext('alice');
      const db = alice.firestore();

      // Update safe fields
      await assertSucceeds(
        db.collection('users').doc('alice').update({
          displayName: 'Alice Renamed',
          gamingUsername: 'ALICE_RENAMED',
          bio: 'Updated bio'
        })
      );

      // Attempt to self-promote to admin
      await assertFails(
        db.collection('users').doc('alice').update({
          role: 'admin'
        })
      );

      // Attempt to change uid
      await assertFails(
        db.collection('users').doc('alice').update({
          uid: 'hacked-uid'
        })
      );

      // Attempt to change email
      await assertFails(
        db.collection('users').doc('alice').update({
          email: 'hacked@hoshima.gg'
        })
      );
    });

    it('admin can read any profile and promote member to captain', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('admin1').set({
          uid: 'admin1',
          email: 'admin@hoshima.gg',
          displayName: 'Admin Leader',
          gamingUsername: 'ADMIN1',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await adminDb.collection('users').doc('charlie').set({
          uid: 'charlie',
          email: 'charlie@hoshima.gg',
          displayName: 'Charlie Member',
          gamingUsername: 'CHARLIE',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const admin = testEnv.authenticatedContext('admin1');
      const db = admin.firestore();
      await assertSucceeds(db.collection('users').doc('charlie').get());
      await assertSucceeds(
        db.collection('users').doc('charlie').update({
          role: 'captain',
          assignedSquad: 'Free Fire Max'
        })
      );
    });

    it('INVARIANT: Demoting an existing admin via client write is strictly forbidden', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('admin1').set({
          uid: 'admin1',
          email: 'admin1@hoshima.gg',
          displayName: 'Admin One',
          gamingUsername: 'ADMIN1',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await adminDb.collection('users').doc('admin2').set({
          uid: 'admin2',
          email: 'admin2@hoshima.gg',
          displayName: 'Admin Two',
          gamingUsername: 'ADMIN2',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
      });

      const admin1 = testEnv.authenticatedContext('admin1');
      const db = admin1.firestore();
      // Admin 1 attempts to demote Admin 2 to member
      await assertFails(
        db.collection('users').doc('admin2').update({
          role: 'member'
        })
      );

      // Admin 1 attempts to set Admin 2 status to suspended or rejected
      await assertFails(
        db.collection('users').doc('admin2').update({
          status: 'suspended'
        })
      );
    });

    it('user deletion is forbidden for all', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('admin1').set({
          uid: 'admin1',
          email: 'admin@hoshima.gg',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await adminDb.collection('users').doc('alice').set({
          uid: 'alice',
          email: 'alice@hoshima.gg',
          displayName: 'Alice',
          gamingUsername: 'ALICE',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const alice = testEnv.authenticatedContext('alice');
      const admin = testEnv.authenticatedContext('admin1');
      await assertFails(alice.firestore().collection('users').doc('alice').delete());
      await assertFails(admin.firestore().collection('users').doc('alice').delete());
    });
  });

  describe('applications collection', () => {
    it('applicant can create pending application, but cannot set status to approved', async () => {
      const alice = testEnv.authenticatedContext('alice');
      const aliceDb = alice.firestore();

      // Valid application
      await assertSucceeds(
        aliceDb.collection('applications').doc('alice').set({
          id: 'alice',
          uid: 'alice',
          email: 'alice@hoshima.gg',
          displayName: 'Alice Operative',
          gamingUsername: 'ALICE_PRO',
          preferredGame: 'Free Fire Max',
          inGameId: 'FF-99238',
          preferredRole: 'Assault',
          bio: 'Passionate competitive esports player since 2021.',
          status: 'pending'
        })
      );

      // Invalid: status approved
      const bob = testEnv.authenticatedContext('bob');
      const bobDb = bob.firestore();
      await assertFails(
        bobDb.collection('applications').doc('bob').set({
          id: 'bob',
          uid: 'bob',
          email: 'bob@hoshima.gg',
          displayName: 'Bob Operative',
          gamingUsername: 'BOB_PRO',
          preferredGame: 'Free Fire Max',
          inGameId: 'FF-11234',
          preferredRole: 'Sniper',
          bio: 'Passionate competitive esports player since 2021.',
          status: 'approved'
        })
      );
    });

    it('applicant can update pending application, but cannot self-approve or alter review fields', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('applications').doc('alice').set({
          id: 'alice',
          uid: 'alice',
          email: 'alice@hoshima.gg',
          displayName: 'Alice',
          gamingUsername: 'ALICE',
          preferredGame: 'Free Fire Max',
          inGameId: 'FF-123',
          preferredRole: 'Assault',
          bio: 'Passionate competitive player with 3 years tournament experience.',
          status: 'pending'
        });
      });

      const alice = testEnv.authenticatedContext('alice');
      const db = alice.firestore();
      // Valid update
      await assertSucceeds(
        db.collection('applications').doc('alice').update({
          bio: 'Updated application bio with extensive tournament scrim logs.'
        })
      );

      // Self-approve fails
      await assertFails(
        db.collection('applications').doc('alice').update({
          status: 'approved'
        })
      );

      // Altering review fields fails
      await assertFails(
        db.collection('applications').doc('alice').update({
          reviewedBy: 'alice'
        })
      );
    });

    it('admin can list applications and approve/reject them', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('admin1').set({
          uid: 'admin1',
          email: 'admin@hoshima.gg',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await adminDb.collection('applications').doc('alice').set({
          id: 'alice',
          uid: 'alice',
          displayName: 'Alice',
          gamingUsername: 'ALICE',
          preferredGame: 'Free Fire Max',
          inGameId: 'FF-123',
          preferredRole: 'Assault',
          bio: 'Passionate competitive player with 3 years tournament experience.',
          status: 'pending'
        });
      });

      const admin = testEnv.authenticatedContext('admin1');
      const db = admin.firestore();
      await assertSucceeds(db.collection('applications').get());
      await assertSucceeds(
        db.collection('applications').doc('alice').update({
          status: 'approved',
          reviewedBy: 'admin1'
        })
      );
    });
  });

  describe('roster collection', () => {
    it('public unauthenticated visitors can read roster', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('roster').doc('player1').set({
          name: 'Shadow',
          tag: 'SHADOW',
          role: 'Sniper',
          game: 'Free Fire Max',
          color: '#ff4655'
        });
      });

      const unauth = testEnv.unauthenticatedContext();
      const db = unauth.firestore();
      await assertSucceeds(db.collection('roster').doc('player1').get());
      await assertSucceeds(db.collection('roster').get());
    });

    it('regular members cannot create roster players', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member',
          gamingUsername: 'MEMBER',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const db = member.firestore();
      await assertFails(
        db.collection('roster').doc('new_player').set({
          name: 'Rookie',
          tag: 'ROOKIE',
          role: 'Assault',
          game: 'Free Fire Max',
          color: '#4ade80'
        })
      );
    });

    it('captains can manage roster players ONLY within their assigned squad', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await adminDb.collection('roster').doc('ff_p1').set({
          name: 'Viper',
          tag: 'VIPER',
          role: 'IGL',
          game: 'Free Fire Max',
          color: '#00e5ff'
        });
        await adminDb.collection('roster').doc('bgmi_p1').set({
          name: 'Ghost',
          tag: 'GHOST',
          role: 'Assault',
          game: 'BGMI',
          color: '#ffd600'
        });
      });

      const ffCapt = testEnv.authenticatedContext('ff_capt');
      const db = ffCapt.firestore();

      // Add player to own squad: SUCCEED
      await assertSucceeds(
        db.collection('roster').doc('ff_p2').set({
          name: 'Striker',
          tag: 'STRIKER',
          role: 'Fragger',
          game: 'Free Fire Max',
          color: '#00e5ff'
        })
      );

      // Add player to another squad (BGMI): FAIL
      await assertFails(
        db.collection('roster').doc('bgmi_p2').set({
          name: 'Delta',
          tag: 'DELTA',
          role: 'Fragger',
          game: 'BGMI',
          color: '#ffd600'
        })
      );

      // Delete player in own squad: SUCCEED
      await assertSucceeds(db.collection('roster').doc('ff_p1').delete());

      // Delete player in BGMI: FAIL
      await assertFails(db.collection('roster').doc('bgmi_p1').delete());
    });
  });

  describe('arcade collection', () => {
    it('public can read arcade games', async () => {
      const unauth = testEnv.unauthenticatedContext();
      const db = unauth.firestore();
      await assertSucceeds(db.collection('arcade').get());
    });

    it('approved members can submit arcade games, but pending cannot', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('pending_user').set({
          uid: 'pending_user',
          displayName: 'Pending User',
          gamingUsername: 'PENDING',
          preferredGame: 'Free Fire Max',
          role: 'pending',
          status: 'pending'
        });
        await adminDb.collection('users').doc('approved_user').set({
          uid: 'approved_user',
          displayName: 'Approved Member',
          gamingUsername: 'APPROVED',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const pending = testEnv.authenticatedContext('pending_user');
      const pendingDb = pending.firestore();
      await assertFails(
        pendingDb.collection('arcade').add({
          title: 'Cyber Runner',
          desc: 'High speed arcade reaction trainer',
          url: 'https://hoshima.gg/games/cyber-runner',
          author: 'Pending',
          genre: 'Action'
        })
      );

      const approved = testEnv.authenticatedContext('approved_user');
      const approvedDb = approved.firestore();
      await assertSucceeds(
        approvedDb.collection('arcade').add({
          title: 'Cyber Runner',
          desc: 'High speed arcade reaction trainer',
          url: 'https://hoshima.gg/games/cyber-runner',
          author: 'Approved Member',
          genre: 'Action'
        })
      );
    });

    it('only admin can update or delete arcade games', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await adminDb.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member',
          gamingUsername: 'MEMBER',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
        await adminDb.collection('arcade').doc('game1').set({
          title: 'Aim God',
          desc: 'Aim trainer',
          url: 'https://hoshima.gg/games/aim',
          author: 'Staff',
          genre: 'FPS'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const memberDb = member.firestore();
      await assertFails(memberDb.collection('arcade').doc('game1').delete());

      const admin = testEnv.authenticatedContext('admin1');
      const adminDb = admin.firestore();
      await assertSucceeds(adminDb.collection('arcade').doc('game1').delete());
    });
  });

  describe('chats collections', () => {
    it('approved members can read and post chat messages in game channels', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member One',
          gamingUsername: 'MEMBER1',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const db = member.firestore();

      // Read channel messages: SUCCEED
      await assertSucceeds(db.collection('chats_ff_tactics').get());

      // Send valid message: SUCCEED
      await assertSucceeds(
        db.collection('chats_ff_tactics').add({
          name: 'Member One',
          avatar: 'MO',
          color: '#00e5ff',
          text: 'Scrim starting in 15 minutes, assemble on Discord!',
          uid: 'member1'
        })
      );

      // Spoofing UID: FAIL
      await assertFails(
        db.collection('chats_ff_tactics').add({
          name: 'Imposter',
          avatar: 'IM',
          color: '#ff4655',
          text: 'Fake message from someone else',
          uid: 'other_user'
        })
      );
    });

    it('pending or unauthenticated users CANNOT read or post in chat channels', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('pending1').set({
          uid: 'pending1',
          displayName: 'Pending Operative',
          gamingUsername: 'PENDING1',
          preferredGame: 'Free Fire Max',
          role: 'pending',
          status: 'pending'
        });
      });

      const unauth = testEnv.unauthenticatedContext();
      const unauthDb = unauth.firestore();
      await assertFails(unauthDb.collection('chats_ff_general').get());

      const pending = testEnv.authenticatedContext('pending1');
      const pendingDb = pending.firestore();
      await assertFails(pendingDb.collection('chats_ff_general').get());
      await assertFails(
        pendingDb.collection('chats_ff_general').add({
          name: 'Pending',
          avatar: 'P',
          color: '#fff',
          text: 'Hello?',
          uid: 'pending1'
        })
      );
    });

    it('chat messages cannot be updated or deleted by anyone', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await adminDb.collection('chats_ff_general').doc('msg1').set({
          name: 'Admin',
          avatar: 'A',
          color: '#ffd600',
          text: 'Welcome',
          uid: 'admin1'
        });
      });

      const admin = testEnv.authenticatedContext('admin1');
      const db = admin.firestore();
      await assertFails(
        db.collection('chats_ff_general').doc('msg1').update({
          text: 'Edited message'
        })
      );
      await assertFails(db.collection('chats_ff_general').doc('msg1').delete());
    });
  });

  describe('default deny all', () => {
    it('unspecified collections are completely denied', async () => {
      const admin = testEnv.authenticatedContext('admin');
      const db = admin.firestore();
      await assertFails(db.collection('system_config').get());
      await assertFails(
        db.collection('system_config').doc('secrets').set({ key: '123' })
      );
    });
  });
});
