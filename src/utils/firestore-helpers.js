import {
  collection, addDoc, getDocs, deleteDoc, updateDoc,
  query, where, orderBy, doc, setDoc, getDoc, onSnapshot,
  serverTimestamp, limit, increment
} from 'firebase/firestore';
import { db } from '../firebase/firestore.js';
import { MOCK_SCANS } from './data.js';

function isOffline() {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}

// ── User Profile ────────────────────────────────────────────
export async function saveUserProfile(user, extraData = {}) {
  if (isOffline()) return null;
  try {
    const ref  = doc(db, 'users', user.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      await setDoc(ref, {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName || '',
        photoURL:    user.photoURL || '',
        plan:        'free',
        scansUsed:   0,
        scansLimit:  50,
        role:        extraData.role || 'user',
        location:    extraData.location || 'Sivakasi, Tamil Nadu',
        lang:        extraData.lang || 'en',
        createdAt:   serverTimestamp(),
        ...extraData,
      });
    } else {
      // Update dynamic fields on every login
      await updateDoc(ref, {
        displayName: user.displayName || snap.data().displayName || '',
        photoURL:    user.photoURL    || snap.data().photoURL    || '',
        lastLoginAt: serverTimestamp(),
      });
    }
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('[Firestore] Profile save failed:', e.message);
    return null;
  }
}

export async function getUserProfile(uid) {
  if (isOffline()) return null;
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    console.warn('[Firestore] Get profile failed:', e.message);
    return null;
  }
}

export async function updateUserProfile(uid, data) {
  try {
    await updateDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.warn('[Firestore] Update profile failed:', e.message);
    return false;
  }
}

// ── Scans ───────────────────────────────────────────────────
export async function loadUserScans(uid) {
  try {
    const q    = query(collection(db, 'scans'), where('uid','==',uid), orderBy('createdAt','desc'), limit(500));
    const snap = await getDocs(q);
    if (snap.empty) return [...MOCK_SCANS];
    return snap.docs.map(d => ({
      id: d.id,
      ...d.data(),
      created_at: d.data().createdAt?.toDate?.()?.toISOString() || d.data().created_at || new Date().toISOString(),
    }));
  } catch (e) {
    console.warn('[Firestore] Scans load failed — using mock:', e.message);
    return [...MOCK_SCANS];
  }
}

export async function saveScan(uid, scanData) {
  try {
    const ref = await addDoc(collection(db, 'scans'), {
      ...scanData,
      uid,
      image_url: scanData.image_url || null,
      createdAt: serverTimestamp(),
    });
    // Increment scan counter on user profile
    await updateDoc(doc(db, 'users', uid), { scansUsed: increment(1) });
    return ref.id;
  } catch (e) {
    console.warn('[Firestore] Scan save failed:', e.message);
    return null;
  }
}

export async function deleteAllScans(uid) {
  try {
    const q    = query(collection(db, 'scans'), where('uid','==',uid));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => deleteDoc(doc(db, 'scans', d.id))));
    return true;
  } catch (e) {
    console.warn('[Firestore] Delete scans failed:', e.message);
    return false;
  }
}

// ── Vendors ─────────────────────────────────────────────────
export async function loadVendors(city = '') {
  try {
    let q = query(collection(db, 'vendors'), where('isActive','==',true), where('isApproved','==',true), limit(20));
    const snap = await getDocs(q);
    if (snap.empty) return null; // Will fall back to MOCK_SHOPS
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[Firestore] Load vendors failed:', e.message);
    return null;
  }
}

export async function saveVendor(uid, vendorData) {
  try {
    const ref = doc(db, 'vendors', uid);
    await setDoc(ref, {
      uid,
      ...vendorData,
      isApproved: false, // Requires admin approval
      isActive:   true,
      rating:     0,
      totalReviews: 0,
      totalEarnings: 0,
      jobsDone: 0,
      lat: vendorData.lat || 12.9716, // Default to Bangalore center if not provided
      lng: vendorData.lng || 77.5946,
      createdAt: serverTimestamp(),
    });
    // Mark user as vendor
    await updateDoc(doc(db, 'users', uid), { role: 'vendor', vendorId: uid });
    return true;
  } catch (e) {
    console.warn('[Firestore] Save vendor failed:', e.message);
    return false;
  }
}

