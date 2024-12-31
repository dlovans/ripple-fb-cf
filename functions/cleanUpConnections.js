import {onSchedule} from "firebase-functions/scheduler";
import admin from "firebase-admin";

export const cleanupconnections = onSchedule('every 30 minutes', async () => {
    const chatsSnapshot = await admin.firestore().collection('chats').get();

    if (chatsSnapshot.empty) {
        console.log("No chats found.");
        return;
    }

    const now = admin.firestore.Timestamp.now().toMillis();
    const timeout = 5 * 60 * 1000; // 5 minutes in milliseconds

    for (const chatDoc of chatsSnapshot.docs) {
        const chatRef = chatDoc.ref;
        const listenersSnapshot = await chatRef.collection('listeners').get();

        if (listenersSnapshot.empty) {
            console.log(`No listeners found for chat ${chatDoc.id}.`);
            continue;
        }

        for (const listenerDoc of listenersSnapshot.docs) {
            const listenerData = listenerDoc.data();

            if (!listenerData.lastActive) {
                console.warn(`Listener ${listenerDoc.id} in chat ${chatDoc.id} has no lastActive field.`);
                continue;
            }

            const lastActive = listenerData.lastActive.toMillis();
            if (now - lastActive > timeout) { // Check for 5-minute timeout
                // Delete the stale listener
                await listenerDoc.ref.delete();
                console.log(`Removed stale listener ${listenerDoc.id} in chat ${chatDoc.id}.`);

                // Decrement the connection count
                await chatRef.update({
                    connection: admin.firestore.FieldValue.increment(-1),
                });
                console.log(`Decremented connection count for chat ${chatDoc.id}.`);
            }
        }
    }
});
