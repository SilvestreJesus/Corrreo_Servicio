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

const BREVO_API_KEY_1 = process.env.BREVO_API_KEY_1;
const BREVO_API_KEY_2 = process.env.BREVO_API_KEY_2;

app.post('/enviar-correo', async (req, res) => {
    const { emails, asunto, mensaje, imagen, tipo, sede, htmlDirecto } = req.body;

    try {
        let htmlFinal = "";

        // CASO 1: Si viene de Laravel (Recuperación de contraseña, etc.)
        if (tipo === 'html_puro' || htmlDirecto) {
            htmlFinal = htmlDirecto;
        } 
        // CASO 2: Envío desde el Panel de Administración (Angular)
        else {
            // Preparamos el HTML de la imagen SOLO si se seleccionó una
            const imagenHtml = (imagen) 
                ? `<div style="margin-top: 25px; text-align: center;">
                    <img src="cid:imagen_adjunta" alt="Imagen adjunta" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; border: 1px solid #eee;">
                   </div>` 
                : "";

            // Construimos el diseño profesional "Cuadro Blanco"
            htmlFinal = `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; font-family: sans-serif; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
                <div style="background: #111827; padding: 20px; text-align: center;">
                    <span style="color: white; font-size: 20px; font-weight: bold; letter-spacing: 2px;">FACTOR FIT</span>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-line;">
                        ${mensaje}
                    </p>
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

        // --- ADJUNTO DINÁMICO ---
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "adjunto_factorfit.png", // Nombre genérico del archivo
                contentId: "imagen_adjunta"    // DEBE coincidir con el src="cid:imagen_adjunta"
            }];
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY_1,
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



app.post('/enviar-correo2', async (req, res) => {
    const { emails, asunto, mensaje, imagen, tipo, sede, htmlDirecto } = req.body;

    try {
        let htmlFinal = "";

        // CASO 1: Si viene de Laravel (Recuperación de contraseña, etc.)
        if (tipo === 'html_puro' || htmlDirecto) {
            htmlFinal = htmlDirecto;
        } 
        // CASO 2: Envío desde el Panel de Administración (Angular)
        else {
            // Preparamos el HTML de la imagen SOLO si se seleccionó una
            const imagenHtml = (imagen) 
                ? `<div style="margin-top: 25px; text-align: center;">
                    <img src="cid:imagen_adjunta" alt="Imagen adjunta" style="max-width: 100%; border-radius: 12px; display: block; margin: 0 auto; border: 1px solid #eee;">
                   </div>` 
                : "";

            // Construimos el diseño profesional "Cuadro Blanco"
            htmlFinal = `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; font-family: sans-serif; border-radius: 15px; overflow: hidden; background-color: #ffffff;">
                <div style="background: #111827; padding: 20px; text-align: center;">
                    <span style="color: white; font-size: 20px; font-weight: bold; letter-spacing: 2px;">FACTOR FIT</span>
                </div>
                <div style="padding: 30px;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0; white-space: pre-line;">
                        ${mensaje}
                    </p>
                </div>
                <div style="padding: 20px; background: #f9fafb; text-align: center; color: #9ca3af; font-size: 12px; border-top: 1px solid #eee;">
                    © 2026 Factor Fit System | Sede: ${sede || 'General'}<br>
                    Este es un correo informativo, por favor no respondas a este mensaje.
                </div>
            </div>`;
        }

        const emailPayload = {
            sender: { name: "Factor Fit", email: "factorfit2025@gmail.com" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlFinal
        };

        // --- ADJUNTO DINÁMICO ---
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "adjunto_factorfit.png", // Nombre genérico del archivo
                contentId: "imagen_adjunta"    // DEBE coincidir con el src="cid:imagen_adjunta"
            }];
        }

        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'api-key': BREVO_API_KEY_2,
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

