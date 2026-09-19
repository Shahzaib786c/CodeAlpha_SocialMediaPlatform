import { avatarColor, initials } from '../utils/format';

const SIZES = { sm: 32, md: 40, lg: 78 };

/**
 * Shows the uploaded image if there is one, otherwise coloured initials.
 * object-fit: cover keeps non-square uploads from being letterboxed.
 */
export default function Avatar({ user, size = 'md' }) {
  const px = SIZES[size] || SIZES.md;
  const radius = size === 'lg' ? 22 : size === 'sm' ? 10 : 12;

  const style = {
    width: px,
    height: px,
    borderRadius: radius,
    fontSize: size === 'lg' ? 30 : size === 'sm' ? 13 : 15,
    background: user?.avatar ? '#EDEDF5' : avatarColor(user?.username),
  };

  return (
    <div className="avatar" style={style}>
      {user?.avatar ? (
        <img src={user.avatar} alt={user.fullName} loading="lazy" />
      ) : (
        initials(user?.fullName)
      )}
    </div>
  );
}