export async function getVendorProfile(uid) {
  try {
    const snap = await getDoc(doc(db, 'vendors', uid));
    return snap.exists() ? { id: snap.id, ...snap.data() } : null;
  } catch (e) {
    return null;
  }
}

export async function updateVendorPricing(vendorId, priceList) {
  try {
    await updateDoc(doc(db, 'vendors', vendorId), { priceList, updatedAt: serverTimestamp() });
    return true;
  } catch (e) {
    console.warn('[Firestore] Update pricing failed:', e.message);
    return false;
  }
}

// ── Bookings ────────────────────────────────────────────────
export async function createBooking(uid, bookingData) {
  try {
    const ref = await addDoc(collection(db, 'bookings'), {
      uid,
      ...bookingData,
      status:        'requested',
      paymentStatus: 'pending',
      timeline: [{
        status: 'requested',
        timestamp: new Date().toISOString(),
        note: 'Booking request submitted',
      }],
      createdAt: serverTimestamp(),
    });
    // Notify vendor
    await addNotification(bookingData.vendorId, {
      type:  'new_booking',
      title: 'New Repair Request',
      body:  `New booking for ${bookingData.deviceBrand} ${bookingData.deviceModel}`,
      ref:   ref.id,
    });
    return ref.id;
  } catch (e) {
    console.warn('[Firestore] Create booking failed:', e.message);
    return null;
  }
}

