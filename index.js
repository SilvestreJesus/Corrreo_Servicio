const express = require('express');
const cors = require('cors');

// --- ESTO ES LO QUE FALTABA ---
const app = express(); 

app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentamos el límite para recibir el HTML y las imágenes en Base64
app.use(express.json({ limit: '50mb' }));

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/enviar-correo', async (req, res) => {
    // Recibimos el HTML ya procesado desde Laravel
    const { emails, asunto, htmlContent, imagen } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlContent 
        };

        // Si Laravel envía una imagen, la adjuntamos
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "foto.png",
                contentId: "foto_promo" // Este ID debe coincidir con el de la vista Blade
            }];
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify(emailPayload)
        });

        const result = await response.json();
        res.json({ success: true, result });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor de transporte activo en puerto ${PORT}`));