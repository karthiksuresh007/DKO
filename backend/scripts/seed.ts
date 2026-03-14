import { Timestamp } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "../src/config/firebase.js";

interface DemoUserConfig {
  email: string;
  password: string;
  displayName: string;
  role: "farmer" | "officer" | "admin";
  language?: "en" | "hi" | "pa";
}

const demoUsers: DemoUserConfig[] = [
  {
    email: "farmer.demo@dko.app",
    password: "Demo@12345",
    displayName: "Karthik Farmer",
    role: "farmer",
    language: "en"
  },
  {
    email: "officer.demo@dko.app",
    password: "Demo@12345",
    displayName: "Maya Officer",
    role: "officer",
    language: "en"
  },
  {
    email: "admin.demo@dko.app",
    password: "Demo@12345",
    displayName: "Ravi Admin",
    role: "admin",
    language: "en"
  }
];

async function upsertAuthUser(config: DemoUserConfig) {
  try {
    const existing = await adminAuth.getUserByEmail(config.email);
    await adminAuth.updateUser(existing.uid, {
      displayName: config.displayName,
      password: config.password
    });
    return existing.uid;
  } catch {
    const created = await adminAuth.createUser({
      email: config.email,
      password: config.password,
      displayName: config.displayName,
      emailVerified: true
    });
    return created.uid;
  }
}

function stamp(date: string) {
  return Timestamp.fromDate(new Date(date));
}

async function seedUserProfiles(userIds: Record<string, string>) {
  await Promise.all(
    demoUsers.map((user) =>
      adminDb.collection("users").doc(userIds[user.role]).set(
        {
          userId: userIds[user.role],
          name: user.displayName,
          email: user.email,
          role: user.role,
          language: user.language ?? "en",
          isActive: true,
          createdAt: stamp("2026-03-10T08:00:00.000Z"),
          lastLoginAt: Timestamp.now()
        },
        { merge: true }
      )
    )
  );
}

