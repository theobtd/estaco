const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// Function to validate and send a friend request
exports.sendFriendRequest = functions.https.onCall(async (data, context) => {
  // 1. Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "Only authenticated users can send friend requests."
    );
  }

  const { toUid, fromName } = data;
  const fromUid = context.auth.uid;

  // 2. Check if the target user exists
  const toUserDoc = await admin.firestore().collection("users").doc(toUid).get();
  if (!toUserDoc.exists) {
    throw new functions.https.HttpsError(
      "not-found",
      "Target user does not exist."
    );
  }

  // 3. Check if a friend request already exists
  const existingRequest = await admin
    .firestore()
    .collection("friendRequests")
    .where("from", "==", fromUid)
    .where("to", "==", toUid)
    .get();

  if (!existingRequest.empty) {
    throw new functions.https.HttpsError(
      "already-exists",
      "A friend request already exists."
    );
  }

  // 4. Check if the user already has 15 friends
  const friendsDoc = await admin
    .firestore()
    .collection("friends")
    .doc(fromUid)
    .get();
  const friends = friendsDoc.data()?.friends || [];
  if (friends.length >= 15) {
    throw new functions.https.HttpsError(
      "resource-exhausted",
      "You have reached the maximum number of friends (15)."
    );
  }

  // 5. Create the friend request
  await admin.firestore().collection("friendRequests").add({
    from: fromUid,
    to: toUid,
    fromName: fromName,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { success: true, message: "Friend request sent!" };
});
