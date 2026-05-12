const express = require('express');
const axios = require('axios');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

app.get('/', async (req, res) => {
    try {
        const response = await axios.get(BACKEND_URL);
        res.send(`
            <html>
                <head>
                    <title>Cloud-Native DevOps Project</title>
                    <style>
                        body { font-family: Arial, sans-serif; background-color: #f4f4f9; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                        .container { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; }
                        h1 { color: #333; }
                        pre { background: #eee; padding: 1rem; border-radius: 4px; text-align: left; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>🚀 DevOps Super Project Frontend</h1>
                        <p>Frontend Host: <strong>${os.hostname()}</strong></p>
                        <h3>Data from Backend:</h3>
                        <pre>${JSON.stringify(response.data, null, 2)}</pre>
                    </div>
                </body>
            </html>
        `);
    } catch (error) {
        res.status(500).send(`
            <html>
                <body>
                    <div style="color: red;">
                        <h1>Error connecting to backend</h1>
                        <p>${error.message}</p>
                    </div>
                </body>
            </html>
        `);
    }
});

app.get('/health', (req, res) => {
    res.json({ status: 'healthy', service: 'frontend' });
});

app.listen(PORT, () => {
    console.log(\`Frontend listening on port \${PORT}\`);
});
