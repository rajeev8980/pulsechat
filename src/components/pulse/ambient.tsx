export function AmbientGlow() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      <div className="absolute -top-32 -left-32 w-[520px] h-[520px] bg-indigo-600/20 rounded-full blur-[140px] animate-pulse-slow" />
      <div
        className="absolute top-1/3 -right-32 w-[480px] h-[480px] bg-fuchsia-600/15 rounded-full blur-[150px] animate-pulse-slow"
        style={{ animationDelay: "2.5s" }}
      />
      <div
        className="absolute -bottom-32 left-1/4 w-[560px] h-[560px] bg-cyan-600/15 rounded-full blur-[160px] animate-pulse-slow"
        style={{ animationDelay: "4.5s" }}
      />
    </div>
  );
}
