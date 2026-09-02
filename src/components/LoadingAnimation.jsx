// Lightweight branded fallback for React.lazy Suspense boundaries.
// Pure CSS (no animation lib) so it paints instantly before page chunks load.
export default function LoadingAnimation() {
  return (
    <div
      role="status"
      aria-label="Loading"
      style={{
        position: "fixed",
        inset: 0,
        display: "grid",
        placeItems: "center",
        background: "#080304",
        zIndex: 40,
      }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          border: "3px solid rgba(255,42,75,0.18)",
          borderTopColor: "#ff2a4b",
          animation: "sub-spin 0.75s linear infinite",
          boxShadow: "0 0 24px rgba(255,42,75,0.25)",
        }}
      />
      <style>{`@keyframes sub-spin{to{transform:rotate(360deg)}}@media (prefers-reduced-motion: reduce){[role=status] div{animation-duration:1.6s}}`}</style>
    </div>
  );
}
