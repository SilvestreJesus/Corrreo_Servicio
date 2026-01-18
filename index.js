const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch'); // Asegúrate de tenerlo o usa el global si es Node 18+

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/enviar-correo', async (req, res) => {
    // Ahora solo recibimos el HTML ya armado desde PHP
    const { emails, asunto, htmlContent, imagen } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlContent // Recibimos el HTML final
        };

        // Si Laravel envía una imagen base64 para adjuntar
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "foto.png",
                contentId: "foto_promo"
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
app.listen(PORT, () => console.log(`Puente de correos activo en puerto ${PORT}`));