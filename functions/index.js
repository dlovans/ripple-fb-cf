import admin from "firebase-admin";

admin.initializeApp()

import { cleanupconnections } from "./cleanUpConnections.js";
import { cleanupchats } from "./cleanUpChats.js";

export { cleanupconnections, cleanupchats };