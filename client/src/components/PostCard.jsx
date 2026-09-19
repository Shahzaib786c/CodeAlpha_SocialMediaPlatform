import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from './Avatar';
import Comments from './Comments';
import { toggleLike, deletePost, toggleThread } from '../features/posts/postsSlice';
import { toggleFollow } from '../features/users/usersSlice';
import { pushToast } from '../features/ui/uiSlice';
import { timeAgo, formatCount } from '../utils/format';

const HeartIcon = ({ filled }) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.8">
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21l7.7-7.6 1.1-1a5.5 5.5 0 0 0 0-7.8z" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8">
    <path d="M21 11.5a8.4 8.4 0 0 1-9 8.4 8.9 8.9 0 0 1-4-.9L3 21l1.9-5a8.4 8.4 0 0 1 3.7-11.3 8.9 8.9 0 0 1 4-.9 8.4 8.4 0 0 1 8.4 8.4z" />
  </svg>
);

export default function PostCard({ post, showFollow = false }) {
  const dispatch = useDispatch();
  const open = useSelector((s) => s.posts.openThreads[post._id]);
  const author = post.author;

  const onLike = async () => {
    const result = await dispatch(toggleLike(post._id));
    if (toggleLike.rejected.match(result)) {
      dispatch(pushToast(result.payload || 'Could not update like', 'error'));
    }
  };

  const onDelete = async () => {
    if (!window.confirm('Delete this post? Its comments are removed too.')) return;
    const result = await dispatch(deletePost(post._id));
    if (deletePost.fulfilled.match(result)) dispatch(pushToast('Post deleted'));
    else dispatch(pushToast(result.payload || 'Could not delete post', 'error'));
  };

  const onFollow = () => dispatch(toggleFollow(author._id));

  return (
    <motion.article
      className="post"
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
    >
      <header className="post__head">
        <Link to={`/profile/${author.username}`}>
          <Avatar user={author} />
        </Link>
        <div className="post__ident">
          <Link to={`/profile/${author.username}`} className="post__name">
            {author.fullName}
          </Link>
          <div className="post__meta">
            @{author.username} · {timeAgo(post.createdAt)}
          </div>
        </div>
        {showFollow && !post.isOwner && (
          <button className="btn btn--outline btn--sm post__follow" onClick={onFollow}>
            Follow
          </button>
        )}
      </header>

      <p className="post__body">{post.content}</p>

      {post.image && (
        <img
          className="post__img"
          src={post.image}
          alt=""
          loading="lazy"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      )}

      <div className="post__actions">
        <motion.button
          className={`action action--like ${post.isLiked ? 'is-on' : ''}`}
          onClick={onLike}
          whileTap={{ scale: 0.88 }}
          aria-pressed={post.isLiked}
          aria-label={post.isLiked ? 'Unlike' : 'Like'}
        >
          <motion.span
            key={String(post.isLiked)}
            initial={{ scale: post.isLiked ? 0.6 : 1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 600, damping: 14 }}
            style={{ display: 'inline-flex' }}
          >
            <HeartIcon filled={post.isLiked} />
          </motion.span>
          <span>{formatCount(post.likesCount)}</span>
        </motion.button>

        <button
          className={`action ${open ? 'is-open' : ''}`}
          onClick={() => dispatch(toggleThread(post._id))}
        >
          <ChatIcon />
          <span>{formatCount(post.commentCount)}</span>
        </button>

        {post.isOwner && (
          <button className="action action--del" onClick={onDelete}>
            Delete
          </button>
        )}
      </div>

      <AnimatePresence initial={false}>{open && <Comments postId={post._id} />}</AnimatePresence>
    </motion.article>
  );
}
