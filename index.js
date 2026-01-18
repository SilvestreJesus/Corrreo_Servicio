const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();

app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentamos el límite para imágenes base64 pesadas
app.use(express.json({ limit: '50mb' }));

// CONFIGURACIÓN DE GMAIL 
// Recomendación: Usa Puerto 465 si el 587 falla en Railway
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465, 
    secure: true, // true para 465, false para otros
    auth: {
        user: "22690406@tecvalles.mx",
        pass: "tkqx spuw rcsi qpcn" 
    },
    tls: {
        rejectUnauthorized: false
    }
});

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    // Procesar adjunto
    let attachments = [];
    if (imagen && imagen.includes("base64,")) {
        attachments.push({
            filename: 'promocion_factorfit.png',
            content: imagen.split("base64,")[1],
            encoding: 'base64'
        });
    }

    try {
        console.log(`Iniciando envío de ${emails.length} correos...`);

        // NO USAR Promise.all para envíos masivos en Gmail. 
        // Es mejor enviarlos en serie o pequeños lotes para evitar que Gmail te marque como SPAM.
        for (const email of emails) {
            await transporter.sendMail({
                from: '"Factor Fit" <22690406@tecvalles.mx>',
                to: email,
                subject: asunto,
                html: `
                    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #db2777;">Factor Fit</h2>
                        <div style="font-size: 16px; line-height: 1.6;">
                            ${mensaje.replace(/\n/g, '<br>')}
                        </div>
                        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #999;">Este es un correo automático, por favor no respondas.</p>
                    </div>
                `,
                attachments: attachments
            });
            // Espera medio segundo entre correos para no saturar a Gmail
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        res.json({ success: true, message: `Enviados ${emails.length} correos.` });
    } catch (error) {
        console.error("Error detallado:", error);
        res.status(500).json({ error: "Error al enviar: " + error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Servidor de correos en puerto ${PORT}`);
});