export default function CapsuleHeader({
  capsuleName,
  id,
}: {
  capsuleName: string;
  id: string;
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 p-10 text-white">
      <div className="absolute -right-20 -top-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />
      <div className="absolute -left-20 -bottom-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" />

      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div>
          <p className="text-white/80 font-bold mb-2">
            Smart File Transfer
          </p>

          <h2 className="text-5xl font-black mb-3">
            📦 {capsuleName}
          </h2>

          <p className="text-white/80 max-w-2xl">
            A private file link for sharing files securely with QR, instant
            sharing, preview, and download controls.
          </p>
        </div>

        <a
          href={`/api/download-folder?id=${id}`}
          className="bg-white text-blue-700 px-8 py-5 rounded-3xl font-black shadow-xl text-center"
        >
          ⬇ Download All
        </a>
      </div>
    </div>
  );
}