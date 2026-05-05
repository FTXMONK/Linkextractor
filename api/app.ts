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
      'https://cobalt.ayaya.one/api/json'
    ];

    let data = null;
    let lastError = null;

    for (const api of instances) {
      try {
        const cobaltResponse = await fetch(api, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            url: url,
            videoQuality: '1080',
            filenameStyle: 'basic',
            downloadMode: 'auto'
          })
        });

        if (cobaltResponse.ok) {
          data = await cobaltResponse.json();
          if (data.status === 'stream' || data.status === 'success' || data.status === 'redirect') {
            break;
          }
        }
      } catch (e) {
        lastError = e;
        continue;
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
