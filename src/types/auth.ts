export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  badgeNumber: string;
  clearanceLevel: string;
  avatar?: string;
  isCustomAccount?: boolean;
  // Added for real backend auth (Phase 13): internal RBAC group, separate
  // from the free-text `role` label above which the UI keeps rendering
  // unchanged. Optional so PRESET_USERS below (now just quick-switch
  // display data, not used for auth) don't need updating.
  roleGroup?: 'DRILLING_ENGINEER' | 'GEOLOGIST' | 'SUPERVISOR' | 'ADMIN';
}

export const PRESET_USERS: UserProfile[] = [
  {
    id: 'user-chauhan',
    name: 'Er. R. Chauhan',
    email: 'rudrachauhan12805@gmail.com',
    role: 'Lead Drilling Engineer',
    department: 'Duliajan Rig Operational Command',
    badgeNumber: 'OIL-ER-8942',
    clearanceLevel: 'Level 3 - Rig Master Clearance',
  },
  {
    id: 'user-director',
    name: 'Shri A. K. Sharma',
    email: 'ak_sharma@oilindia.in',
    role: 'Director of Drilling Operations',
    department: 'Directorate General of Hydrocarbons (DGH) / MoPNG',
    badgeNumber: 'OIL-EXEC-004',
    clearanceLevel: 'Level 4 - Executive Command & Audit',
  },
  {
    id: 'user-baruah',
    name: 'Dr. S. Baruah',
    email: 's_baruah@oilindia.in',
    role: 'Chief Geologist & Petrophysicist',
    department: 'Assam-Arakan Basin Geoscience Wing',
    badgeNumber: 'OIL-GEO-1102',
    clearanceLevel: 'Level 3 - Subsurface Horizons Access',
  },
  {
    id: 'user-gogoi',
    name: 'P. K. Gogoi',
    email: 'pk_gogoi@oilindia.in',
    role: 'Senior Drilling Fluids Specialist',
    department: 'Mud Engineering & Rheology Division',
    badgeNumber: 'OIL-MUD-408',
    clearanceLevel: 'Level 2 - Chemical & ECD Controls',
  },
];