async function seedQueries(userIds: Record<string, string>) {
  const farmerId = userIds.farmer;
  const officerId = userIds.officer;

  await adminDb.collection("queries").doc("demo-query-text").set({
    queryId: "demo-query-text",
    userId: farmerId,
    type: "text",
    content: "My tomato leaves have yellow patches and the edges are curling after two days of heavy rain. What should I do?",
    status: "answered",
    confidence: 84,
    latestResponse: "1. Remove the most affected lower leaves. 2. Improve drainage around the bed. 3. Avoid extra fertilizer for 48 hours. 4. Monitor for fungal spread and escalate if it worsens.",
    createdAt: stamp("2026-03-11T05:30:00.000Z"),
    answeredAt: stamp("2026-03-11T05:32:00.000Z")
  }, { merge: true });

  await adminDb.collection("queries").doc("demo-query-voice").set({
    queryId: "demo-query-voice",
    userId: farmerId,
    type: "voice",
    description: "Paddy field patch is yellowing after stagnant rainwater.",
    transcribedText: "My paddy plants are turning yellow in one patch after heavy rain and the problem is spreading.",
    status: "resolved",
    confidence: 52,
    latestResponse: "Inspect 10 to 15 plants in the yellowing patch. Drain standing water first. Remove rotting tillers if present. If the spread continues after drainage, share a fresh image and consider a field visit.",
    createdAt: stamp("2026-03-12T07:00:00.000Z"),
    answeredAt: stamp("2026-03-12T07:03:00.000Z"),
    escalatedAt: stamp("2026-03-12T07:05:00.000Z"),
    resolvedAt: stamp("2026-03-12T08:20:00.000Z")
  }, { merge: true });

  await adminDb.collection("queries").doc("demo-query-image").set({
    queryId: "demo-query-image",
    userId: farmerId,
    type: "image",
    imageUrl: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=1200&q=80&auto=format&fit=crop",
    description: "Chilli leaves show white patches and slight curling.",
    detectedDisease: "Possible fungal leaf stress",
    diseaseConfidence: 57,
    status: "escalated",
    confidence: 57,
    latestResponse: "The image suggests possible fungal or humidity-related leaf stress. An officer review has been requested for a safer recommendation.",
    createdAt: stamp("2026-03-13T06:15:00.000Z"),
    answeredAt: stamp("2026-03-13T06:18:00.000Z"),
    escalatedAt: stamp("2026-03-13T06:19:00.000Z")
  }, { merge: true });

  await adminDb.collection("responses").doc("demo-response-text-ai").set({
    responseId: "demo-response-text-ai",
    queryId: "demo-query-text",
    type: "ai",
    content: "1. Remove the most affected lower leaves. 2. Improve drainage around the bed. 3. Avoid extra fertilizer for 48 hours. 4. Monitor for fungal spread and escalate if it worsens.",
    generatedBy: "gemini-demo",
    confidence: 84,
    createdAt: stamp("2026-03-11T05:32:00.000Z")
  }, { merge: true });

  await adminDb.collection("responses").doc("demo-response-voice-ai").set({
    responseId: "demo-response-voice-ai",
    queryId: "demo-query-voice",
    type: "ai",
    content: "Standing water and yellowing in paddy may indicate root stress or nutrient lockout. A human officer review is recommended.",
    generatedBy: "fallback",
    confidence: 52,
    createdAt: stamp("2026-03-12T07:03:00.000Z")
  }, { merge: true });

  await adminDb.collection("responses").doc("demo-response-voice-officer").set({
    responseId: "demo-response-voice-officer",
    queryId: "demo-query-voice",
    type: "officer",
    content: "Inspect 10 to 15 plants in the yellowing patch. Drain standing water first. Remove rotting tillers if present. If the spread continues after drainage, share a fresh image and consider a field visit.",
    officerId: officerId,
    officerName: "Maya Officer",
    createdAt: stamp("2026-03-12T08:20:00.000Z")
  }, { merge: true });

  await adminDb.collection("responses").doc("demo-response-image-ai").set({
    responseId: "demo-response-image-ai",
    queryId: "demo-query-image",
    type: "ai",
    content: "The image suggests possible fungal or humidity-related leaf stress. An officer review has been requested for a safer recommendation.",
    generatedBy: "gemini-demo",
    confidence: 57,
    createdAt: stamp("2026-03-13T06:18:00.000Z")
  }, { merge: true });

  await adminDb.collection("escalations").doc("demo-escalation-voice").set({
    escalationId: "demo-escalation-voice",
    queryId: "demo-query-voice",
    userId: farmerId,
    queryType: "voice",
    reason: "AI confidence was low for this voice advisory.",
    priority: "high",
    status: "resolved",
    assignedTo: officerId,
    assignedAt: stamp("2026-03-12T07:20:00.000Z"),
    responseId: "demo-response-voice-officer",
    createdAt: stamp("2026-03-12T07:05:00.000Z"),
    resolvedAt: stamp("2026-03-12T08:20:00.000Z"),
    farmerName: "Karthik Farmer",
    officerName: "Maya Officer",
    queryPreview: "My paddy plants are turning yellow in one patch after heavy rain and the problem is spreading."
  }, { merge: true });

  await adminDb.collection("escalations").doc("demo-escalation-image").set({
    escalationId: "demo-escalation-image",
    queryId: "demo-query-image",
    userId: farmerId,
    queryType: "image",
    reason: "AI confidence was low for this image advisory.",
    priority: "normal",
    status: "pending",
    assignedTo: null,
    assignedAt: null,
    responseId: null,
    createdAt: stamp("2026-03-13T06:19:00.000Z"),
    resolvedAt: null,
    farmerName: "Karthik Farmer",
    officerName: null,
    queryPreview: "Chilli leaves show white patches and slight curling."
  }, { merge: true });

  await adminDb.collection("notifications").doc("demo-notification-escalated").set({
    notificationId: "demo-notification-escalated",
    userId: farmerId,
    type: "escalation_created",
    title: "Your query is under officer review",
    message: "The AI answer needed human review. An agricultural officer is checking your voice query.",
    queryId: "demo-query-voice",
    escalationId: "demo-escalation-voice",
    isRead: true,
    createdAt: stamp("2026-03-12T07:06:00.000Z"),
    readAt: stamp("2026-03-12T07:30:00.000Z")
  }, { merge: true });

  await adminDb.collection("notifications").doc("demo-notification-officer-response").set({
    notificationId: "demo-notification-officer-response",
    userId: farmerId,
    type: "officer_response",
    title: "Officer response received",
    message: "An agricultural officer has responded to your paddy field issue.",
    queryId: "demo-query-voice",
    escalationId: "demo-escalation-voice",
    isRead: false,
    createdAt: stamp("2026-03-12T08:21:00.000Z"),
    readAt: null
  }, { merge: true });
}

async function main() {
  const userIds: Record<string, string> = {
    farmer: "",
    officer: "",
    admin: ""
  };

  for (const user of demoUsers) {
    userIds[user.role] = await upsertAuthUser(user);
  }

  await seedUserProfiles(userIds);
  await seedQueries(userIds);

  console.log("Demo seed complete.");
  console.log("Farmer:", demoUsers[0].email, demoUsers[0].password);
  console.log("Officer:", demoUsers[1].email, demoUsers[1].password);
  console.log("Admin:", demoUsers[2].email, demoUsers[2].password);
}

main().catch((error) => {
  console.error("Demo seed failed", error);
  process.exitCode = 1;
});
