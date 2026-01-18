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
    const { 
        emails, 
        asunto, 
        mensaje, 
        imagen, 
        nombres, 
        password, 
        tipo, 
        sede, 
        htmlDirecto // Recibe el HTML ya diseñado en PHP
    } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        let htmlFinal = "";

        // CASO 1: PRIORIDAD - Si Laravel envía el diseño listo desde PHP
        if (tipo === 'html_puro' || htmlDirecto) {
            htmlFinal = htmlDirecto;
        } 
        
        // CASO 2: PLANTILLA DE CONTRASEÑA (Respaldo si no viene htmlDirecto)
        else if (tipo === 'password') {
            htmlFinal = `
            <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden;">
                <div style="background: #1e1b4b; padding: 30px; text-align: center;">
                    <h1 style="color: #ddd6fe; margin: 0; letter-spacing: 2px;">FACTOR FIT</h1>
                </div>
                <div style="padding: 40px; background: white; color: #374151;">
                    <h2 style="color: #1e1b4b;">Hola, ${nombres || 'Usuario'}</h2>
                    <p style="line-height: 1.6;">${mensaje}</p>
                    <div style="background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; margin: 25px 0;">
                        <span style="display: block; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 5px;">Contraseña Temporal</span>
                        <span style="font-size: 24px; font-weight: bold; color: #7c3aed; letter-spacing: 2px;">${password}</span>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">Te recomendamos iniciar sesión y cambiar esta contraseña desde tu perfil inmediatamente por motivos de seguridad.</p>
                    <div style="text-align: center;">
                        <a href="https://factorfit.vercel.app" style="display: inline-block; background: #7c3aed; color: white; padding: 15px 30px; text-decoration: none; border-radius: 12px; font-weight: bold; margin-top: 20px;">Ir al Login</a>
                    </div>
                </div>
            </div>`;
        }
        
        // CASO 3: PLANTILLA INFORMATIVA / PROMOCIONAL (Respaldo)
        else {
            const imagenHtml = (imagen && imagen.includes("base64,")) 
                ? `<div style="margin-top: 25px; text-align: center;">
                    <img src="cid:foto_promo" alt="Factor Fit News" style="max-width: 100%; height: auto; border-radius: 15px; display: block; margin: 0 auto; border: 1px solid #eee;">
                </div>` 
                : "";

            htmlFinal = `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; font-family: sans-serif;">
                <div style="background: #111827; padding: 20px; text-align: center;">
                    <span style="color: white; font-size: 20px; font-weight: bold; letter-spacing: 2px;">FACTOR FIT</span>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                        ${mensaje ? mensaje.replace(/\n/g, '<br>') : ''}
                    </p>
                    ${imagenHtml}
                </div>
                <div style="padding: 20px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee;">
                    © 2026 Factor Fit System | Sede: ${sede || 'General'}<br>
                    Este es un correo informativo, por favor no respondas a este mensaje.
                </div>
            </div>`;
        }

        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlFinal
        };

        // Adjuntar imagen solo si existe y no es el caso de HTML Puro (donde las imágenes suelen ser URLs externas)
        if (imagen && imagen.includes("base64,") && tipo !== 'html_puro') {
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
        console.error("Error enviando correo:", error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor de correos activo en puerto ${PORT}`));