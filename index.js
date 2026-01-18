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
        htmlDirecto 
    } = req.body;

    try {
        let htmlFinal = "";

        // CASO 1: PRIORIDAD - HTML Directo de PHP
        if (tipo === 'html_puro' || htmlDirecto) {
            htmlFinal = htmlDirecto;
        
        // --- NUEVO: SI EL HTML VIENE DE LARAVEL Y HAY IMAGEN ---
        // Buscamos si el HTML trae el marcador de posición para la imagen
        // o si simplemente queremos forzar que la imagen aparezca al final del contenido blanco
        if (imagen && !htmlFinal.includes('cid:foto_promo')) {
             // Esto inserta la imagen justo antes del cierre del div blanco si no existe el cid
             htmlFinal = htmlFinal.replace('</div>\n\n    <div class="footer"', `
                <div style="text-align: center; margin-top: 20px;">
                    <img src="cid:foto_promo" style="max-width: 100%; border-radius: 10px; display: block; margin: 0 auto;">
                </div>
             </div>
             <div class="footer"`);
        }
        } 
        
        // CASO 2: RECUPERACIÓN DE CONTRASEÑA
        else if (tipo === 'password') {
            // ... (tu código de password actual se mantiene igual)
        } 
        
        // CASO 3: CORREO INFORMATIVO (El que usas en UserManagement)
        else {
            // Preparamos el tag de imagen solo si existe
            // Usamos cid:foto_promo para que se inserte DENTRO del diseño
            const imagenHtml = (imagen) 
                ? `<div style="margin-top: 20px; text-align: center;">
                    <img src="cid:foto_promo" alt="Factor Fit News" style="max-width: 100%; border-radius: 10px; display: block; margin: 0 auto;">
                   </div>` 
                : "";

            htmlFinal = `
            <div style="width: 100%; max-width: 600px; margin: 0 auto; border: 1px solid #f0f0f0; font-family: sans-serif; border-radius: 15px; overflow: hidden;">
                <div style="background: #111827; padding: 20px; text-align: center;">
                    <span style="color: white; font-size: 20px; font-weight: bold; letter-spacing: 2px;">FACTOR FIT</span>
                </div>
                <div style="padding: 30px; background: white;">
                    <p style="color: #374151; font-size: 16px; line-height: 1.6; margin: 0;">
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

        // --- LA CLAVE PARA QUE NO SE VEA "AFUERA" ---
        // Si hay imagen, la adjuntamos como inline para que el "cid" funcione
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "promocion.png",
                contentId: "foto_promo" // Este ID debe coincidir con el src="cid:foto_promo"
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