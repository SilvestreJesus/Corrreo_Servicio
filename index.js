const express = require('express');
const cors = require('cors');

const app = express();

// Configuración de CORS
app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentar el límite para recibir imágenes en Base64
app.use(express.json({ limit: '50mb' }));

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen, tipo, sede, htmlDirecto } = req.body;

    try {
        let htmlFinal = "";

        // Si viene HTML desde Laravel, lo usamos directamente
        if (tipo === 'html_puro' || htmlDirecto) {
            htmlFinal = htmlDirecto;
        } 
        else {
            // Diseño de respaldo por si no viene de Laravel
            const imagenHtml = (imagen) 
                ? `<div style="margin-top: 20px; text-align: center;">
                    <img src="cid:foto_promo" style="max-width: 100%; border-radius: 10px; display: block; margin: 0 auto;">
                   </div>` : "";

            htmlFinal = `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; font-family: sans-serif; border-radius: 15px; overflow: hidden;">
                <div style="background: #111827; padding: 20px; text-align: center;"><span style="color: white; font-size: 20px; font-weight: bold;">FACTOR FIT</span></div>
                <div style="padding: 30px; background: white;">
                    <p style="color: #374151;">${mensaje ? mensaje.replace(/\n/g, '<br>') : ''}</p>
                    ${imagenHtml} 
                </div>
            </div>`;
        }

        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlFinal
        };

        // --- ADJUNTO INTERNO (La clave para el cuadro blanco) ---
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "promocion.png",
                contentId: "foto_promo" // DEBE ser igual al src="cid:foto_promo" del HTML
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
app.listen(PORT, () => console.log(`Servidor de correos activo en puerto ${PORT}`));