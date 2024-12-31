import {onSchedule} from "firebase-functions/scheduler";
import admin from "firebase-admin";

export const cleanupchats = onSchedule('every 24 hours', async () => {
    const chatsSnapshot = await admin.firestore().collection('chats').get();

    if (chatsSnapshot.empty) {
        console.log("No chats found.");
        return;
    }

    const now = admin.firestore.Timestamp.now().toMillis();
    const timeout = 12 * 60 * 60 * 1000;

    for (const chatDoc of chatsSnapshot.docs) {
        const chat = chatDoc.data();
        if (!chat.lastActive) {
            console.log(`Chat ${chatDoc.id} has no lastActive field.`);
            continue;
        }

        const lastActive = chat.lastActive.toMillis();

        if (now - lastActive > timeout && chat.connections <= 0) {
            console.log(`Deleting chat ${chatDoc.id}`);
            await chatDoc.ref.delete();
        }
    }
});
