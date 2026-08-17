import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Camera, Upload, Loader2, CheckCircle2, XCircle, ShieldAlert, MapPin, Sparkles } from "lucide-react";
import { api, getUser, CAT } from "@/lib/appApi";

export default function Scan() {
  const nav = useNavigate();
  const u = getUser();
  const fileRef = useRef();
  const videoRef = useRef();
  const streamRef = useRef();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const onFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => { setImage(reader.result); setResult(null); };
    reader.readAsDataURL(f);
  };
  const openCamera = async () => {
  try {
    setCameraError("");

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("Camera is not supported by this browser.");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false,
    });

    streamRef.current = stream;
    setCameraOpen(true);

    // Wait until the video element is rendered
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(() => {});
      }
    }, 0);
  } catch (error) {
    console.error("Camera error:", error);
    setCameraError(
      "Camera access was denied or unavailable. Please allow camera permission and try again."
    );
  }
};

const closeCamera = () => {
  if (streamRef.current) {
    streamRef.current.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }

  if (videoRef.current) {
    videoRef.current.srcObject = null;
  }

  setCameraOpen(false);
};

const capturePhoto = () => {
  const video = videoRef.current;

  if (!video || !video.videoWidth || !video.videoHeight) {
    setCameraError("Camera is not ready yet. Please try again.");
    return;
  }

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const context = canvas.getContext("2d");
  context.drawImage(video, 0, 0, canvas.width, canvas.height);

  const capturedImage = canvas.toDataURL("image/jpeg", 0.9);

  setImage(capturedImage);
  setResult(null);

  closeCamera();
};
  const analyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const { data } = await api.post("/scan", { user_id: u.id, image_base64: image });
      setResult(data);
      toast.success(`+${data.points} EcoPoints earned!`);
    } catch (e) {
      toast.error("Scan failed, please try again");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
  return () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };
}, []);
  const CatIcon = { Biodegradable: CheckCircle2, Recyclable: CheckCircle2, Hazardous: ShieldAlert }[result?.category] || CheckCircle2;

  return (
    <div className="px-5 pt-8 animate-in fade-in duration-500">
      <h1 className="font-head text-2xl font-extrabold text-gray-900">AI Waste Scanner</h1>
      <p className="text-gray-400 text-sm mb-5">Capture or upload a photo to identify waste</p>

      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm">
        <div className="relative rounded-2xl overflow-hidden bg-emerald-50 aspect-square flex items-center justify-center">
          {image ? (
            <>
              <img src={image} alt="waste preview" className="w-full h-full object-cover" data-testid="scan-preview-img" />
              {loading && <div className="eco-scanline" />}
              {loading && <div className="absolute inset-0 bg-emerald-900/20 flex items-center justify-center">
                <div className="bg-white/90 rounded-full px-4 py-2 flex items-center gap-2 text-sm font-semibold text-emerald-700">
                  <Sparkles className="w-4 h-4 animate-pulse" /> Analysing…
                </div>
              </div>}
            </>
          ) : (
            <div className="text-center text-emerald-400 p-8">
              <Camera className="w-12 h-12 mx-auto mb-2" />
              <p className="text-sm font-medium">No image yet</p>
            </div>
          )}
        </div>

        
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={onFile} />
        <div className="grid grid-cols-2 gap-3 mt-4">
          {cameraOpen && (
            <div className="mt-4 rounded-2xl overflow-hidden bg-black">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-square object-cover"
              />

              <div className="p-3 flex gap-2">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-full"
                >
                  📷 Capture Photo
                </button>

                <button
                  type="button"
                  onClick={closeCamera}
                  className="px-5 bg-white text-gray-700 font-semibold py-3 rounded-full"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {cameraError && (
            <p className="mt-3 text-sm text-red-600 text-center">
              {cameraError}
            </p>
          )}
          <button data-testid="scan-camera-btn" onClick={openCamera}
            className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-full hover:bg-emerald-100 transition-colors">
            <Camera className="w-4 h-4" /> Camera
          </button>
          <button data-testid="scan-upload-btn" onClick={() => fileRef.current.click()}
            className="inline-flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 font-semibold py-3 rounded-full hover:bg-emerald-100 transition-colors">
            <Upload className="w-4 h-4" /> Upload
          </button>
        </div>
        <button data-testid="scan-analyze-btn" onClick={analyze} disabled={!image || loading}
          className="w-full mt-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white font-semibold py-3.5 rounded-full transition-colors flex items-center justify-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Identify Waste
        </button>
      </div>

      {result && (
        <div data-testid="scan-result" className="mt-5 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between">
            <h2 className="font-head text-xl font-extrabold text-gray-900">{result.item}</h2>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${CAT[result.category].chip}`}>{CAT[result.category].label}</span>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.confidence}%` }} />
            </div>
            <span className="text-sm font-semibold text-emerald-600">{result.confidence}%</span>
          </div>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex items-start gap-2"><CatIcon className="w-4 h-4 text-emerald-600 mt-0.5" />
              <p><span className="font-semibold text-gray-800">Recommended bin:</span> {result.bin}</p></div>
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="font-semibold text-emerald-800 mb-1">Correct disposal</p>
              <p className="text-gray-600">{result.instructions}</p>
            </div>
            {result.do_not && <div className="flex items-start gap-2 text-red-600"><XCircle className="w-4 h-4 mt-0.5" /><p className="text-gray-600"><span className="font-semibold text-red-600">Don't: </span>{result.do_not}</p></div>}
          </div>
          <div className="mt-4 flex items-center justify-between bg-lime-50 rounded-2xl px-4 py-3">
            <span className="text-sm font-semibold text-lime-700">🌱 +{result.points} EcoPoints</span>
            {result.source === "fallback" && <span className="text-[10px] text-gray-400">demo result</span>}
          </div>
          <button data-testid="scan-find-centers-btn" onClick={() => nav(`/app/disposal?category=${result.category}`)}
            className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-full transition-colors">
            <MapPin className="w-4 h-4" /> Find Recycling Centers
          </button>
        </div>
      )}
    </div>
  );
}
