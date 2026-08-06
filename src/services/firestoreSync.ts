import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../lib/firebase';
import {
  Wallet,
  Transaction,
  Category,
  Budget,
  FinancialGoal,
  BillAndDebt,
  Invoice,
  Investment,
  AuditLog
} from '../types';

export interface UserFinancialBundle {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  debts: BillAndDebt[];
  invoices: Invoice[];
  investments: Investment[];
  auditLogs: AuditLog[];
  updatedAt?: string;
}

export const FirestoreSyncService = {
  /**
   * Subscribe to real-time updates for a given user from Cloud Firestore
   */
  subscribeToUserData(
    userId: string,
    onDataReceived: (data: UserFinancialBundle) => void,
    onError?: (error: Error) => void
  ): Unsubscribe {
    const userDocRef = doc(db, 'users', userId);

    return onSnapshot(
      userDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserFinancialBundle;
          onDataReceived(data);
        }
      },
      (error) => {
        console.warn('[FirestoreSync] Subscription error:', error);
        if (onError) onError(error);
      }
    );
  },

  /**
   * Check if user document already exists in Cloud Firestore
   */
  async getUserData(userId: string): Promise<UserFinancialBundle | null> {
    try {
      const userDocRef = doc(db, 'users', userId);
      const snapshot = await getDoc(userDocRef);
      if (snapshot.exists()) {
        return snapshot.data() as UserFinancialBundle;
      }
      return null;
    } catch (error) {
      console.warn('[FirestoreSync] Error fetching user data:', error);
      return null;
    }
  },

  /**
   * Save full user financial bundle to Cloud Firestore
   */
  async saveUserData(userId: string, bundle: UserFinancialBundle): Promise<boolean> {
    try {
      const userDocRef = doc(db, 'users', userId);
      await setDoc(
        userDocRef,
        {
          ...bundle,
          updatedAt: new Date().toISOString()
        },
        { merge: true }
      );
      return true;
    } catch (error) {
      console.warn('[FirestoreSync] Error saving to Cloud Firestore:', error);
      return false;
    }
  }
};
