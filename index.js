const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen, nombres, password, tipo, sede } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        let htmlFinal = "";

        // PLANTILLA 1: CORREO INFORMATIVO / PROMOCIONAL
        if (tipo === 'promocion' || !tipo) {
            
        }
        
        // PLANTILLA 2: CONTRASEÑA TEMPORAL (Actualizada con tu diseño)
        else if (tipo === 'password') {
           
        }

        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlFinal
        };

        // CORRECCIÓN DE IMAGEN: Solo adjuntar si existe y es promoción
        if (imagen && imagen.includes("base64,") && (tipo === 'promocion' || !tipo)) {
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
app.listen(PORT, () => console.log(`Servidor con estilos en puerto ${PORT}`));