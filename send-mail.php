<?php
/**
 * Script de envío de formularios de contacto y citas para Hosting DonDominio (PHP 7.4 / 8.x)
 * Dra. Adriana Mendoza Orozco - Ortodoncia en Madrid (Barrio de Salamanca)
 * Destino: citas@adrianamendozaortodoncia.com
 */

header('Content-Type: application/json; charset=utf-8');

// 1. Permitir únicamente peticiones POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode([
        'status' => 'error',
        'message' => 'Método no permitido. Solo se aceptan solicitudes POST.'
    ]);
    exit;
}

// 2. Sanitizar y extraer los campos del formulario
$nombre = isset($_POST['nombre']) ? trim(strip_tags($_POST['nombre'])) : '';
$email = isset($_POST['email']) ? filter_var(trim($_POST['email']), FILTER_SANITIZE_EMAIL) : '';
$telefono = isset($_POST['telefono']) ? trim(strip_tags($_POST['telefono'])) : '';
$preferencia = isset($_POST['preferencia_respuesta']) ? trim(strip_tags($_POST['preferencia_respuesta'])) : 'No especificado';
$franja = isset($_POST['franja_horaria']) ? trim(strip_tags($_POST['franja_horaria'])) : 'Sin preferencia';
$consentimiento = isset($_POST['consentimiento']) ? true : false;

// 3. Validaciones obligatorias
if (empty($nombre)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Por favor, introduce tu nombre.'
    ]);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Por favor, introduce una dirección de correo válida.'
    ]);
    exit;
}

if (!$consentimiento) {
    http_response_code(400);
    echo json_encode([
        'status' => 'error',
        'message' => 'Debes aceptar la política de privacidad para enviar tu solicitud.'
    ]);
    exit;
}

// 4. Parámetros de envío
$destinatario = 'citas@adrianamendozaortodoncia.com';
$asunto = 'Nueva solicitud de cita web · ' . $nombre;

$cuerpoHtml = "
<!DOCTYPE html>
<html lang='es'>
<head>
    <meta charset='utf-8'>
    <title>Nueva Solicitud de Cita</title>
</head>
<body style='font-family: -apple-system, BlinkMacSystemFont, \"Segoe UI\", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #2C2825; max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #E8E2D9; border-radius: 10px; background-color: #FFFFFF;'>
    
    <div style='text-align: center; border-bottom: 2px solid #A88342; padding-bottom: 16px; margin-bottom: 24px;'>
        <h2 style='color: #1A1A1A; margin: 0; font-size: 22px; font-weight: 600;'>Dra. Adriana Mendoza Orozco</h2>
        <p style='color: #A88342; margin: 6px 0 0; font-size: 14px; font-weight: 500;'>Ortodoncia · Centro Médico y Dental Caduceo (Madrid)</p>
    </div>
    
    <div style='background-color: #FAF8F5; border-left: 4px solid #A88342; padding: 14px 18px; margin-bottom: 22px; border-radius: 4px;'>
        <h3 style='color: #1A1A1A; margin: 0 0 6px; font-size: 16px;'>Nueva Solicitud de Contacto / Cita Web</h3>
        <p style='color: #5C554E; margin: 0; font-size: 13px;'>Recibida desde el formulario de la página web oficial.</p>
    </div>
    
    <table style='width: 100%; border-collapse: collapse; margin-bottom: 24px;'>
        <tr style='border-bottom: 1px solid #E8E2D9;'>
            <td style='padding: 12px 6px; font-weight: 600; width: 42%; color: #5C554E; font-size: 14px;'>Paciente:</td>
            <td style='padding: 12px 6px; color: #1A1A1A; font-size: 15px; font-weight: bold;'>{$nombre}</td>
        </tr>
        <tr style='border-bottom: 1px solid #E8E2D9;'>
            <td style='padding: 12px 6px; font-weight: 600; color: #5C554E; font-size: 14px;'>Correo Electrónico:</td>
            <td style='padding: 12px 6px;'><a href='mailto:{$email}' style='color: #A88342; text-decoration: underline;'>{$email}</a></td>
        </tr>
        <tr style='border-bottom: 1px solid #E8E2D9;'>
            <td style='padding: 12px 6px; font-weight: 600; color: #5C554E; font-size: 14px;'>Teléfono de Contacto:</td>
            <td style='padding: 12px 6px;'><a href='tel:{$telefono}' style='color: #1A1A1A; font-weight: 600; text-decoration: none;'>{$telefono}</a></td>
        </tr>
        <tr style='border-bottom: 1px solid #E8E2D9;'>
            <td style='padding: 12px 6px; font-weight: 600; color: #5C554E; font-size: 14px;'>Preferencia de Respuesta:</td>
            <td style='padding: 12px 6px; color: #1A1A1A; font-weight: 600;'>{$preferencia}</td>
        </tr>
        <tr style='border-bottom: 1px solid #E8E2D9;'>
            <td style='padding: 12px 6px; font-weight: 600; color: #5C554E; font-size: 14px;'>Franja Horaria Preferida:</td>
            <td style='padding: 12px 6px; color: #1A1A1A;'>{$franja}</td>
        </tr>
        <tr>
            <td style='padding: 12px 6px; font-weight: 600; color: #5C554E; font-size: 14px;'>Consentimiento RGPD:</td>
            <td style='padding: 12px 6px; color: #1F7A46; font-weight: 600;'>✓ Aceptado explícitamente</td>
        </tr>
    </table>
    
    <div style='background-color: #FAF8F5; padding: 14px; border-radius: 6px; font-size: 12px; color: #7A7269; line-height: 1.5;'>
        <strong>Cláusula de confidencialidad:</strong> Este formulario no recoge mensajes abiertos, fotografías ni datos de salud o informes médicos de conformidad con el RGPD. Contactar al paciente por el medio seleccionado para coordinar su cita presencial en Marqués de Zafra 15, Madrid.
    </div>
</body>
</html>
";

// 5. Cabeceras del correo (compatibilidad nativa DonDominio)
$headers = [
    'MIME-Version: 1.0',
    'Content-type: text/html; charset=UTF-8',
    'From: Dra. Adriana Mendoza Web <no-reply@adrianamendozaortodoncia.com>',
    'Reply-To: ' . $email,
    'X-Mailer: PHP/' . phpversion()
];

// 6. Enviar
$enviado = @mail($destinatario, $asunto, $cuerpoHtml, implode("\r\n", $headers));

// 7. Respuesta JSON
echo json_encode([
    'status' => 'success',
    'message' => '¡Gracias! Tu solicitud ha sido registrada correctamente. Te contactaremos a la brevedad.'
]);
exit;
