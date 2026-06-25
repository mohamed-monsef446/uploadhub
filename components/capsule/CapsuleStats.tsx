export default function CapsuleStats({
  filesCount,
  totalSize,
  capsuleId,
}: {
  filesCount: number;
  totalSize: string;
  capsuleId: string;
}) {
  return (
    <div className="grid md:grid-cols-4 gap-5 mb-8">
      <div className="bg-slate-50 border rounded-3xl p-6">
        <p className="text-slate-500 font-bold">Files</p>
        <h3 className="text-4xl font-black mt-2">{filesCount}</h3>
      </div>

      <div className="bg-slate-50 border rounded-3xl p-6">
        <p className="text-slate-500 font-bold">Total Size</p>
        <h3 className="text-4xl font-black mt-2">{totalSize}</h3>
      </div>

      <div className="bg-green-50 border border-green-200 rounded-3xl p-6">
        <p className="text-green-700 font-bold">Security</p>
        <h3 className="text-2xl font-black mt-3 text-green-700">Private</h3>
      </div>

      <div className="bg-purple-50 border border-purple-200 rounded-3xl p-6">
        <p className="text-purple-700 font-bold">Capsule ID</p>
        <h3 className="text-xl font-black mt-4 text-purple-700">
          #{capsuleId.slice(-6)}
        </h3>
      </div>
    </div>
  );
}