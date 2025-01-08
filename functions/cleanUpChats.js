import { onSchedule } from "firebase-functions/scheduler";
import admin from "firebase-admin";
import * as firebaseTools from 'firebase-tools';

export const cleanupchats = onSchedule('every 48 hours', async () => {
    const chatsSnapshot = await admin.firestore()
        .collection('chats')
        .where('active', '==', false)
        .get();

    if (chatsSnapshot.empty) {
        console.log("No chats found.");
        return;
    }

    const now = admin.firestore.Timestamp.now().toMillis();
    const timeout = 12 * 60 * 60 * 1000;

    for (const chatDoc of chatsSnapshot.docs) {
        const chat = chatDoc.data();
        const path = `chats/${chatDoc.id}`;

        const lastActive = chat.lastActive.toMillis();
        if (now - lastActive > timeout && chat.connections <= 0) {
            console.log(`Deleting chat ${chatDoc.id} and its subcollections.`);
            await deleteCollectionRecursively(path);
        }
    }
});

/**
 * Recursively deletes a document or collection and all its subcollections.
 * @param {string} path - The path to the document or collection to delete.
 */
async function deleteCollectionRecursively(path) {
    try {
        await firebaseTools.firestore.delete(path, {
            project: process.env.GCLOUD_PROJECT,
            recursive: true,
            force: true,
            token: process.env.FIREBASE_TOKEN,  // Make sure you have set the token for authentication
        });
        console.log(`Successfully deleted path: ${path}`);
    } catch (error) {
        console.error(`Error deleting path ${path}:`, error);
    }
}
