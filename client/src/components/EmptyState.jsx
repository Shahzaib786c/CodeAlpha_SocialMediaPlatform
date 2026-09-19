import { motion } from 'framer-motion';

export default function EmptyState({ title, children, action }) {
  return (
    <motion.div
      className="empty"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <b>{title}</b>
      <p>{children}</p>
      {action}
    </motion.div>
  );
}