export async function getUserBookings(uid) {
  try {
    const q    = query(collection(db, 'bookings'), where('uid','==',uid), orderBy('createdAt','desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[Firestore] Get user bookings failed:', e.message);
    return [];
  }
}

export async function getVendorBookings(vendorId) {
  try {
    const q    = query(collection(db, 'bookings'), where('vendorId','==',vendorId), orderBy('createdAt','desc'), limit(50));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('[Firestore] Get vendor bookings failed:', e.message);
    return [];
  }
}

export async function updateBookingStatus(bookingId, status, note = '') {
  try {
    const ref  = doc(db, 'bookings', bookingId);
    const snap = await getDoc(ref);
    if (!snap.exists()) return false;
    const booking  = snap.data();
    const timeline = [...(booking.timeline || []), {
      status, timestamp: new Date().toISOString(), note,
    }];
    await updateDoc(ref, { status, timeline, updatedAt: serverTimestamp() });
    // Notify user of status change
    await addNotification(booking.uid, {
      type:  'booking_update',
      title: 'Booking Update',
      body:  `Your repair booking is now: ${status.replace('_',' ')}`,
      ref:   bookingId,
    });
    return true;
  } catch (e) {
    console.warn('[Firestore] Update booking failed:', e.message);
    return false;
  }
}

export async function updateBookingPayment(bookingId, paymentId, amount) {
  try {
    await updateDoc(doc(db, 'bookings', bookingId), {
      paymentStatus: 'paid',
      paymentId,
      paidAmount:    amount,
      paidAt:        serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.warn('[Firestore] Update payment failed:', e.message);
    return false;
  }
}

// ── Chat ────────────────────────────────────────────────────
export async function sendChatMessage(bookingId, fromUid, text, payload = {}) {
  try {
    const chatRef = doc(db, 'chats', bookingId);
    const snap    = await getDoc(chatRef);
    const message = { from: fromUid, text, timestamp: new Date().toISOString(), ...payload };
    if (!snap.exists()) {
      await setDoc(chatRef, {
        bookingId,
        messages:    [message],
        lastMessage: text,
        updatedAt:   serverTimestamp(),
      });
    } else {
      const messages = [...(snap.data().messages || []), message];
      await updateDoc(chatRef, { messages, lastMessage: text, updatedAt: serverTimestamp() });
    }
    return true;
  } catch (e) {
    console.warn('[Firestore] Send message failed:', e.message);
    return false;
  }
}

export function subscribeToChat(bookingId, callback) {
  try {
    return onSnapshot(doc(db, 'chats', bookingId), snap => {
      if (snap.exists()) callback(snap.data().messages || []);
    });
  } catch (e) {
    console.warn('[Firestore] Chat subscribe failed:', e.message);
    return () => {};
  }
}

// ── Notifications ───────────────────────────────────────────
export async function addNotification(uid, data) {
  try {
    await addDoc(collection(db, 'users', uid, 'notifications'), {
      ...data, read: false, createdAt: serverTimestamp(),
    });
  } catch (e) {
    // Non-critical — do not throw
  }
}

export async function loadNotifications(uid) {
  try {
    const q    = query(collection(db, 'users', uid, 'notifications'), orderBy('createdAt','desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    return [];
  }
}

export async function markNotificationsRead(uid) {
  try {
    const q    = query(collection(db, 'users', uid, 'notifications'), where('read','==',false));
    const snap = await getDocs(q);
    await Promise.all(snap.docs.map(d => updateDoc(d.ref, { read: true })));
  } catch (e) {}
}

// ── Devices & Pricing ───────────────────────────────────────
export async function getDevicePricing(brand, model) {
  if (isOffline()) return null;
  try {
    const q = query(
      collection(db, 'devices'), 
      where('brand', '==', brand), 
      where('model', '==', model)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return snap.docs[0].data();
    
    // Fallback: search by brand only
    const q2 = query(collection(db, 'devices'), where('brand', '==', brand), limit(1));
    const snap2 = await getDocs(q2);
    return !snap2.empty ? snap2.docs[0].data() : null;
  } catch (e) {
    console.warn('[Firestore] Get pricing failed:', e.message);
    return null;
  }
}

export async function seedDevices(devicesList) {
  try {
    for (const dev of devicesList) {
      const q = query(collection(db, 'devices'), where('model', '==', dev.model));
      const snap = await getDocs(q);
      if (snap.empty) {
        await addDoc(collection(db, 'devices'), { ...dev, createdAt: serverTimestamp() });
      }
    }
    return true;
  } catch (e) {
    return false;
  }
}

// ── Logging ─────────────────────────────────────────────────
export async function addLog(uid, action, details = {}) {
  try {
    await addDoc(collection(db, 'logs'), {
      uid, 
      action, 
      details, 
      timestamp: serverTimestamp(),
      userAgent: navigator.userAgent
    });
  } catch (e) {
    // Non-critical
  }
}

/**
 * Save a vendor review
 */
export async function saveReview(uid, vendorId, review) {
  try {
    const ref = collection(db, 'reviews');
    await addDoc(ref, {
      uid, vendorId, ...review,
      timestamp: Date.now()
    });
    // Add activity log
    await addLog(uid, 'submit_review', { vendorId, rating: review.rating });
    return true;
  } catch (e) {
    console.error('Review error:', e);
    return false;
  }
}

/**
 * Update booking status with optional repair image
 */
export async function updateBookingWithRepairImage(bookingId, status, imageUrl) {
  try {
    const ref = doc(db, 'bookings', bookingId);
    const update = { status, updatedAt: Date.now() };
    if (imageUrl) update.repairImage = imageUrl;
    await updateDoc(ref, update);
    return true;
  } catch (e) {
    console.error('Booking update error:', e);
    return false;
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId, reason) {
  try {
    const ref = doc(db, 'bookings', bookingId);
    await updateDoc(ref, { 
      status: 'cancelled', 
      cancelReason: reason,
      updatedAt: Date.now() 
    });
    return true;
  } catch (e) {
    console.error('Cancel error:', e);
    return false;
  }
}

/**
 * Reschedule a booking
 */
export async function rescheduleBooking(bookingId, date, time) {
  try {
    const ref = doc(db, 'bookings', bookingId);
    await updateDoc(ref, { 
      slotDate: date, 
      slotTime: time,
      status: 'requested', // reset to request for vendor approval
      updatedAt: Date.now() 
    });
    return true;
  } catch (e) {
    console.error('Reschedule error:', e);
    return false;
  }
}

/**
 * Simple rate limiting check (client-side prevention)
 */
export async function rateLimitCheck(uid, action, limit = 5, windowMs = 60000) {
  if (isOffline()) return true;
  try {
    const logsRef = collection(db, 'logs');
    const q = query(
      logsRef, 
      where('uid', '==', uid), 
      where('action', '==', action),
      where('timestamp', '>', Date.now() - windowMs)
    );
    const snap = await getDocs(q);
    return snap.size < limit;
  } catch (e) {
    return true; // fail-open for UX
  }
}
