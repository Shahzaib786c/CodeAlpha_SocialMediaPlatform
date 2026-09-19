import { UserSearch } from '../components/RightRail';

/** Mobile-only page; on desktop the same search lives in the right rail. */
export default function SearchPage() {
  return (
    <>
      <div className="pagehead">
        <h2 className="heading">Search</h2>
        <p className="subheading">Find people by name or username.</p>
      </div>
      <div className="panel">
        <UserSearch autoFocus />
      </div>
    </>
  );
}
