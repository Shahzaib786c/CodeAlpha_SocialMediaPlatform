import { useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AnimatePresence, motion } from 'framer-motion';
import Avatar from './Avatar';
import { createPost } from '../features/posts/postsSlice';
import { pushToast } from '../features/ui/uiSlice';
import { api } from '../api/client';

const MAX = 500;
const CIRC = 2 * Math.PI * 10;

export default function Composer() {
  const dispatch = useDispatch();
  const me = useSelector((s) => s.auth.user);

  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const fileRef = useRef(null);
  const textRef = useRef(null);

  const ratio = Math.min(text.length / MAX, 1);
  const nearLimit = text.length > MAX * 0.9;

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      dispatch(pushToast('Image must be smaller than 5 MB', 'error'));
      return;
    }

    setUploading(true);
    try {
      const url = await api.uploadImage(file, 'post');
      setImageUrl(url);
    } catch (err) {
      dispatch(pushToast(err.message, 'error'));
    } finally {
      setUploading(false);
      e.target.value = ''; // lets the same file be picked again
    }
  };

  const submit = async () => {
    if (!text.trim() || posting) return;
    setPosting(true);
    const result = await dispatch(createPost({ content: text, image: imageUrl }));
    if (createPost.fulfilled.match(result)) {
      setText('');
      setImageUrl('');
      if (textRef.current) textRef.current.style.height = 'auto';
      dispatch(pushToast('Posted'));
    } else {
      dispatch(pushToast(result.payload || 'Could not post', 'error'));
    }
    setPosting(false);
  };

  const grow = (el) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  return (
    <motion.div className="composer" layout initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
      <div className="composer__row">
        <Avatar user={me} />
        <textarea
          ref={textRef}
          value={text}
          maxLength={MAX}
          placeholder="What's happening?"
          onChange={(e) => {
            setText(e.target.value);
            grow(e.target);
          }}
        />
      </div>

      <AnimatePresence>
        {imageUrl && (
          <motion.div
            className="composer__preview"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <img src={imageUrl} alt="Attached" />
            <button className="composer__remove" onClick={() => setImageUrl('')} title="Remove image">
              ×
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="composer__foot">
        <input
          ref={fileRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/gif"
          hidden
          onChange={pickFile}
        />
        <button
          className="btn btn--ghost btn--sm"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? 'Uploading…' : imageUrl ? 'Change photo' : 'Add photo'}
        </button>

        <div className="composer__right">
          <svg className={`ring ${nearLimit ? 'ring--warn' : ''}`} width="26" height="26" viewBox="0 0 26 26">
            <circle className="ring__track" cx="13" cy="13" r="10" />
            <motion.circle
              className="ring__value"
              cx="13"
              cy="13"
              r="10"
              strokeDasharray={CIRC}
              animate={{ strokeDashoffset: CIRC * (1 - ratio) }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </svg>
          <button className="btn btn--primary" onClick={submit} disabled={!text.trim() || posting}>
            {posting ? 'Posting…' : 'Post'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
