// Temporary simplified Firebase config
const admin = require('firebase-admin');

// Only initialize if credentials exist
let isFirebaseInitialized = false;

try {
    if (process.env.FIREBASE_PRIVATE_KEY) {
        admin.initializeApp({
            credential: admin.credential.cert({
                type: process.env.FIREBASE_TYPE,
                project_id: process.env.FIREBASE_PROJECT_ID,
                private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
                private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                client_email: process.env.FIREBASE_CLIENT_EMAIL,
                client_id: process.env.FIREBASE_CLIENT_ID,
                auth_uri: process.env.FIREBASE_AUTH_URI,
                token_uri: process.env.FIREBASE_TOKEN_URI,
                auth_provider_x509_cert_url: process.env.FIREBASE_AUTH_PROVIDER_X509_CERT_URL,
                client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL,
                universe_domain: process.env.FIREBASE_UNIVERSAL_DOMAIN,
            })
        });
        isFirebaseInitialized = true;
        console.log('✅ Firebase Admin SDK initialized');
    } else {
        console.log('⚠️ Firebase credentials not found, skipping initialization');
    }
} catch (error) {
    console.error('❌ Firebase initialization error:', error.message);
    console.log('⚠️ Continuing without Firebase verification');
}

module.exports = {
    admin,
    isFirebaseInitialized,
    verifyIdToken: async (idToken) => {
        if (!isFirebaseInitialized) {
            // Return mock verification for testing
            console.warn('Firebase not initialized, using mock verification');
            return {
                uid: 'mock-uid',
                email: 'mock@email.com',
                name: 'Mock User'
            };
        }

        try {
            return await admin.auth().verifyIdToken(idToken);
        } catch (error) {
            console.error('Firebase token verification failed:', error);
            throw error;
        }
    }
};