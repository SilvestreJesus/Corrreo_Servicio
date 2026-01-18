app.post('/enviar-correo', async (req, res) => {
    // Recibimos htmlContent directamente desde Laravel
    const { emails, asunto, htmlContent, imagen } = req.body;

    if (!emails || !Array.isArray(emails)) {
        return res.status(400).json({ error: "Se requiere un array de correos" });
    }

    try {
        const emailPayload = {
            sender: { name: "Factor Fit", email: "22690406@tecvalles.mx" },
            to: emails.map(e => ({ email: e })),
            subject: asunto,
            htmlContent: htmlContent // El HTML que Laravel ya diseñó
        };

        // Si hay una imagen (promoción), se adjunta para que el <img src="cid:foto_promo"> funcione
        if (imagen && imagen.includes("base64,")) {
            emailPayload.attachment = [{
                content: imagen.split("base64,")[1],
                name: "promocion.png",
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