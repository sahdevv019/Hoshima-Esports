export type UserRole = 'admin' | 'captain' | 'member' | 'pending';
export type UserStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string;
  gamingUsername: string;
  preferredGame: string;
  inGameId?: string;
  preferredRole?: string;
  bio?: string;
  color?: string;
  role: UserRole;
  status: UserStatus;
  assignedSquad?: string; // For captains & squad-scoped members
  createdAt?: any;
  updatedAt?: any;
  approvedBy?: string;
  approvedAt?: any;
}

export interface RegistrationApplication {
  id: string; // Document ID matching user UID
  uid: string;
  email: string | null;
  displayName: string;
  gamingUsername: string;
  preferredGame: string;
  inGameId: string;
  preferredRole: string;
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: any;
  reviewedBy?: string;
  reviewedAt?: any;
  rejectionReason?: string;
}

export interface PublicProfile {
  uid: string;
  displayName: string;
  gamingUsername: string;
  preferredGame: string;
  role: UserRole;
  color?: string;
}
