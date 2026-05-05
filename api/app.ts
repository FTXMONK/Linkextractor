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
    // Media processing using Cobalt API (reliable and handles various sources)
    const cobaltResponse = await fetch('https://api.cobalt.tools/api/json', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        videoQuality: '720',
        filenameStyle: 'basic'
      })
    });

    if (cobaltResponse.ok) {
      const data = await cobaltResponse.json();
      
      // If cobalt returns a stream or link
      if (data.status === 'stream' || data.status === 'success' || data.status === 'redirect') {
        return res.json({
          success: true,
          data: {
            id: Math.random().toString(36).substring(7),
            title: "Extracted Media", // Frontend AI will override this
            thumbnail,
            mp3: {
              url: data.url, // Usually cobalt returns the best matching for the request
              size: "Unknown",
              quality: "High"
            },
            mp4: {
              url: data.url,
              size: "Unknown",
              quality: "720p"
            }
          }
        });
      }
    }

    // Fallback if Cobalt fails
    const id = Math.random().toString(36).substring(7);
    res.json({
      success: true,
      data: {
        id,
        title: "Extracted Media",
        thumbnail,
        mp3: {
          url: `https://yt-download.org/api/button/mp3/${ytId || 'default'}`,
          size: "Variable",
          quality: "320kbps"
        },
        mp4: {
          url: `https://yt-download.org/api/button/videos/${ytId || 'default'}`,
          size: "Variable",
          quality: "HD"
        }
      }
    });
  } catch (error) {
    console.error("Processing API Error:", error);
    res.status(500).json({ error: "Media processing server is unavailable" });
  }
});

// Catch-all for API 404s
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

export default app;
