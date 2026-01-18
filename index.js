const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

// CONFIGURACIÓN DE GMAIL (Puerto 587 es más estable en Railway)
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // TLS
    auth: {
        user: "22690406@tecvalles.mx",
        pass: "tkqx spuw rcsi qpcn" 
    },
    tls: {
        rejectUnauthorized: false
    }
});

app.get('/', (req, res) => {
    res.send("Servidor de Correos Masivos Factor Fit - Operativo");
});

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    // Preparamos el adjunto si existe
    const attachments = imagen ? [{
        filename: 'promocion_factorfit.png',
        content: imagen.split("base64,")[1],
        encoding: 'base64'
    }] : [];

    try {
        // ENVIAR POR SEPARADO (Para evitar que los clientes vean los correos de otros)
        const promesas = emails.map(email => {
            return transporter.sendMail({
                from: '"Factor Fit" <22690406@tecvalles.mx>',
                to: email,
                subject: asunto,
                html: `<div style="font-family: sans-serif;">${mensaje.replace(/\n/g, '<br>')}</div>`,
                attachments: attachments
            });
        });

        await Promise.all(promesas);
        console.log(`Enviados con éxito ${emails.length} correos.`);
        res.json({ success: true, message: `Enviados ${emails.length} correos correctamente.` });

    } catch (error) {
        console.error("Error en envío masivo:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080; // Usamos el que Railway prefiera
app.listen(PORT, () => {
    console.log(`Servidor de correos en puerto ${PORT}`);
});