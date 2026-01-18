const express = require('express');
const cors = require('cors');
const { Resend } = require('resend');

const app = express();
// Usamos tu API Key de Resend
const resend = new Resend('re_i28U7R5r_95UjxsL3FGoYFh2hRBqid8jt');

// Configuración de CORS
app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Límite de 50MB para fotos
app.use(express.json({ limit: '50mb' }));

// Ruta de prueba
app.get('/', (req, res) => {
    res.send("Servidor de Correos (API RESEND) - Operativo");
});

// Ruta principal de envío
app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen } = req.body;

    try {
        const data = await resend.emails.send({
            from: 'Factor Fit <onboarding@resend.dev>',
            to: emails, 
            subject: asunto,
            html: `<div style="font-family: sans-serif;">${mensaje.replace(/\n/g, '<br>')}</div>`,
            attachments: imagen ? [
                {
                    filename: 'promocion.png',
                    content: imagen.split("base64,")[1],
                }
            ] : []
        });

        console.log("Éxito:", data);
        res.json({ success: true, id: data.id });
    } catch (error) {
        console.error("Error en Resend:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor de correos en puerto ${PORT}`);
});