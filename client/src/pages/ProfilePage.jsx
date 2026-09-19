import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from '../components/Avatar';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import ConnectionsModal from '../components/ConnectionsModal';
import Composer from '../components/Composer';
import { fetchProfile, toggleFollow, openConnections, clearProfile } from '../features/users/usersSlice';
import { fetchProfilePosts, resetProfilePosts } from '../features/posts/postsSlice';
import { updateProfile } from '../features/auth/authSlice';
import { pushToast } from '../features/ui/uiSlice';
import { api } from '../api/client';
import { plural } from '../utils/format';

export default function ProfilePage() {
  const { username } = useParams();
  const dispatch = useDispatch();

  const me = useSelector((s) => s.auth.user);
  const profile = useSelector((s) => s.users.profile);
  const profileStatus = useSelector((s) => s.users.profileStatus);
  const posts = useSelector((s) => s.posts.profile);
  const postsStatus = useSelector((s) => s.posts.status.profile);

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({ fullName: '', bio: '', avatar: '' });
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const isMe = profile && me && profile._id === me._id;

  useEffect(() => {
    dispatch(clearProfile());
    dispatch(resetProfilePosts());
    dispatch(fetchProfile(username));
    dispatch(fetchProfilePosts(username));
    setEditing(false);
  }, [username, dispatch]);

  // Seed the edit form whenever the profile arrives or changes
  useEffect(() => {
    if (profile) {
      setDraft({ fullName: profile.fullName, bio: profile.bio || '', avatar: profile.avatar || '' });
    }
  }, [profile]);

  const pickAvatar = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSavingAvatar(true);
    try {
      const url = await api.uploadImage(file, 'avatar');
      setDraft((d) => ({ ...d, avatar: url }));
      dispatch(pushToast('Photo ready — press Save to apply'));
    } catch (err) {
      dispatch(pushToast(err.message, 'error'));
    } finally {
      setSavingAvatar(false);
      e.target.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    const result = await dispatch(updateProfile(draft));
    if (updateProfile.fulfilled.match(result)) {
      dispatch(pushToast('Profile updated'));
      dispatch(fetchProfile(result.payload.username));
      setEditing(false);
    } else {
      dispatch(pushToast(result.payload || 'Could not save profile', 'error'));
    }
    setSaving(false);
  };

  if (profileStatus === 'loading' || !profile) {
    return profileStatus === 'error' ? (
      <EmptyState title="Profile not found">
        No account exists with the username “{username}”.
      </EmptyState>
    ) : (
      <Spinner label="Loading profile" />
    );
  }

  // Your own following count lives in authSlice, because it changes every
  // time you follow someone anywhere in the app. Reading it from here keeps
  // the number correct without refetching the profile.
  const followingCount = isMe ? me.followingCount : profile.followingCount;

  return (
    <>
      <motion.section
        className="profile"
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
      >
        <div className="profile__cover" />

        <div className="profile__body">
          <div className="profile__top">
            <div className="profile__avatar">
              <Avatar user={editing ? { ...profile, avatar: draft.avatar } : profile} size="lg" />
              {editing && (
                <button
                  className="profile__avatarbtn"
                  onClick={() => fileRef.current?.click()}
                  disabled={savingAvatar}
                  title="Change photo"
                >
                  {savingAvatar ? '…' : 'Edit'}
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/png, image/jpeg, image/webp, image/gif"
                hidden
                onChange={pickAvatar}
              />
            </div>

            {isMe ? (
              <button className="btn btn--outline btn--sm" onClick={() => setEditing((v) => !v)}>
                {editing ? 'Cancel' : 'Edit profile'}
              </button>
            ) : (
              <button
                className={`btn btn--sm ${profile.isFollowing ? 'btn--outline' : 'btn--primary'}`}
                onClick={() => dispatch(toggleFollow(profile._id))}
              >
                {profile.isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
          </div>

          <AnimatePresence mode="wait" initial={false}>
            {editing ? (
              <motion.div
                key="edit"
                className="editform"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.24, ease: [0.2, 0.8, 0.3, 1] }}
              >
                <label className="field">
                  <span>Full name</span>
                  <input
                    value={draft.fullName}
                    onChange={(e) => setDraft({ ...draft, fullName: e.target.value })}
                    maxLength={50}
                  />
                </label>
                <label className="field">
                  <span>Bio</span>
                  <textarea
                    rows={2}
                    maxLength={160}
                    value={draft.bio}
                    onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
                    placeholder="A line about you"
                  />
                  <small>{160 - draft.bio.length} characters left</small>
                </label>
                <div className="editform__actions">
                  <button className="btn btn--ghost btn--sm" onClick={() => setEditing(false)}>
                    Cancel
                  </button>
                  <button className="btn btn--primary btn--sm" onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : 'Save changes'}
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="view"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                <h2 className="profile__name">{profile.fullName}</h2>
                <div className="profile__handle">@{profile.username}</div>
                {profile.bio && <p className="profile__bio">{profile.bio}</p>}

                <div className="profile__stats">
                  <span className="stat">{plural(posts.length, 'post')}</span>
                  <button className="stat stat--btn" onClick={() => dispatch(openConnections('followers'))}>
                    {plural(profile.followersCount, 'follower')}
                  </button>
                  <button className="stat stat--btn" onClick={() => dispatch(openConnections('following'))}>
                    {followingCount} following
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.section>

      {isMe && !editing && <Composer />}

      {postsStatus === 'loading' && <Spinner label="Loading posts" />}

      <AnimatePresence mode="popLayout" initial={false}>
        {posts.map((post) => (
          <PostCard key={post._id} post={{ ...post, isOwner: isMe }} />
        ))}
      </AnimatePresence>

      {postsStatus === 'ready' && posts.length === 0 && (
        <EmptyState title={isMe ? 'You have not posted yet' : 'No posts yet'}>
          {isMe
            ? 'Write your first post using the box above.'
            : 'This account has not posted anything.'}
        </EmptyState>
      )}

      <ConnectionsModal username={username} />
    </>
  );
}
