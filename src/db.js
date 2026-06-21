// ================================================================
// Firestore Data Layer – Students, Reports, Users
// ================================================================

import {
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc,
  deleteDoc, query, where, orderBy, limit, serverTimestamp,
  Timestamp, writeBatch, getCountFromServer, getAggregateFromServer, average
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
 *
 * NOTE: Requires the composite index in firestore.indexes.json to be deployed.
 * Without it Firestore throws a "requires an index" error which is caught and
 * logged so callers can still function (they will then create a new draft).
 */
export async function findExistingDraft(studentId, subject, assessmentType) {
  if (!studentId || !subject || !assessmentType) return null;
  const currentUid = uid();
  try {
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
  } catch (err) {
    console.error('[findExistingDraft] Firestore query failed (index may be missing):', err);
    return null;
  }
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

export async function findUserByEmail(email) {
  const snap = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
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
  // Base queries
  const studentsQuery = query(collection(db, 'students'), where('active', '==', true));
  const reportsBase = tutorId
    ? query(collection(db, 'reports'), where('createdBy', '==', tutorId))
    : collection(db, 'reports');

  // Instead of getDocs() which reads every document, we use server-side aggregation
  const [
    studentsCount,
    draftCount,
    submittedCount,
    approvedCount,
    sentCount,
    scoreAggregate
  ] = await Promise.all([
    getCountFromServer(studentsQuery),
    getCountFromServer(query(reportsBase, where('status', '==', 'draft'))),
    getCountFromServer(query(reportsBase, where('status', '==', 'submitted'))),
    getCountFromServer(query(reportsBase, where('status', '==', 'approved'))),
    getCountFromServer(query(reportsBase, where('status', '==', 'sent'))),
    // getAggregateFromServer can average the score field natively
    getAggregateFromServer(reportsBase, { avgScore: average('assessmentScore') })
  ]);

  let tutorCount = null;
  try {
    const tutorsCountSnap = await getCountFromServer(
      query(collection(db, 'users'), where('role', '==', 'tutor'), where('active', '==', true))
    );
    tutorCount = tutorsCountSnap.data().count;
  } catch (_) {
    // Tutor role — no permission to list all users, that's fine
  }

  // Calculate "This Month" dynamically.
  // Note: For 'createdThisMonth' and 'sentThisMonth', we can use a range query using the 1st of the current month.
  const currentDate = new Date();
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  
  const [createdThisMonthCount, sentThisMonthCount] = await Promise.all([
    getCountFromServer(query(reportsBase, where('createdAt', '>=', startOfMonth))),
    getCountFromServer(query(reportsBase, where('status', '==', 'sent'), where('sentAt', '>=', startOfMonth)))
  ]);

  return {
    totalStudents:      studentsCount.data().count,
    totalTutors:        tutorCount,
    draft:              draftCount.data().count,
    submitted:          submittedCount.data().count,
    approved:           approvedCount.data().count,
    sent:               sentCount.data().count,
    createdThisMonth:   createdThisMonthCount.data().count,
    sentThisMonth:      sentThisMonthCount.data().count,
    avgScore:           Math.round(scoreAggregate.data().avgScore || 0) || null,
  };
}
