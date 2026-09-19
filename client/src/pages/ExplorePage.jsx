import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence } from 'framer-motion';
import PostCard from '../components/PostCard';
import EmptyState from '../components/EmptyState';
import Spinner from '../components/Spinner';
import { fetchExplore } from '../features/posts/postsSlice';

/**
 * Explore deliberately shows only people you DON'T follow yet.
 * Following someone here removes their posts from this list and
 * moves them into your Home feed, so the two pages never duplicate.
 */
export default function ExplorePage() {
  const dispatch = useDispatch();
  const posts = useSelector((s) => s.posts.explore);
  const status = useSelector((s) => s.posts.status.explore);

  useEffect(() => {
    dispatch(fetchExplore());
  }, [dispatch]);

  return (
    <>
      <div className="pagehead">
        <h2 className="heading">Explore</h2>
        <p className="subheading">Posts from people you don’t follow yet.</p>
      </div>

      {status === 'loading' && posts.length === 0 && <Spinner label="Finding new people" />}

      <AnimatePresence mode="popLayout" initial={false}>
        {posts.map((post) => (
          <PostCard key={post._id} post={post} showFollow />
        ))}
      </AnimatePresence>

      {status === 'ready' && posts.length === 0 && (
        <EmptyState title="Nothing new to discover">
          You already follow everyone who has posted. Check your Home feed instead.
        </EmptyState>
      )}
    </>
  );
}
