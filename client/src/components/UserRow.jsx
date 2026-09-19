import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import Avatar from './Avatar';
import { toggleFollow } from '../features/users/usersSlice';
import { pushToast } from '../features/ui/uiSlice';

/**
 * A single person in a list.
 *
 * Layout bug fix: the name column is `min-width: 0` with a block-level
 * truncating link, and the button is `flex: none`. Without both of those,
 * a long name pushes the button out of the panel — which is exactly what
 * happened with "Muhammad Shahzaib".
 */
export default function UserRow({ user, compact = false }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);

  if (!user || user._id === me?._id) return null;

  const onFollow = async () => {
    const result = await dispatch(toggleFollow(user._id));
    if (toggleFollow.rejected.match(result)) {
      dispatch(pushToast(result.payload || 'Could not update follow', 'error'));
    }
  };

  return (
    <motion.div className="userrow" layout initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Link to={`/profile/${user.username}`} className="userrow__avatar">
        <Avatar user={user} size="sm" />
      </Link>

      <div className="userrow__ident">
        <Link to={`/profile/${user.username}`} className="userrow__name">
          {user.fullName}
        </Link>
        <span className="userrow__handle">@{user.username}</span>
      </div>

      <button
        className={`btn btn--sm ${user.isFollowing ? 'btn--outline' : 'btn--primary'} userrow__btn`}
        onClick={onFollow}
      >
        {user.isFollowing ? 'Following' : 'Follow'}
      </button>
    </motion.div>
  );
}
