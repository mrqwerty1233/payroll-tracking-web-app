export default function LoadingMessage({ message = "Loading..." }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">{message}</p>
    </div>
  );
}