const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: ["https://estaco.org", "http://localhost"] });

admin.initializeApp();

exports.sendFriendRequest = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      // Check if the user is authenticated
      if (!req.headers.authorization) {
        res.status(401).send("Unauthorized");
        return;
      }

      const { toUid, fromName } = req.body;
      const token = req.headers.authorization.split("Bearer ")[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      const fromUid = decodedToken.uid;

      // Check if the target user exists
      const toUserDoc = await admin.firestore().collection("users").doc(toUid).get();
      if (!toUserDoc.exists) {
        res.status(404).send("Target user does not exist.");
        return;
      }

      // Check if a friend request already exists
      const existingRequest = await admin
        .firestore()
        .collection("friendRequests")
        .where("from", "==", fromUid)
        .where("to", "==", toUid)
        .get();

      if (!existingRequest.empty) {
        res.status(400).send("A friend request already exists.");
        return;
      }

      // Check if the user already has 15 friends
      const friendsDoc = await admin
        .firestore()
        .collection("friends")
        .doc(fromUid)
        .get();
      const friends = friendsDoc.data()?.friends || [];
      if (friends.length >= 15) {
        res.status(403).send("You have reached the maximum number of friends (15).");
        return;
      }

      // Create the friend request
      await admin.firestore().collection("friendRequests").add({
        from: fromUid,
        to: toUid,
        fromName: fromName,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(200).send({ success: true, message: "Friend request sent!" });
    } catch (error) {
      console.error("Error:", error);
      res.status(500).send(error.message);
    }
  });
});
