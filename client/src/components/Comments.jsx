import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from './Avatar';
import Spinner from './Spinner';
import { fetchComments, addComment, deleteComment } from '../features/posts/postsSlice';
import { pushToast } from '../features/ui/uiSlice';
import { timeAgo } from '../utils/format';

export default function Comments({ postId }) {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);
  const comments = useSelector((s) => s.posts.comments[postId]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!comments) dispatch(fetchComments(postId));
  }, [postId, comments, dispatch]);

  const send = async () => {
    const value = text.trim();
    if (!value || sending) return;
    setSending(true);
    const result = await dispatch(addComment({ postId, text: value }));
    if (addComment.fulfilled.match(result)) setText('');
    else dispatch(pushToast(result.payload || 'Could not post comment', 'error'));
    setSending(false);
  };

  const remove = async (commentId) => {
    const result = await dispatch(deleteComment({ postId, commentId }));
    if (deleteComment.fulfilled.match(result)) dispatch(pushToast('Comment deleted'));
  };

  return (
    <motion.div
      className="comments"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.3, 1] }}
    >
      {!comments ? (
        <Spinner label="Loading comments" />
      ) : (
        <AnimatePresence initial={false} mode="popLayout">
          {comments.map((c) => (
            <motion.div
              key={c._id}
              className="comment"
              layout
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -14 }}
              transition={{ duration: 0.2 }}
            >
              <Link to={`/profile/${c.author.username}`}>
                <Avatar user={c.author} size="sm" />
              </Link>
              <div className="comment__bubble">
                <span className="comment__name">{c.author.fullName}</span>
                <span className="comment__time">{timeAgo(c.createdAt)}</span>
                <p className="comment__text">{c.text}</p>
              </div>
              {c.isOwner && (
                <button className="comment__del" onClick={() => remove(c._id)} title="Delete">
                  Delete
                </button>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      )}

      <div className="commentform">
        <Avatar user={me} size="sm" />
        <input
          type="text"
          maxLength={300}
          placeholder="Write a comment"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="btn btn--primary btn--sm" onClick={send} disabled={!text.trim() || sending}>
          {sending ? 'Sending' : 'Send'}
        </button>
      </div>
    </motion.div>
  );
}
