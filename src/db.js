// ================================================================
// Firestore Data Layer – Students, Reports, Users
// ================================================================

import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, serverTimestamp,
  Timestamp, writeBatch
} from 'firebase/firestore';
import { db } from './firebase.js';
import { getState } from './store.js';

// ---- Helpers ----
function now() { return serverTimestamp(); }
function uid() { return getState('currentUser')?.uid || 'unknown'; }

// ================================================================
// STUDENTS
// ================================================================

export async function getStudents({ includeInactive = false } = {}) {
  let q = collection(db, 'students');
  if (!includeInactive) {
    q = query(collection(db, 'students'), where('active', '==', true), orderBy('studentName'));
  } else {
    q = query(collection(db, 'students'), orderBy('studentName'));
  }
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getStudentById(id) {
  const snap = await getDoc(doc(db, 'students', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function createStudent(data) {
  const docRef = await addDoc(collection(db, 'students'), {
    ...data,
    centreId: 'sydenham',
    active: true,
    createdAt: now(),
    createdBy: uid(),
    updatedAt: now(),
    updatedBy: uid(),
  });
  return docRef.id;
}

export async function updateStudent(id, data) {
  await updateDoc(doc(db, 'students', id), {
    ...data,
    updatedAt: now(),
    updatedBy: uid(),
  });
}

export async function deactivateStudent(id) {
  await updateDoc(doc(db, 'students', id), {
    active: false,
    updatedAt: now(),
    updatedBy: uid(),
  });
}

// ================================================================
// REPORTS
// ================================================================

export async function getReports({ studentId, tutorId, status, subject, assessmentType, dateFrom, dateTo } = {}) {
  let constraints = [orderBy('createdAt', 'desc')];

  if (studentId) constraints.unshift(where('studentId', '==', studentId));
  if (tutorId)   constraints.unshift(where('createdBy', '==', tutorId));
  if (status)    constraints.unshift(where('status', '==', status));
  if (subject)   constraints.unshift(where('subject', '==', subject));
  if (assessmentType) constraints.unshift(where('assessmentType', '==', assessmentType));

  const q = query(collection(db, 'reports'), ...constraints);
  const snap = await getDocs(q);
  let results = snap.docs.map(d => ({ id: d.id, ...d.data() }));

  // Client-side date filtering
  if (dateFrom) {
    const from = new Date(dateFrom);
    results = results.filter(r => {
      const d = r.assessmentDate?.toDate ? r.assessmentDate.toDate() : new Date(r.assessmentDate);
      return d >= from;
    });
  }
  if (dateTo) {
    const to = new Date(dateTo);
    to.setHours(23, 59, 59, 999);
    results = results.filter(r => {
      const d = r.assessmentDate?.toDate ? r.assessmentDate.toDate() : new Date(r.assessmentDate);
      return d <= to;
    });
  }

  return results;
}

export async function getReportById(id) {
  const snap = await getDoc(doc(db, 'reports', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function getReportsByStudent(studentId) {
  const q = query(
    collection(db, 'reports'),
    where('studentId', '==', studentId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function createReport(data) {
  const docRef = await addDoc(collection(db, 'reports'), {
    ...data,
    centreId: 'sydenham',
    status: 'draft',
    createdAt: now(),
    createdBy: uid(),
    updatedAt: now(),
    updatedBy: uid(),
    managerComments: null,
    rejectionReason: null,
    submittedAt: null,
    submittedBy: null,
    approvedAt: null,
    approvedBy: null,
    sentAt: null,
    sentBy: null,
  });
  return docRef.id;
}

/**
 * Find an existing DRAFT report for the same student + subject + assessmentType
 * created by the current tutor. Returns the report object or null.
 * Used to prevent duplicate drafts (Gmail-style: one draft per context).
 */
export async function findExistingDraft(studentId, subject, assessmentType) {
  if (!studentId || !subject || !assessmentType) return null;
  const currentUid = uid();
  const q = query(
    collection(db, 'reports'),
    where('studentId',      '==', studentId),
    where('subject',        '==', subject),
    where('assessmentType', '==', assessmentType),
    where('status',         '==', 'draft'),
    where('createdBy',      '==', currentUid),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

export async function updateReport(id, data) {
  await updateDoc(doc(db, 'reports', id), {
    ...data,
    updatedAt: now(),
    updatedBy: uid(),
  });
}

export async function submitReport(id) {
  await updateDoc(doc(db, 'reports', id), {
    status: 'submitted',
    submittedAt: now(),
    submittedBy: uid(),
    updatedAt: now(),
    updatedBy: uid(),
  });
}

export async function approveReport(id, managerComments = '') {
  await updateDoc(doc(db, 'reports', id), {
    status: 'approved',
    managerComments: managerComments || null,
    approvedAt: now(),
    approvedBy: uid(),
    updatedAt: now(),
    updatedBy: uid(),
  });
}

export async function rejectReport(id, rejectionReason) {
  await updateDoc(doc(db, 'reports', id), {
    status: 'rejected',
    rejectionReason,
    updatedAt: now(),
    updatedBy: uid(),
  });
}

export async function markReportSent(id) {
  await updateDoc(doc(db, 'reports', id), {
    status: 'sent',
    sentAt: now(),
    sentBy: uid(),
    updatedAt: now(),
    updatedBy: uid(),
  });
}

export async function deleteReport(id) {
  await deleteDoc(doc(db, 'reports', id));
}

// ================================================================
// USERS (Tutors / Admins)
// ================================================================

export async function getUsers({ role } = {}) {
  let q = role
    ? query(collection(db, 'users'), where('role', '==', role), orderBy('name'))
    : query(collection(db, 'users'), orderBy('name'));
  const snap = await getDocs(q);
  return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function getUserById(id) {
  const snap = await getDoc(doc(db, 'users', id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateUser(id, data) {
  await updateDoc(doc(db, 'users', id), {
    ...data,
    updatedAt: now(),
    updatedBy: uid(),
  });
}

// ================================================================
// DASHBOARD STATS
// ================================================================

/**
 * Get dashboard stats.
 * - Admins/managers: pass no tutorId → see full centre stats.
 * - Tutors: pass their uid → see only their own reports & students.
 */
export async function getDashboardStats(tutorId = null) {
  // If tutorId is given, fetch only that tutor's reports
  const reportsQuery = tutorId
    ? query(collection(db, 'reports'), where('createdBy', '==', tutorId), orderBy('createdAt', 'desc'))
    : query(collection(db, 'reports'), orderBy('createdAt', 'desc'));

  const [studentsSnap, reportsSnap] = await Promise.all([
    getDocs(query(collection(db, 'students'), where('active', '==', true))),
    getDocs(reportsQuery),
  ]);

  // Only admins/managers can list all users — fail silently for tutors
  let tutorCount = null;
  try {
    const tutorsSnap = await getDocs(
      query(collection(db, 'users'), where('role', '==', 'tutor'), where('active', '==', true))
    );
    tutorCount = tutorsSnap.size;
  } catch (_) {
    // Tutor role — no permission to list all users, that's fine
  }

  const allReports = reportsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  const now = new Date();

  // For tutors: count only students they've actually written reports for
  const totalStudents = tutorId
    ? new Set(allReports.map(r => r.studentId).filter(Boolean)).size
    : studentsSnap.size;

  const thisMonth = allReports.filter(r => {
    const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const sentThisMonth = allReports.filter(r => {
    if (r.status !== 'sent' || !r.sentAt) return false;
    const d = r.sentAt?.toDate ? r.sentAt.toDate() : new Date(r.sentAt);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });

  const scores = allReports
    .filter(r => r.assessmentScore != null && !isNaN(r.assessmentScore))
    .map(r => Number(r.assessmentScore));

  const avgScore = scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : null;

  return {
    totalStudents,
    totalTutors:      tutorCount,
    draft:            allReports.filter(r => r.status === 'draft').length,
    submitted:        allReports.filter(r => r.status === 'submitted').length,
    approved:         allReports.filter(r => r.status === 'approved').length,
    sent:             allReports.filter(r => r.status === 'sent').length,
    createdThisMonth: thisMonth.length,
    sentThisMonth:    sentThisMonth.length,
    avgScore,
  };
}
