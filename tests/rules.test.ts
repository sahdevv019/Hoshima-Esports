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

    it('captains CANNOT update other users or grant admin privileges', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('capt1').set({
          uid: 'capt1',
          displayName: 'Captain One',
          gamingUsername: 'CAPT1',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await adminDb.collection('users').doc('user1').set({
          uid: 'user1',
          displayName: 'User One',
          gamingUsername: 'USER1',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const capt = testEnv.authenticatedContext('capt1');
      const db = capt.firestore();
      await assertFails(
        db.collection('users').doc('user1').update({
          role: 'admin'
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

    it('non-admin (captains and members) CANNOT review or approve/reject applications', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('capt1').set({
          uid: 'capt1',
          displayName: 'Captain One',
          gamingUsername: 'CAPT1',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await adminDb.collection('applications').doc('applicant1').set({
          id: 'applicant1',
          uid: 'applicant1',
          displayName: 'Applicant One',
          gamingUsername: 'APPLICANT1',
          preferredGame: 'Free Fire Max',
          inGameId: 'FF-555',
          preferredRole: 'Fragger',
          bio: 'Competitive player looking to join Hoshima.',
          status: 'pending'
        });
      });

      const capt = testEnv.authenticatedContext('capt1');
      const db = capt.firestore();
      await assertFails(
        db.collection('applications').doc('applicant1').update({
          status: 'approved',
          reviewedBy: 'capt1'
        })
      );
      await assertFails(
        db.collection('applications').doc('applicant1').update({
          status: 'rejected',
          rejectionReason: 'Not suitable',
          reviewedBy: 'capt1'
        })
      );
    });

    it('rejected applicant CANNOT alter or resubmit application once declined', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('applications').doc('applicant2').set({
          id: 'applicant2',
          uid: 'applicant2',
          displayName: 'Applicant Two',
          gamingUsername: 'APPLICANT2',
          preferredGame: 'Free Fire Max',
          inGameId: 'FF-777',
          preferredRole: 'Sniper',
          bio: 'Long-range specialist.',
          status: 'rejected',
          rejectionReason: 'Roster full at this time',
          reviewedBy: 'admin1'
        });
      });

      const applicant2 = testEnv.authenticatedContext('applicant2');
      const db = applicant2.firestore();
      // Cannot edit bio or attempt to reset status
      await assertFails(
        db.collection('applications').doc('applicant2').update({
          bio: 'Please reconsider my application.',
          status: 'pending'
        })
      );
      await assertFails(
        db.collection('applications').doc('applicant2').update({
          bio: 'Please reconsider my application.'
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

    it('captain CANNOT reassign a player game to a different squad', async () => {
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
      });

      const ffCapt = testEnv.authenticatedContext('ff_capt');
      const db = ffCapt.firestore();

      // Attempt to change game from Free Fire Max to Valorant: FAIL
      await assertFails(
        db.collection('roster').doc('ff_p1').update({
          game: 'Valorant'
        })
      );
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

  describe('scrims collection', () => {
    it('public unauthenticated users can read scrims', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('scrims').doc('scrim1').set({
          title: 'Daily FF Scrim',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Battle Royale',
          scheduledTime: '2026-11-01T18:00:00Z',
          registrationDeadline: '2026-11-01T17:00:00Z',
          maxParticipants: 12,
          currentParticipants: 0,
          rules: 'No emulators',
          status: 'registration-open',
          createdBy: 'ff_capt',
          creatorName: 'FF Captain',
          creatorRole: 'captain'
        });
      });

      const unauth = testEnv.unauthenticatedContext();
      const db = unauth.firestore();
      await assertSucceeds(db.collection('scrims').doc('scrim1').get());
      await assertSucceeds(db.collection('scrims').get());
    });

    it('captain can create scrim for assigned squad, but NOT for another game', async () => {
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
      });

      const capt = testEnv.authenticatedContext('ff_capt');
      const db = capt.firestore();

      // Scrim for Free Fire Max: SUCCEED
      await assertSucceeds(
        db.collection('scrims').doc('scrim_ff').set({
          title: 'Squad Drill #1',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Battle Royale',
          scheduledTime: '2026-11-02T19:00:00Z',
          registrationDeadline: '2026-11-02T18:00:00Z',
          maxParticipants: 12,
          currentParticipants: 0,
          rules: 'Standard Rules',
          status: 'registration-open',
          createdBy: 'ff_capt',
          creatorName: 'FF Captain',
          creatorRole: 'captain'
        })
      );

      // Scrim for BGMI by FF Captain: FAIL
      await assertFails(
        db.collection('scrims').doc('scrim_bgmi').set({
          title: 'BGMI Practice',
          game: 'BGMI',
          squad: 'BGMI',
          map: 'Erangel',
          format: 'Battle Royale',
          scheduledTime: '2026-11-02T19:00:00Z',
          registrationDeadline: '2026-11-02T18:00:00Z',
          maxParticipants: 16,
          currentParticipants: 0,
          rules: 'Standard Rules',
          status: 'registration-open',
          createdBy: 'ff_capt',
          creatorName: 'FF Captain',
          creatorRole: 'captain'
        })
      );
    });

    it('member cannot create scrims', async () => {
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
      await assertFails(
        member.firestore().collection('scrims').doc('scrim_m').set({
          title: 'Rogue Scrim',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Battle Royale',
          scheduledTime: '2026-11-02T19:00:00Z',
          registrationDeadline: '2026-11-02T18:00:00Z',
          maxParticipants: 12,
          currentParticipants: 0,
          rules: 'Standard Rules',
          status: 'registration-open',
          createdBy: 'member1',
          creatorName: 'Member',
          creatorRole: 'captain'
        })
      );
    });

    it('approved member can update currentParticipants & updatedAt, but not other fields', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member One',
          gamingUsername: 'MEMBER1',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
        await db.collection('scrims').doc('scrim_slot').set({
          title: 'Slot Test Scrim',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Battle Royale',
          scheduledTime: '2026-11-02T19:00:00Z',
          registrationDeadline: '2026-11-02T18:00:00Z',
          maxParticipants: 12,
          currentParticipants: 0,
          rules: 'Standard Rules',
          status: 'registration-open',
          createdBy: 'ff_capt',
          creatorName: 'FF Captain',
          creatorRole: 'captain'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const db = member.firestore();

      // Updating participant count: SUCCEED
      await assertSucceeds(
        db.collection('scrims').doc('scrim_slot').update({
          currentParticipants: 1
        })
      );

      // Attempting to cancel or alter rules: FAIL
      await assertFails(
        db.collection('scrims').doc('scrim_slot').update({
          status: 'cancelled'
        })
      );

      // Attempting to arbitrarily jump slot counter by +5: FAIL
      await assertFails(
        db.collection('scrims').doc('scrim_slot').update({
          currentParticipants: 6
        })
      );
    });

    it('captain can delete own scrim, but not another captain scrim', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await db.collection('users').doc('bgmi_capt').set({
          uid: 'bgmi_capt',
          displayName: 'BGMI Captain',
          gamingUsername: 'BGMI_CAPT',
          preferredGame: 'BGMI',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'BGMI'
        });
        await db.collection('scrims').doc('ff_drill').set({
          title: 'FF Drill',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Squad',
          scheduledTime: '2026-11-02T19:00:00Z',
          registrationDeadline: '2026-11-02T18:00:00Z',
          maxParticipants: 12,
          currentParticipants: 0,
          rules: 'Rules',
          status: 'registration-open',
          createdBy: 'ff_capt',
          creatorName: 'FF Capt',
          creatorRole: 'captain'
        });
        await db.collection('scrims').doc('bgmi_drill').set({
          title: 'BGMI Drill',
          game: 'BGMI',
          squad: 'BGMI',
          map: 'Erangel',
          format: 'Squad',
          scheduledTime: '2026-11-02T19:00:00Z',
          registrationDeadline: '2026-11-02T18:00:00Z',
          maxParticipants: 16,
          currentParticipants: 0,
          rules: 'Rules',
          status: 'registration-open',
          createdBy: 'bgmi_capt',
          creatorName: 'BGMI Capt',
          creatorRole: 'captain'
        });
      });

      const ffCapt = testEnv.authenticatedContext('ff_capt');
      const db = ffCapt.firestore();
      // Delete own scrim: SUCCEED
      await assertSucceeds(db.collection('scrims').doc('ff_drill').delete());
      // Delete BGMI scrim: FAIL
      await assertFails(db.collection('scrims').doc('bgmi_drill').delete());
    });
  });

  describe('scrim_registrations collection', () => {
    it('approved member can register for scrim with deterministic ID and status registered', async () => {
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
        await adminDb.collection('scrims').doc('scrim1').set({
          title: 'Daily FF Scrim',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Battle Royale',
          scheduledTime: '2026-11-01T18:00:00Z',
          registrationDeadline: '2026-11-01T17:00:00Z',
          maxParticipants: 12,
          currentParticipants: 0,
          rules: 'No emulators',
          status: 'registration-open',
          createdBy: 'admin1',
          creatorName: 'Admin',
          creatorRole: 'admin'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const db = member.firestore();

      await assertSucceeds(
        db.collection('scrim_registrations').doc('scrim1_member1').set({
          id: 'scrim1_member1',
          scrimId: 'scrim1',
          game: 'Free Fire Max',
          userId: 'member1',
          userName: 'MEMBER1',
          teamName: 'Team Phoenix',
          contact: 'Discord#1234',
          status: 'registered'
        })
      );

      // Mismatched document ID: FAIL
      await assertFails(
        db.collection('scrim_registrations').doc('wrong_id').set({
          id: 'wrong_id',
          scrimId: 'scrim1',
          game: 'Free Fire Max',
          userId: 'member1',
          userName: 'MEMBER1',
          teamName: 'Team Phoenix',
          contact: 'Discord#1234',
          status: 'registered'
        })
      );

      // Registering for another user: FAIL
      await assertFails(
        db.collection('scrim_registrations').doc('scrim1_other').set({
          id: 'scrim1_other',
          scrimId: 'scrim1',
          game: 'Free Fire Max',
          userId: 'other',
          userName: 'Other',
          teamName: 'Team Phoenix',
          contact: 'Discord#1234',
          status: 'registered'
        })
      );
    });

    it('pending user cannot register for scrims', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const adminDb = context.firestore();
        await adminDb.collection('users').doc('pending1').set({
          uid: 'pending1',
          displayName: 'Pending One',
          gamingUsername: 'PENDING1',
          preferredGame: 'Free Fire Max',
          role: 'pending',
          status: 'pending'
        });
      });

      const pending = testEnv.authenticatedContext('pending1');
      await assertFails(
        pending.firestore().collection('scrim_registrations').doc('scrim1_pending1').set({
          id: 'scrim1_pending1',
          scrimId: 'scrim1',
          game: 'Free Fire Max',
          userId: 'pending1',
          userName: 'PENDING1',
          teamName: 'Team Pending',
          contact: 'Discord#9999',
          status: 'registered'
        })
      );
    });

    it('registrant can withdraw registration, but cannot self-confirm or change team details', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member One',
          gamingUsername: 'MEMBER1',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
        await db.collection('scrim_registrations').doc('scrim1_member1').set({
          id: 'scrim1_member1',
          scrimId: 'scrim1',
          game: 'Free Fire Max',
          userId: 'member1',
          userName: 'MEMBER1',
          teamName: 'Team Phoenix',
          contact: 'Discord#1234',
          status: 'registered'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const db = member.firestore();

      // Withdraw: SUCCEED
      await assertSucceeds(
        db.collection('scrim_registrations').doc('scrim1_member1').update({
          status: 'withdrawn'
        })
      );

      // Self-confirm: FAIL
      await assertFails(
        db.collection('scrim_registrations').doc('scrim1_member1').update({
          status: 'confirmed'
        })
      );
    });

    it('member CANNOT register if scrim does not exist or is closed', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member One',
          gamingUsername: 'MEMBER1',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
        await db.collection('scrims').doc('scrim_closed').set({
          title: 'Closed FF Scrim',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          map: 'Bermuda',
          format: 'Battle Royale',
          scheduledTime: '2026-11-01T18:00:00Z',
          registrationDeadline: '2026-11-01T17:00:00Z',
          maxParticipants: 12,
          currentParticipants: 12,
          rules: 'No emulators',
          status: 'registration-closed',
          createdBy: 'admin1',
          creatorName: 'Admin',
          creatorRole: 'admin'
        });
      });

      const member = testEnv.authenticatedContext('member1');
      const db = member.firestore();

      // Scrim does not exist: FAIL
      await assertFails(
        db.collection('scrim_registrations').doc('nonexistent_member1').set({
          id: 'nonexistent_member1',
          scrimId: 'nonexistent',
          game: 'Free Fire Max',
          userId: 'member1',
          userName: 'MEMBER1',
          teamName: 'Team Phoenix',
          contact: 'Discord#1234',
          status: 'registered'
        })
      );

      // Scrim is closed: FAIL
      await assertFails(
        db.collection('scrim_registrations').doc('scrim_closed_member1').set({
          id: 'scrim_closed_member1',
          scrimId: 'scrim_closed',
          game: 'Free Fire Max',
          userId: 'member1',
          userName: 'MEMBER1',
          teamName: 'Team Phoenix',
          contact: 'Discord#1234',
          status: 'registered'
        })
      );
    });
  });

  describe('tournaments collection', () => {
    it('public can view tournaments, but only admin can create/update', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await db.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member',
          gamingUsername: 'MEMBER',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const unauth = testEnv.unauthenticatedContext();
      await assertSucceeds(unauth.firestore().collection('tournaments').get());

      const member = testEnv.authenticatedContext('member1');
      await assertFails(
        member.firestore().collection('tournaments').doc('t1').set({
          name: 'Hoshima Major Season 1',
          game: 'Free Fire Max',
          description: 'Grand seasonal championship',
          startDate: '2026-12-01T10:00:00Z',
          endDate: '2026-12-05T20:00:00Z',
          registrationDeadline: '2026-11-28T23:59:59Z',
          maxTeams: 16,
          currentTeams: 0,
          format: 'single-elimination',
          rules: 'Official Rulebook 2026',
          prizePool: '$5,000 USD',
          status: 'upcoming',
          createdBy: 'member1'
        })
      );

      const admin = testEnv.authenticatedContext('admin1');
      await assertSucceeds(
        admin.firestore().collection('tournaments').doc('t1').set({
          name: 'Hoshima Major Season 1',
          game: 'Free Fire Max',
          description: 'Grand seasonal championship',
          startDate: '2026-12-01T10:00:00Z',
          endDate: '2026-12-05T20:00:00Z',
          registrationDeadline: '2026-11-28T23:59:59Z',
          maxTeams: 16,
          currentTeams: 0,
          format: 'single-elimination',
          rules: 'Official Rulebook 2026',
          prizePool: '$5,000 USD',
          status: 'upcoming',
          createdBy: 'admin1'
        })
      );
    });

    it('division captain can increment tournament currentTeams by 1, but cannot jump by 5', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await db.collection('tournaments').doc('t_slot').set({
          name: 'Tournament Slot Drill',
          game: 'Free Fire Max',
          description: 'Tournament overview',
          startDate: '2026-12-01T10:00:00Z',
          endDate: '2026-12-05T20:00:00Z',
          registrationDeadline: '2026-11-28T23:59:59Z',
          maxTeams: 16,
          currentTeams: 0,
          format: 'single-elimination',
          rules: 'Rules',
          prizePool: '$1000',
          status: 'registration-open',
          createdBy: 'admin1'
        });
      });

      const capt = testEnv.authenticatedContext('ff_capt');
      const db = capt.firestore();

      // Increment by 1: SUCCEED
      await assertSucceeds(
        db.collection('tournaments').doc('t_slot').update({
          currentTeams: 1
        })
      );

      // Jump by 5: FAIL
      await assertFails(
        db.collection('tournaments').doc('t_slot').update({
          currentTeams: 6
        })
      );
    });
  });

  describe('tournament_registrations collection', () => {
    it('division captain can register team, but cannot self-approve or seed', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await db.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await db.collection('tournaments').doc('tourney1').set({
          name: 'Hoshima Major Season 1',
          game: 'Free Fire Max',
          description: 'Grand seasonal championship',
          startDate: '2026-12-01T10:00:00Z',
          endDate: '2026-12-05T20:00:00Z',
          registrationDeadline: '2026-11-28T23:59:59Z',
          maxTeams: 16,
          currentTeams: 0,
          format: 'single-elimination',
          rules: 'Official Rulebook 2026',
          prizePool: '$5,000 USD',
          status: 'registration-open',
          createdBy: 'admin1'
        });
        await db.collection('tournaments').doc('tourney2').set({
          name: 'Hoshima Major Season 2',
          game: 'Free Fire Max',
          description: 'Grand seasonal championship 2',
          startDate: '2026-12-01T10:00:00Z',
          endDate: '2026-12-05T20:00:00Z',
          registrationDeadline: '2026-11-28T23:59:59Z',
          maxTeams: 16,
          currentTeams: 0,
          format: 'single-elimination',
          rules: 'Official Rulebook 2026',
          prizePool: '$5,000 USD',
          status: 'registration-open',
          createdBy: 'admin1'
        });
      });

      const capt = testEnv.authenticatedContext('ff_capt');
      const db = capt.firestore();

      // Valid registration: SUCCEED
      await assertSucceeds(
        db.collection('tournament_registrations').doc('tourney1_ff_capt').set({
          id: 'tourney1_ff_capt',
          tournamentId: 'tourney1',
          game: 'Free Fire Max',
          captainUid: 'ff_capt',
          captainName: 'FF Captain',
          teamName: 'Red Phoenix Elite',
          contact: 'Discord#5555',
          roster: [{ name: 'Player 1', role: 'IGL' }, { name: 'Player 2', role: 'Sniper' }],
          status: 'registered'
        })
      );

      // Attempting to self-approve: FAIL
      await assertFails(
        db.collection('tournament_registrations').doc('tourney2_ff_capt').set({
          id: 'tourney2_ff_capt',
          tournamentId: 'tourney2',
          game: 'Free Fire Max',
          captainUid: 'ff_capt',
          captainName: 'FF Captain',
          teamName: 'Red Phoenix Elite',
          contact: 'Discord#5555',
          roster: [{ name: 'Player 1', role: 'IGL' }],
          status: 'approved'
        })
      );
    });
  });

  describe('matches collection', () => {
    it('captain can create scrim match, but cannot create tournament match', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await db.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
      });

      const capt = testEnv.authenticatedContext('ff_capt');
      const db = capt.firestore();

      // Scrim match: SUCCEED
      await assertSucceeds(
        db.collection('matches').doc('match_scrim').set({
          competitionType: 'scrim',
          competitionId: 'scrim1',
          game: 'Free Fire Max',
          teamA: { id: 'team1', name: 'Alpha' },
          teamB: { id: 'team2', name: 'Beta' },
          status: 'scheduled',
          isConfirmed: false
        })
      );

      // Tournament match by captain: FAIL
      await assertFails(
        db.collection('matches').doc('match_tourney').set({
          competitionType: 'tournament',
          competitionId: 'tourney1',
          game: 'Free Fire Max',
          teamA: { id: 'team1', name: 'Alpha' },
          teamB: { id: 'team2', name: 'Beta' },
          status: 'scheduled',
          isConfirmed: false
        })
      );
    });

    it('captain CANNOT self-confirm match scores', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await db.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
        await db.collection('matches').doc('match_scrim').set({
          competitionType: 'scrim',
          competitionId: 'scrim1',
          game: 'Free Fire Max',
          teamA: { id: 'team1', name: 'Alpha' },
          teamB: { id: 'team2', name: 'Beta' },
          status: 'in-progress',
          proposedBy: 'ff_capt',
          isConfirmed: false
        });
      });

      const capt = testEnv.authenticatedContext('ff_capt');
      const db = capt.firestore();

      // Captain attempts to confirm match: FAIL
      await assertFails(
        db.collection('matches').doc('match_scrim').update({
          isConfirmed: true,
          confirmedBy: 'ff_capt'
        })
      );
    });

    it('captain CANNOT create confirmed match', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('ff_capt').set({
          uid: 'ff_capt',
          displayName: 'FF Captain',
          gamingUsername: 'FF_CAPT',
          preferredGame: 'Free Fire Max',
          role: 'captain',
          status: 'approved',
          assignedSquad: 'Free Fire Max'
        });
      });

      const capt = testEnv.authenticatedContext('ff_capt');
      const db = capt.firestore();

      await assertFails(
        db.collection('matches').doc('match_confirmed_hack').set({
          competitionType: 'scrim',
          competitionId: 'scrim1',
          game: 'Free Fire Max',
          teamA: { id: 'team1', name: 'Alpha' },
          teamB: { id: 'team2', name: 'Beta' },
          status: 'completed',
          isConfirmed: true,
          confirmedBy: 'ff_capt'
        })
      );
    });
  });

  describe('player_stats collection', () => {
    it('public can view player stats, but only admin can create/modify stats', async () => {
      await testEnv.withSecurityRulesDisabled(async (context) => {
        const db = context.firestore();
        await db.collection('users').doc('admin1').set({
          uid: 'admin1',
          displayName: 'Admin',
          gamingUsername: 'ADMIN',
          preferredGame: 'Free Fire Max',
          role: 'admin',
          status: 'approved'
        });
        await db.collection('users').doc('member1').set({
          uid: 'member1',
          displayName: 'Member',
          gamingUsername: 'MEMBER',
          preferredGame: 'Free Fire Max',
          role: 'member',
          status: 'approved'
        });
      });

      const unauth = testEnv.unauthenticatedContext();
      await assertSucceeds(unauth.firestore().collection('player_stats').get());

      const member = testEnv.authenticatedContext('member1');
      await assertFails(
        member.firestore().collection('player_stats').doc('member1').set({
          uid: 'member1',
          displayName: 'Member',
          gamingUsername: 'MEMBER',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          matchesPlayed: 10,
          wins: 8,
          losses: 2,
          winRate: 80,
          totalKills: 55,
          totalDeaths: 12,
          kdRatio: 4.58,
          tournamentsWon: 1,
          tournamentAppearances: 2
        })
      );

      const admin = testEnv.authenticatedContext('admin1');
      await assertSucceeds(
        admin.firestore().collection('player_stats').doc('member1').set({
          uid: 'member1',
          displayName: 'Member',
          gamingUsername: 'MEMBER',
          game: 'Free Fire Max',
          squad: 'Free Fire Max',
          matchesPlayed: 10,
          wins: 8,
          losses: 2,
          winRate: 80,
          totalKills: 55,
          totalDeaths: 12,
          kdRatio: 4.58,
          tournamentsWon: 1,
          tournamentAppearances: 2
        })
      );
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
