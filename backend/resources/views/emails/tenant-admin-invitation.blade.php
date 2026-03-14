<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invito Amministratore Tenant — EGI-HUB</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
            color: #333333;
        }
        .container {
            max-width: 600px;
            margin: 40px auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .header {
            background-color: #1a1a2e;
            color: #ffffff;
            padding: 32px 40px;
        }
        .header h1 {
            margin: 0;
            font-size: 22px;
            font-weight: 600;
        }
        .header p {
            margin: 8px 0 0;
            font-size: 14px;
            color: #aaaacc;
        }
        .body {
            padding: 40px;
        }
        .greeting {
            font-size: 16px;
            margin-bottom: 24px;
        }
        .info-box {
            background-color: #f8f8ff;
            border-left: 4px solid #4f46e5;
            border-radius: 4px;
            padding: 16px 20px;
            margin-bottom: 28px;
        }
        .info-box p {
            margin: 6px 0;
            font-size: 14px;
        }
        .info-box strong {
            color: #1a1a2e;
        }
        .cta-button {
            display: inline-block;
            background-color: #4f46e5;
            color: #ffffff;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            margin: 8px 0 24px;
        }
        .expiry-notice {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 4px;
            padding: 12px 16px;
            font-size: 13px;
            color: #92400e;
            margin-bottom: 24px;
        }
        .url-fallback {
            font-size: 12px;
            color: #666666;
            word-break: break-all;
        }
        .footer {
            background-color: #f4f4f4;
            padding: 24px 40px;
            text-align: center;
            font-size: 12px;
            color: #888888;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>EGI-HUB</h1>
            <p>Piattaforma di Gestione Ecosistema</p>
        </div>

        <div class="body">
            <p class="greeting">
                Gentile <strong>{{ $adminFirstName }} {{ $adminLastName }}</strong>,
            </p>

            <p>
                È stato creato per Lei un accesso come <strong>Amministratore Tenant</strong>
                nell'ambito del progetto <strong>{{ $projectName }}</strong>.
            </p>

            <div class="info-box">
                <p><strong>Tenant:</strong> {{ $tenantName }}</p>
                <p><strong>Progetto:</strong> {{ $projectName }}</p>
                <p><strong>Riferimento contratto:</strong> {{ $contractReference }}</p>
            </div>

            <p>
                Per attivare il suo account e impostare la password, faccia clic sul pulsante seguente:
            </p>

            <a href="{{ $activationUrl }}"
               style="display:inline-block;background-color:#4f46e5;color:#ffffff!important;text-decoration:none;padding:14px 32px;border-radius:6px;font-size:16px;font-weight:600;margin:8px 0 24px;">
                Attiva il mio account
            </a>

            <div class="expiry-notice">
                Questo link è valido fino al
                <strong>{{ $expiresAt ? $expiresAt->format('d/m/Y H:i') : 'N/D' }}</strong>
                (72 ore dalla spedizione).
                Dopo tale data sarà necessario richiedere un nuovo invito all'amministratore di sistema.
            </div>

            <p class="url-fallback">
                Se il pulsante non funziona, copi e incolli il seguente indirizzo nel browser:<br>
                {{ $activationUrl }}
            </p>

            <p>
                Se non si aspettava questa email, la ignori pure.
                L'account resterà inattivo finché il link non viene utilizzato.
            </p>
        </div>

        <div class="footer">
            <p>Questa email è stata generata automaticamente da EGI-HUB.</p>
            <p>Non rispondere a questa email.</p>
        </div>
    </div>
</body>
</html>
