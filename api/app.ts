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

  const id = Math.random().toString(36).substring(7);
  res.json({
    success: true,
    data: {
      id,
      title: "Extracted Media", // Frontend will override with AI
      thumbnail,
      mp3: {
        url: `https://example.com/download/${id}.mp3`,
        size: "4.2 MB",
        quality: "320kbps"
      },
      mp4: {
        url: `https://example.com/download/${id}.mp4`,
        size: "24.8 MB",
        quality: "1080p"
      }
    }
  });
});

// Catch-all for API 404s
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

export default app;
