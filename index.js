const express = require('express');
const cors = require('cors');

const app = express();

// Configuración de CORS para producción y local
app.use(cors({
    origin: ['https://factorfit.vercel.app', 'http://localhost:4200'],
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Aumentamos el límite para recibir imágenes en Base64
app.use(express.json({ limit: '50mb' }));

const BREVO_API_KEY = process.env.BREVO_API_KEY;

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen, nombres, password, tipo, sede } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        let htmlFinal = "";

        // PLANTILLA 1: CORREO INFORMATIVO / PROMOCIONAL / COBRANZA
        if (tipo === 'promocion' || !tipo) {
            // Solo incluimos el tag de imagen si realmente se envió una
            const imagenHtml = (imagen && imagen.includes("base64,")) 
                ? `<div style="margin-top: 25px; text-align: center;">
                    <img src="cid:foto_promo" alt="Factor Fit News" style="max-width: 100%; height: auto; border-radius: 15px; display: block; margin: 0 auto; border: 1px solid #eee;">
                   </div>` 
                : "";

            htmlFinal = `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; font-family: sans-serif; border-radius: 10px; overflow: hidden;">
                <div style="background: #111827; padding: 25px; text-align: center;">
                    <span style="color: white; font-size: 22px; font-weight: bold; letter-spacing: 3px;">FACTOR FIT</span>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; white-space: pre-line;">
                        ${mensaje.replace(/\n/g, '<br>')}
                    </p>
                    ${imagenHtml}
                </div>
                <div style="padding: 20px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee;">
                    © 2026 Factor Fit System | Sede: ${sede || 'General'}<br>
                    Este es un correo automático de información comercial.
                </div>
            </div>`;
        } 
        
        // PLANTILLA 2: CONTRASEÑA TEMPORAL
        else if (tipo === 'password') {
            htmlFinal = `
            <div style="max-width: 600px; margin: 0 auto; font-family: sans-serif; border: 1px solid #e5e7eb; border-radius: 20px; overflow: hidden;">
                <div style="background: #1e1b4b; padding: 30px; text-align: center;">
                    <h1 style="color: #ddd6fe; margin: 0; letter-spacing: 2px;">FACTOR FIT</h1>
                </div>
                <div style="padding: 40px; background: white; color: #374151;">
                    <h2 style="color: #1e1b4b;">Hola, ${nombres || 'Usuario'}</h2>
                    <p style="font-size: 16px;">${mensaje}</p>
                    <div style="background: #f3f4f6; padding: 25px; border-radius: 15px; text-align: center; margin: 25px 0; border: 1px dashed #7c3aed;">
                        <span style="display: block; font-size: 12px; color: #9ca3af; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">Tu nueva Contraseña Temporal</span>
                        <span style="font-size: 28px; font-weight: bold; color: #7c3aed; letter-spacing: 4px;">${password}</span>
                    </div>
                    <p style="font-size: 14px; color: #6b7280; text-align: center;">Por seguridad, cámbiala en cuanto inicies sesión.</p>
                    <div style="text-align: center; margin-top: 30px;">
                        <a href="https://factorfit.vercel.app" style="display: inline-block; background: #7c3aed; color: white; padding: 15px 35px; text-decoration: none; border-radius: 12px; font-weight: bold;">Acceder a mi Cuenta</a>
                    </div>
                </div>
            </div>`;
        }

        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlFinal
        };

        // CORRECCIÓN CLAVE: Usamos 'inline' para que la imagen se inserte en el cuerpo (cid)
        if (imagen && imagen.includes("base64,")) {
            emailPayload.inline = [{
                content: imagen.split("base64,")[1],
                name: "promo_image.png",
                contentId: "foto_promo" // DEBE COINCIDIR CON <img src="cid:foto_promo">
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
        if (!response.ok) throw new Error(result.message || "Error en Brevo");

        res.json({ success: true, message: "Correo con diseño profesional enviado" });

    } catch (error) {
        console.error("Error en servidor:", error.message);
        res.status(500).json({ error: error.message });
    }
});

// El puerto debe ser dinámico para Railway
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Servidor de Correos Factor Fit activo en puerto ${PORT}`));