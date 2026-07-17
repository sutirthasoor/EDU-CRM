import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Copy your Firebase config from src/lib/firebase.ts
// Open D:\CRM\src\lib\firebase.ts and copy the firebaseConfig object
const firebaseConfig = {
  apiKey: "AIzaSyC_9iO4zDeDNaBCZtHwY7X0C-SIwCPi4DU",
  authDomain: "gilded-vault-d4l.firebaseapp.com",
  databaseURL: "https://gilded-vault-d4l-default-rtdb.firebaseio.com",
  projectId: "gilded-vault-d4l",
  storageBucket: "gilded-vault-d4l.firebasestorage.app",
  messagingSenderId: "912140202890",
  appId: "1:912140202890:web:1d64f1a321924df9020e73"
};

// Initialize Firebase directly in the script
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

/**
 * RUN THIS SCRIPT ONCE TO CREATE YOUR FIRST SUPER ADMIN
 */
const createSuperAdmin = async () => {
  try {
    // CHANGE THESE CREDENTIALS
    const email = 'sutirthasoor@gmail.com';
    const password = 'soorsoor';
    const name = 'Super Admin';

    console.log('🚀 Creating super admin...');

    // Create user in Firebase Auth
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const uid = userCredential.user.uid;

    console.log('✅ User created in Auth with UID:', uid);

    // Save to Firestore with superadmin role
    await setDoc(doc(db, 'users', uid), {
      name,
      email,
      role: 'superadmin',
      uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    console.log('✅ Super admin saved to Firestore');
    console.log('🎉 Super admin created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('\nYou can now log in with these credentials.');

  } catch (error: any) {
    console.error('❌ Error creating super admin:', error.message);
    if (error.code === 'auth/email-already-in-use') {
      console.log('Email already exists. Try updating the role in Firestore instead.');
    }
  }
};

createSuperAdmin();