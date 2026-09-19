import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import Composer from '../components/Composer';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { fetchFeed } from '../features/posts/postsSlice';

export default function FeedPage() {
  const dispatch = useDispatch();
  const posts = useSelector((s) => s.posts.feed);
  const status = useSelector((s) => s.posts.status.feed);

  useEffect(() => {
    dispatch(fetchFeed());
  }, [dispatch]);

  return (
    <>
      <Composer />

      {status === 'loading' && posts.length === 0 && <Spinner label="Loading your feed" />}

      <AnimatePresence mode="popLayout" initial={false}>
        {posts.map((post) => (
          <PostCard key={post._id} post={post} />
        ))}
      </AnimatePresence>

      {status === 'ready' && posts.length === 0 && (
        <EmptyState
          title="Your feed is quiet"
          action={
            <Link to="/explore" className="btn btn--primary btn--sm">
              Find people to follow
            </Link>
          }
        >
          Posts from people you follow show up here. Your own posts appear too.
        </EmptyState>
      )}
    </>
  );
}
