import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  databaseURL: 'https://wqm-fishpondfeeder-default-rtdb.firebaseio.com',
  apiKey: 'AIzaSyAmq7cGm5q4mKe8Gso2FAWT3ASFH71HMxo'
};

const app = initializeApp(firebaseConfig);
export const database = getDatabase(app); 