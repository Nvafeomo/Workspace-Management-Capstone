/** App title shown on auth screens; keep typography responsive for split layouts */
export function Heading({ className = '' }: { className?: string }) {
  return (
    <h1
      className={`text-balance font-bold tracking-tight text-indigo-600 text-4xl sm:text-5xl lg:text-6xl leading-[1.1] ${className}`}
    >
      Workspace Management System
    </h1>
  );
}
