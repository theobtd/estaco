// utils.js
async function removeFriend(userId, friendUid) {
  const confirmRemove = confirm(translations[userLanguage]["Are you sure you want to remove this friend?"]);
  if (!confirmRemove) return;

  // Show loader
  document.getElementById('upload-overlay').style.display = 'flex';

  try {
    // Fetch user and friend names for updates
    const [userDoc, friendDoc] = await Promise.all([
      db.collection('users').doc(userId).get(),
      db.collection('users').doc(friendUid).get()
    ]);
    const userName = userDoc.data().name;
    const friendName = friendDoc.data().name;

    // Remove posts from both users' feeds
    await removePostsFromUserFeed(userId, friendUid);
    await removePostsFromUserFeed(friendUid, userId);

    // Remove friend relationship
    const userFriendsUpdate = db.collection('friends').doc(userId).update({
      friends: firebase.firestore.FieldValue.arrayRemove({ uid: friendUid, name: friendName }),
      friendsList: firebase.firestore.FieldValue.arrayRemove(friendUid)
    });

    const friendFriendsUpdate = db.collection('friends').doc(friendUid).update({
      friends: firebase.firestore.FieldValue.arrayRemove({ uid: userId, name: userName }),
      friendsList: firebase.firestore.FieldValue.arrayRemove(userId)
    });

    await Promise.all([userFriendsUpdate, friendFriendsUpdate]);

    // Reload the current user's friends list
    if (typeof loadCurrentFriends === 'function') {
      loadCurrentFriends(userId);
    }

    // If the current page is home.html, force a feed refresh
    if (window.location.pathname.endsWith('home.html')) {
      if (typeof forceReloadFeed === 'function') {
        forceReloadFeed();
      }
    }
  } catch (error) {
    console.error("Error removing friend:", error);
    alert(translations[userLanguage]["Failed to remove friend."]);
  } finally {
    // Hide loader
    document.getElementById('upload-overlay').style.display = 'none';
  }
}

async function removePostsFromUserFeed(userId, authorId) {
  try {
    const feedSnapshot = await db.collection(`users/${userId}/feed`).get();
    const batch = db.batch();

    const promises = feedSnapshot.docs.map(async (doc) => {
      const postId = doc.data().postId;
      const postDoc = await db.collection('posts').doc(postId).get();
      if (postDoc.exists && postDoc.data().authorId === authorId) {
        batch.delete(doc.ref);
      }
    });

    await Promise.all(promises);
    await batch.commit();
    console.log(`Removed all posts from ${authorId} from ${userId}'s feed.`);
  } catch (error) {
    console.error('Error removing posts from feed:', error);
  }
}
