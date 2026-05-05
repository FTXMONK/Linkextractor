import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link2, Music, Video, Copy, Check, Loader2, Download, AlertCircle, Sparkles, Globe } from 'lucide-react';
import { GoogleGenAI } from "@google/genai";

interface MediaInfo {
  id: string;
  title: string;
  thumbnail: string;
  mp3: {
    url: string;
    size: string;
    quality: string;
  };
  mp4: {
    url: string;
    size: string;
    quality: string;
  };
}

export default function App() {
  const [url, setUrl] = React.useState('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<MediaInfo | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [copiedType, setCopiedType] = React.useState<'mp3' | 'mp4' | null>(null);

  // Initialize Gemini
  const ai = React.useMemo(() => {
    const key = (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) || "";
    return key ? new GoogleGenAI({ apiKey: key }) : null;
  }, []);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const extractMetadataWithAI = async (mediaUrl: string) => {
    if (!ai) return "Processed Media";
    try {
      const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `Extract the video title for this URL: ${mediaUrl}. Return only the title as a plain string. If you can't determine it, return "Processed Media".`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text().trim() || "Processed Media";
    } catch (err) {
      console.error("AI Title Extraction failed:", err);
      return "Processed Media";
    }
  };

  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!url) {
      setError('Please enter a media URL');
      return;
    }

    const trimmedUrl = url.trim();
    const isYoutube = getYouTubeId(trimmedUrl);
    const isValid = /^https?:\/\/.*/.test(trimmedUrl);

    if (!isValid) {
      setError('Please enter a valid URL starting with http:// or https://');
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Step 1: AI Metadata Extraction
      const title = await extractMetadataWithAI(trimmedUrl);
      
      // Step 2: Thumbnail Selection
      let thumbnail = "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&auto=format&fit=crop";
      if (isYoutube) {
        // High quality fallback
        thumbnail = `https://i.ytimg.com/vi/${isYoutube}/hqdefault.jpg`;
      }

      // Step 3: Mock Backend for download links (preserving architecture)
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${response.status}`);
      }

      const { data } = await response.json();
      
      // Merge AI Metadata with Backend structure
      setResult({
        ...data,
        title,
        thumbnail
      });
    } catch (err: any) {
      console.error("Processing error:", err);
      setError(err.message || 'Failed to process URL. The service might be temporarily busy.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyToClipboard = (text: string, type: 'mp3' | 'mp4') => {
    navigator.clipboard.writeText(text);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-[#E5E5E5] selection:bg-indigo-500/30 relative overflow-x-hidden">
      {/* Background Subtle Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-900/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-900/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0A0A0A]/80 backdrop-blur-md border-b border-white/5 h-20">
        <div className="max-w-7xl mx-auto px-12 h-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Download className="text-white w-5 h-5" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white uppercase italic">Link Extractor</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/60">
            <a href="#" className="hover:text-white transition-colors">Converter</a>
            <a href="#" className="hover:text-white transition-colors">API Docs</a>
            <a href="#" className="hover:text-white transition-colors">Status</a>
          </nav>
        </div>
      </header>

      <main className="pt-32 pb-20 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-12 relative z-10">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-semibold text-white mb-4 tracking-tight leading-tight"
            >
              High-fidelity media processing.
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-white/40 text-lg mb-8 max-w-xl mx-auto"
            >
              Convert any media URL to production-ready MP3 or MP4 instantly.
            </motion.p>
          </div>

          {/* Input Form */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12 relative z-10"
          >
            <form onSubmit={handleProcess} className="relative flex p-1.5 bg-white/5 rounded-2xl border border-white/10 shadow-2xl focus-within:border-indigo-500/50 transition-all">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste your media URL here..."
                className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-white/20 px-6 py-4 text-base"
              />
              <button
                type="submit"
                disabled={isProcessing}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-900/20 active:scale-95 transition-transform disabled:bg-indigo-400 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isProcessing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Process URL'
                )}
              </button>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 flex items-center gap-2 text-red-500 text-sm font-medium pl-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </motion.div>

          {/* Features Section - Only show when no result */}
          {!result && !isProcessing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="grid md:grid-cols-3 gap-8 mt-24 relative z-10"
            >
              <div className="text-center p-6 group">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-indigo-500/30 group-hover:bg-indigo-500/10 transition-all">
                  <Music className="text-indigo-400 w-6 h-6" />
                </div>
                <h4 className="font-bold mb-2 text-white">High Quality</h4>
                <p className="text-sm text-white/40 text-pretty">Extract audio at the highest available bitrate up to 320kbps.</p>
              </div>
              <div className="text-center p-6 group">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-purple-500/30 group-hover:bg-purple-500/10 transition-all">
                  <Video className="text-purple-400 w-6 h-6" />
                </div>
                <h4 className="font-bold mb-2 text-white">Full HD Ready</h4>
                <p className="text-sm text-white/40 text-pretty">Download videos in 1080p or the best quality provided.</p>
              </div>
              <div className="text-center p-6 group">
                <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:border-emerald-500/30 group-hover:bg-emerald-500/10 transition-all">
                  <Check className="text-emerald-400 w-6 h-6" />
                </div>
                <h4 className="font-bold mb-2 text-white">Safe & Simple</h4>
                <p className="text-sm text-white/40 text-pretty">No popups, no registration, no hidden trackers. Just your media.</p>
              </div>
            </motion.div>
          )}

          {/* Processing State */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center p-12 bg-white/5 rounded-3xl border border-white/10 relative z-10"
              >
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mb-4">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
                <h3 className="text-xl font-semibold text-white mb-2">Processing your media</h3>
                <p className="text-white/30">This usually takes a few seconds...</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results Section */}
          <AnimatePresence>
            {result && !isProcessing && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6 relative z-10"
              >
                {/* Media Metadata Card */}
                <div className="bg-[#111111] p-4 rounded-2xl border border-white/10 flex items-center gap-4 shadow-xl">
                  <img 
                    src={result.thumbnail} 
                    alt={result.title}
                    className="w-20 h-20 rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all"
                  />
                  <div>
                    <h3 className="font-bold text-white text-lg">{result.title}</h3>
                    <p className="text-sm text-white/30 font-mono truncate max-w-[250px] md:max-w-md">{url}</p>
                  </div>
                </div>

                {/* Processing Cards Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* MP3 Card */}
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-[#111111] border border-white/10 p-6 rounded-2xl hover:bg-[#141414] transition-all relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                        <Music className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 bg-indigo-400/10 px-2 py-1 rounded">Audio MP3</span>
                    </div>
                    <div className="mb-8">
                      <h4 className="text-xl font-medium text-white mb-1 truncate">{result.title}</h4>
                      <p className="text-xs text-white/30">{result.mp3.quality} • {result.mp3.size} • High Quality</p>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={result.mp3.url}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        Download
                      </a>
                      <button 
                        onClick={() => copyToClipboard(result.mp3.url, 'mp3')}
                        className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
                      >
                        {copiedType === 'mp3' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 opacity-60" />
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* MP4 Card */}
                  <motion.div 
                    whileHover={{ y: -4 }}
                    className="bg-[#111111] border border-white/10 p-6 rounded-2xl hover:bg-[#141414] transition-all relative overflow-hidden group"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-purple-500/10 rounded-xl text-purple-400">
                        <Video className="w-6 h-6" />
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-purple-400 bg-purple-400/10 px-2 py-1 rounded">Video MP4</span>
                    </div>
                    <div className="mb-8">
                      <h4 className="text-xl font-medium text-white mb-1 truncate">{result.title}</h4>
                      <p className="text-xs text-white/30">{result.mp4.quality} • {result.mp4.size} • H.264</p>
                    </div>
                    <div className="flex gap-2">
                      <a 
                        href={result.mp4.url}
                        className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white py-2.5 rounded-lg text-sm font-medium transition-colors text-center"
                      >
                        Download
                      </a>
                      <button 
                        onClick={() => copyToClipboard(result.mp4.url, 'mp4')}
                        className="px-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-lg transition-colors"
                      >
                        {copiedType === 'mp4' ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 opacity-60" />
                        )}
                      </button>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <footer className="h-16 flex items-center justify-between px-12 border-t border-white/5 text-[11px] font-medium text-white/30 relative z-10 mt-20">
        <div className="flex items-center gap-4">
          <span>&copy; 2026 Link Extractor Cloud</span>
          <span className="w-1 h-1 bg-white/10 rounded-full"></span>
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-emerald-500/60"></span>
          <span>Systems Operational</span>
        </div>
      </footer>
    </div>
  );
}
