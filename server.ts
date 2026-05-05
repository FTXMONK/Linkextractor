import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Process URL
  app.post('/api/process', async (req, res) => {
    const { url } = req.body;
    console.log(`[API] Processing request for URL: ${url}`);

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Mock processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate mock results
    const id = Math.random().toString(36).substring(7);
    res.json({
      success: true,
      data: {
        id,
        title: "Extracted Media",
        thumbnail: "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=250&auto=format&fit=crop",
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

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Error starting server:', err);
});
