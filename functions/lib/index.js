"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.bootstrapAdmin = exports.updateUserRole = exports.toggleUserStatus = exports.resetUserPassword = exports.createUser = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
admin.initializeApp();
const db = admin.firestore();
// ============ HELPER FUNCTIONS ============
async function verifyAdmin(context) {
    var _a;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Ch\u01b0a \u0111\u0103ng nh\u1eadp');
    }
    const userDoc = await db.collection('users').doc(context.auth.uid).get();
    if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'ADMIN') {
        throw new functions.https.HttpsError('permission-denied', 'B\u1ea1n kh\u00f4ng c\u00f3 quy\u1ec1n th\u1ef1c hi\u1ec7n thao t\u00e1c n\u00e0y');
    }
}
// ============ CREATE USER ============
exports.createUser = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { email, password, displayName, employeeId, role, department } = data;
    // Validate inputs
    if (!email || !password || !displayName || !employeeId) {
        throw new functions.https.HttpsError('invalid-argument', 'Thi\u1ebfu th\u00f4ng tin b\u1eaft bu\u1ed9c');
    }
    if (!['ADMIN', 'EMPLOYEE'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Vai tr\u00f2 kh\u00f4ng h\u1ee3p l\u1ec7');
    }
    if (password.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'M\u1eadt kh\u1ea9u ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 6 k\u00fd t\u1ef1');
    }
    // Check if employeeId already exists
    const existingEmployee = await db
        .collection('users')
        .where('employeeId', '==', employeeId)
        .get();
    if (!existingEmployee.empty) {
        throw new functions.https.HttpsError('already-exists', 'M\u00e3 nh\u00e2n vi\u00ean \u0111\u00e3 t\u1ed3n t\u1ea1i');
    }
    try {
        // Create Firebase Auth user
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName,
        });
        // Set custom claims for role
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });
        // Create Firestore user document
        const now = admin.firestore.Timestamp.now();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            employeeId,
            displayName,
            email,
            role,
            department: department || '',
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
        return { uid: userRecord.uid, message: 'T\u1ea1o t\u00e0i kho\u1ea3n th\u00e0nh c\u00f4ng' };
    }
    catch (error) {
        if (error.code === 'auth/email-already-exists') {
            throw new functions.https.HttpsError('already-exists', 'Email \u0111\u00e3 \u0111\u01b0\u1ee3c s\u1eed d\u1ee5ng');
        }
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// ============ RESET PASSWORD ============
exports.resetUserPassword = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { uid, newPassword } = data;
    if (!uid || !newPassword) {
        throw new functions.https.HttpsError('invalid-argument', 'Thi\u1ebfu th\u00f4ng tin');
    }
    if (newPassword.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'M\u1eadt kh\u1ea9u ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 6 k\u00fd t\u1ef1');
    }
    try {
        await admin.auth().updateUser(uid, { password: newPassword });
        return { message: '\u0110\u1eb7t l\u1ea1i m\u1eadt kh\u1ea9u th\u00e0nh c\u00f4ng' };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// ============ TOGGLE USER STATUS ============
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { uid, isActive } = data;
    if (!uid || typeof isActive !== 'boolean') {
        throw new functions.https.HttpsError('invalid-argument', 'Thi\u1ebfu th\u00f4ng tin');
    }
    try {
        // Disable/enable Firebase Auth account
        await admin.auth().updateUser(uid, { disabled: !isActive });
        // Update Firestore
        await db.collection('users').doc(uid).update({
            isActive,
            updatedAt: admin.firestore.Timestamp.now(),
        });
        return { message: isActive ? 'K\u00edch ho\u1ea1t th\u00e0nh c\u00f4ng' : 'V\u00f4 hi\u1ec7u h\u00f3a th\u00e0nh c\u00f4ng' };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// ============ UPDATE USER ROLE ============
exports.updateUserRole = functions.https.onCall(async (data, context) => {
    await verifyAdmin(context);
    const { uid, role } = data;
    if (!uid || !['ADMIN', 'EMPLOYEE'].includes(role)) {
        throw new functions.https.HttpsError('invalid-argument', 'Th\u00f4ng tin kh\u00f4ng h\u1ee3p l\u1ec7');
    }
    try {
        // Update custom claims
        await admin.auth().setCustomUserClaims(uid, { role });
        // Update Firestore
        await db.collection('users').doc(uid).update({
            role,
            updatedAt: admin.firestore.Timestamp.now(),
        });
        return { message: 'C\u1eadp nh\u1eadt vai tr\u00f2 th\u00e0nh c\u00f4ng' };
    }
    catch (error) {
        throw new functions.https.HttpsError('internal', error.message);
    }
});
// ============ BOOTSTRAP FIRST ADMIN ============
// This function can only be called once when there are no admin users
// After the first admin is created, this function will reject all calls
exports.bootstrapAdmin = functions.https.onCall(async (data, context) => {
    // Check if any admin already exists
    const existingAdmins = await db
        .collection('users')
        .where('role', '==', 'ADMIN')
        .limit(1)
        .get();
    if (!existingAdmins.empty) {
        throw new functions.https.HttpsError('already-exists', 'H\u1ec7 th\u1ed1ng \u0111\u00e3 c\u00f3 qu\u1ea3n tr\u1ecb vi\u00ean. Kh\u00f4ng th\u1ec3 t\u1ea1o th\u00eam qua bootstrap.');
    }
    const { email, password, displayName, employeeId, department } = data;
    if (!email || !displayName || !employeeId) {
        throw new functions.https.HttpsError('invalid-argument', 'Thi\u1ebfu th\u00f4ng tin b\u1eaft bu\u1ed9c');
    }
    if (password && password.length < 6) {
        throw new functions.https.HttpsError('invalid-argument', 'M\u1eadt kh\u1ea9u ph\u1ea3i c\u00f3 \u00edt nh\u1ea5t 6 k\u00fd t\u1ef1');
    }
    try {
        // Reuse an Auth account created manually in the Firebase Console only
        // when that account is the caller. This prevents an unauthenticated caller
        // from claiming someone else's existing email as the first administrator.
        let userRecord;
        try {
            const existingUser = await admin.auth().getUserByEmail(email);
            if (!context.auth || context.auth.uid !== existingUser.uid) {
                throw new functions.https.HttpsError('permission-denied', 'Sign in with this existing account before bootstrapping it.');
            }
            userRecord = existingUser;
        }
        catch (error) {
            if (error instanceof functions.https.HttpsError)
                throw error;
            if (error.code !== 'auth/user-not-found')
                throw error;
            if (!password) {
                throw new functions.https.HttpsError('invalid-argument', 'A password is required when the Auth account does not exist.');
            }
            userRecord = await admin.auth().createUser({ email, password, displayName });
        }
        const existingProfile = await db.collection('users').doc(userRecord.uid).get();
        if (existingProfile.exists) {
            throw new functions.https.HttpsError('already-exists', 'A user profile already exists for this Auth account.');
        }
        await admin.auth().updateUser(userRecord.uid, { displayName });
        await admin.auth().setCustomUserClaims(userRecord.uid, { role: 'ADMIN' });
        const now = admin.firestore.Timestamp.now();
        await db.collection('users').doc(userRecord.uid).set({
            uid: userRecord.uid,
            employeeId,
            displayName,
            email,
            role: 'ADMIN',
            department: department || '',
            isActive: true,
            createdAt: now,
            updatedAt: now,
        });
        return {
            uid: userRecord.uid,
            message: 'T\u1ea1o qu\u1ea3n tr\u1ecb vi\u00ean \u0111\u1ea7u ti\u00ean th\u00e0nh c\u00f4ng!',
        };
    }
    catch (error) {
        if (error instanceof functions.https.HttpsError)
            throw error;
        throw new functions.https.HttpsError('internal', error.message);
    }
});
//# sourceMappingURL=index.js.map