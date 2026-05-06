import express from 'express';
import cors from 'cors';

const app = express();

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// API Route: Process URL
app.post('/api/process', async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'URL is required' });

  // Simple YouTube ID extraction
  const ytId = url.match(/^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)?.[2];
  const thumbnail = ytId 
      ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg` 
      : "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&auto=format&fit=crop";

  try {
    const instances = [
      'https://api.cobalt.tools/api/json',
      'https://cobalt.shavit.xyz/api/json',
      'https://cobalt.ayaya.one/api/json',
      'https://cobalt.api.unblocked.cat/api/json',
      'https://cobalt.shavit.xyz/api/json',
      'https://co.wuk.sh/api/json'
    ];

    let data = null;
    
    // 1. Try Cobalt Instances in Parallel to avoid 504 timeouts
    const fetchWithTimeout = async (api: string, payload: any) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8s timeout for the whole parallel block
      
      try {
        const response = await fetch(api, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          body: JSON.stringify(payload),
          signal: controller.signal
        });
        clearTimeout(timeoutId);
        
        if (response.ok) {
          const resData = await response.json();
          if (resData.status === 'stream' || resData.status === 'success' || resData.status === 'redirect') {
            return resData;
          }
        }
        throw new Error('Invalid response');
      } catch (e) {
        clearTimeout(timeoutId);
        throw e;
      }
    };

    try {
      // Create a set of promises for the fastest successful response
      const strategies = instances.map(api => fetchWithTimeout(api, {
        url: url,
        videoQuality: '720',
        audioFormat: 'mp3',
        filenameStyle: 'basic'
      }));

      data = await Promise.any(strategies);
      console.log(`[API] Fastest success achieved`);
    } catch (e) {
      console.warn(`[API] All Cobalt instances failed or timed out. Trying single VKR fallback.`);
      
      // 2. Fallback to VKRDownloader if Cobalt parallel block fails
      try {
        const vkrResponse = await fetch(`https://api.vkrdownloader.com/server?v=${encodeURIComponent(url)}`, {
            signal: AbortSignal.timeout(5000)
        });
        if (vkrResponse.ok) {
          const vkrData = await vkrResponse.json();
          if (vkrData && vkrData.data && vkrData.data.downloads) {
            // Find a good download link (preferring video for now as fallback)
            const download = vkrData.data.downloads.find((d: any) => d.quality === '720p' || d.quality === '1080p') || vkrData.data.downloads[0];
            if (download) {
                return res.json({
                    success: true,
                    data: {
                        id: Math.random().toString(36).substring(7),
                        title: vkrData.data.title || "Extracted Media",
                        thumbnail: vkrData.data.thumbnail || thumbnail,
                        mp3: {
                            url: download.url, // VKR often provides direct links
                            size: download.size || "Unknown",
                            quality: "High"
                        },
                        mp4: {
                            url: download.url,
                            size: download.size || "Unknown",
                            quality: download.quality || "HD"
                        }
                    }
                });
            }
          }
        }
      } catch (e: any) {
        console.error(`[API] VKRDownloader failed:`, e.message);
      }
    }

    if (data && (data.status === 'stream' || data.status === 'success' || data.status === 'redirect')) {
      return res.json({
        success: true,
        data: {
          id: Math.random().toString(36).substring(7),
          title: "Extracted Media",
          thumbnail,
          mp3: {
            url: data.url,
            size: "Original",
            quality: "Best"
          },
          mp4: {
            url: data.url,
            size: "Original",
            quality: "1080p"
          }
        }
      });
    }

    // Fail gracefully if no reputable service works
    throw new Error('All secure processing instances are currently busy. Please try again in a few minutes.');
  } catch (error: any) {
    console.error("Processing API Error:", error);
    res.status(503).json({ error: error.message || "Media processing server is temporarily unavailable. We use secure, ad-free services only." });
  }
});

// Catch-all for API 404s
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

export default app;
