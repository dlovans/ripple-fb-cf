import {onSchedule} from "firebase-functions/scheduler";
import admin from "firebase-admin";

export const cleanupconnections = onSchedule('every 30 minutes', async () => {
    const chatsSnapshot = await admin.firestore().collection('chats').get();

    if (chatsSnapshot.empty) {
        console.log("No chats found.");
        return;
    }

    const now = admin.firestore.Timestamp.now().toMillis();
    const timeout = 5 * 60 * 1000;

    for (const chatDoc of chatsSnapshot.docs) {
        const chatRef = chatDoc.ref;
        const listenersSnapshot = await chatRef.collection('listeners').get();

        const connections = await chatDoc.get("connections")
        if (listenersSnapshot.empty) {
            console.log(`No listeners found for chat ${chatDoc.id}.`);
            if (connections > 0) {
                await chatRef.update({
                    connections: admin.firestore.FieldValue.increment(-1),
                });
                console.log(`Decremented connection count for chat ${chatDoc.id}.`);
            } else if (connections < 0) {
                await chatRef.update({
                    connections: 0
                })
                console.log(`Reset connection count for chat ${chatDoc.id}.`);
            }
            continue;
        }

        for (const listenerDoc of listenersSnapshot.docs) {
            const listenerData = listenerDoc.data();

            if (!listenerData.lastActive) {
                console.warn(`Listener ${listenerDoc.id} in chat ${chatDoc.id} has no lastActive field.`);
                continue;
            }

            const lastActive = listenerData.lastActive.toMillis();
            if (now - lastActive > timeout) {
                await listenerDoc.ref.delete();
                console.log(`Removed stale listener ${listenerDoc.id} in chat ${chatDoc.id}.`);

                // const chatDoc = await chatRef.collection('chats').doc(chatDoc.id).get()

                if (connections > 0) {
                    await chatRef.update({
                        connections: admin.firestore.FieldValue.increment(-1),
                    });
                    console.log(`Decremented connection count for chat ${chatDoc.id}.`);
                } else if (connections < 0) {
                    await chatRef.update({
                        connections: 0
                    })
                    console.log(`Reset connection count for chat ${chatDoc.id}.`);
                }
            }
        }
    }
});
