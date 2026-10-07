import { 
  db, 
  auth, 
  handleFirestoreError, 
  OperationType 
} from '../firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  onSnapshot 
} from 'firebase/firestore';
import { DiagnosticSession, RepairEstimate } from '../types';

export const firestoreSync = {
  // Save Diagnostic Session to Firestore
  async saveDiagnostic(session: DiagnosticSession): Promise<void> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      // User is not signed in to Firebase Auth; data is persisted in backend DB
      return;
    }

    const path = `users/${currentUid}/diagnostics/${session.id}`;
    try {
      const docRef = doc(db, 'users', currentUid, 'diagnostics', session.id);
      const payload = { ...session, userId: currentUid };
      await setDoc(docRef, payload, { merge: true });
      console.log(`Diagnostic session ${session.id} synced to Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Fetch user's diagnostics from Firestore
  async getDiagnostics(userId: string): Promise<DiagnosticSession[]> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return [];

    const path = `users/${currentUid}/diagnostics`;
    try {
      const colRef = collection(db, 'users', currentUid, 'diagnostics');
      const q = query(colRef);
      const snapshot = await getDocs(q);
      const list: DiagnosticSession[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as DiagnosticSession);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  // Real-time listener for diagnostics
  subscribeDiagnostics(userId: string, onUpdate: (data: DiagnosticSession[]) => void): () => void {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return () => {};

    const path = `users/${currentUid}/diagnostics`;
    const colRef = collection(db, 'users', currentUid, 'diagnostics');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: DiagnosticSession[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as DiagnosticSession);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  // Save Repair Estimate to Firestore
  async saveEstimate(estimate: RepairEstimate): Promise<void> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) {
      // User is not signed in to Firebase Auth; data is persisted in backend DB
      return;
    }

    const path = `users/${currentUid}/estimates/${estimate.id}`;
    try {
      const docRef = doc(db, 'users', currentUid, 'estimates', estimate.id);
      const payload = { ...estimate, userId: currentUid };
      await setDoc(docRef, payload, { merge: true });
      console.log(`Estimate ${estimate.id} synced to Firestore.`);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // Fetch user's estimates from Firestore
  async getEstimates(userId: string): Promise<RepairEstimate[]> {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return [];

    const path = `users/${currentUid}/estimates`;
    try {
      const colRef = collection(db, 'users', currentUid, 'estimates');
      const q = query(colRef);
      const snapshot = await getDocs(q);
      const list: RepairEstimate[] = [];
      snapshot.forEach((d) => {
        list.push(d.data() as RepairEstimate);
      });
      return list;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return [];
    }
  },

  // Real-time listener for repair estimates
  subscribeEstimates(userId: string, onUpdate: (data: RepairEstimate[]) => void): () => void {
    const currentUid = auth.currentUser?.uid;
    if (!currentUid) return () => {};

    const path = `users/${currentUid}/estimates`;
    const colRef = collection(db, 'users', currentUid, 'estimates');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const list: RepairEstimate[] = [];
        snapshot.forEach((d) => {
          list.push(d.data() as RepairEstimate);
        });
        if (list.length > 0) {
          onUpdate(list);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  }
};
