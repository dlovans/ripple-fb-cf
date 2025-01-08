import admin from "firebase-admin";

admin.initializeApp()

import { cleanupconnections } from "./cleanUpConnections.js";
import { cleanupchats } from "./cleanUpChats.js";
import { checkinactivechats } from "./checkInactiveChats.js";

export { cleanupconnections, cleanupchats, checkinactivechats };