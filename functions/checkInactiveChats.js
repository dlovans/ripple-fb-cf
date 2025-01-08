import { onSchedule } from "firebase-functions/scheduler";
import admin from "firebase-admin";

export const checkinactivechats = onSchedule('every 8 hours', async () => {
    const chatsSnapshot = await admin.firestore()
        .collection('chats')
        .where('active', '==', true)
        .get();

    if (chatsSnapshot.empty) {
        console.log("No chats found.");
        return;
    }

    const now = admin.firestore.Timestamp.now().toMillis();
    const timeout = 12 * 60 * 60 * 1000;

    for (const chatDoc of chatsSnapshot.docs) {
        const chat = chatDoc.data();

        const lastActive = chat.lastActive.toMillis();
        if (!chat.lastActive || now - lastActive > timeout) {
            console.log(`Setting chat ${chatDoc.id} activity to inactive state.`);
            await admin.firestore().collection("chats").doc(chatDoc.id).update({
                active: false
            })
        }
    }
})