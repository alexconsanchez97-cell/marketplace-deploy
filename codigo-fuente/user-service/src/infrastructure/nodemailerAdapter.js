// ADAPTADOR DE SALIDA de correo ("nodemailadapter").
// Es el ÚNICO archivo del proyecto que conoce a Nodemailer.

const nodemailer = require("nodemailer"); // librería de terceros para mandar correos
const EmailServicePort = require("../domain/emailServicePort"); // el contrato a cumplir
const { plantillaComprobanteCliente, plantillaNuevaOrdenAdmin } = require("./plantillas/plantillasCorreo"); // los HTML

class NodemailerAdapter extends EmailServicePort { // hereda el contrato y lo implementa
  constructor(config) { // config llega desde server.js con los datos del .env
    super(); // obligatorio con extends: llama al constructor del padre
    this.config = config; // guardamos { smtp, remitente, banco }
    this.transportador = null; // aquí guardaremos la conexión SMTP; se crea la primera vez que se use
  }

  _obtenerTransportador() { // regresa siempre el mismo transportador (para no crear 2 cuentas)
    if (!this.transportador) { // la primera vez...
      this.transportador = this._crearTransportador().catch((error) => { // ...lo empezamos a crear
        this.transportador = null; // si falla (ej. sin internet), lo borramos para reintentar después
        throw error; // y avisamos el error
      });
    }
    return this.transportador; // las demás veces regresamos el mismo
  }

  async _crearTransportador() {
    const { host, port, user, pass } = this.config.smtp; // datos SMTP del .env
    if (user && pass) { // si pusiste usuario y contraseña (Mailtrap o Ethereal)...
      return nodemailer.createTransport({ host, port: Number(port), auth: { user, pass } }); // ...usamos esos
    }
    const cuenta = await nodemailer.createTestAccount(); // si no, Nodemailer crea una cuenta de Ethereal temporal
    console.log("📧 Cuenta Ethereal temporal:", cuenta.user, "/", cuenta.pass); // la mostramos por si quieres entrar
    return nodemailer.createTransport({ // y creamos el transportador con esa cuenta
      host: cuenta.smtp.host, // smtp.ethereal.email
      port: cuenta.smtp.port, // 587
      secure: cuenta.smtp.secure, // false en el puerto 587
      auth: { user: cuenta.user, pass: cuenta.pass },
    });
  }

  async _enviar(destinatario, { asunto, html, texto }) { // manda UN correo con cualquier plantilla
    const transportador = await this._obtenerTransportador(); // conseguimos el transportador
    const info = await transportador.sendMail({ // sendMail = la función de Nodemailer que envía
      from: this.config.remitente, // quién lo manda
      to: destinatario, // a quién
      subject: asunto, // asunto
      text: texto, // versión texto plano
      html, // versión HTML
    });
    const vistaPrevia = nodemailer.getTestMessageUrl(info); // con Ethereal da un link para ver el correo
    if (vistaPrevia) console.log(`📨 Correo a ${destinatario}: ${vistaPrevia}`); // lo imprimimos en la terminal
    return { messageId: info.messageId, vistaPrevia };
  }

  // ---- Los 2 métodos del contrato EmailServicePort ----
  async enviarComprobanteCliente(orden, cliente) {
    const correo = plantillaComprobanteCliente(orden, cliente, this.config.banco); // armamos el HTML
    return this._enviar(cliente.email, correo); // lo mandamos al cliente
  }

  async notificarNuevaOrdenAdmin(orden, cliente, adminEmail) {
    const correo = plantillaNuevaOrdenAdmin(orden, cliente); // armamos el aviso
    return this._enviar(adminEmail, correo); // lo mandamos al admin
  }
}

module.exports = NodemailerAdapter; // lo exportamos para server.js