const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// REEMPLAZA ESTO CON TU API KEY DE BREVO
const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        console.log(`Iniciando envío API para ${emails.length} destinatarios...`);

        // Preparamos el adjunto si existe
        let attachment = [];
        if (imagen && imagen.includes("base64,")) {
            attachment = [{
                content: imagen.split("base64,")[1],
                name: "promocion.png"
            }];
        }

        // Enviamos usando la API de Brevo (Puerto 443 - Siempre abierto)
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY,
                'content-type': 'application/json'
            },
            body: JSON.stringify({
                sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
                to: emails.map(e => ({ email: e })),
                subject: asunto,
                htmlContent: `<div style="font-family:sans-serif;">${mensaje.replace(/\n/g, '<br>')}</div>`,
                attachment: attachment
            })
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || "Error en la API de Brevo");
        }

        console.log("Correos enviados con éxito vía API");
        res.json({ success: true, message: "Enviados correctamente" });

    } catch (error) {
        console.error("Error API Brevo:", error.message);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor API Correo en puerto ${PORT}`));