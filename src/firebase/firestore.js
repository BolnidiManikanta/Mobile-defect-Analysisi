import { getFirestore } from 'firebase/firestore';
import { app } from './init.js';

export const db = getFirestore(app);
