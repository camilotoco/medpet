import whatsappService from './whatsappService.js';
import appendToSheet from './googleSheetsService.js';

class MessageHandler {

  constructor(){
    this.appointmentState = {};
  }
  
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incomingMessage = message.text.body.toLowerCase().trim();

      if(this.isGreeting(incomingMessage)){
        await this.sendWelcomemessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      }else if(incomingMessage === 'media'){
        await this.sendMedia(message.from);
      }else if(this.appointmentState[message.from]){
        await this.handleAppointmetFLow(message.from, incomingMessage);
      }else {
        await this.handleMenuOption(message.from,incomingMessage);
      }
        await whatsappService.markAsRead(message.id);
    }else if(message?.type === 'interactive'){
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(message.from, option);
      await whatsappService.markAsRead(message.id);

    }
  }

  isGreeting(message){
    const greetings = ["hola", "hello","hi", "buenas tardes"]
    return greetings.includes(message);
  }

  getSenderName(senderInfo){
    return senderInfo.profile?.name || senderInfo.wa_id || "Estudiante";
  }

  async sendWelcomemessage(to, messageId, senderInfo){
    const name = this.getSenderName(senderInfo);
    const welcomeMessage = `Hola ${name}, Bienvenido a nuestra vet online tu tienda de mascotas en linea, En que te puedo ayudar?`;
    await whatsappService.sendMessage(to, welcomeMessage, messageId)
  }

  async sendWelcomeMenu(to){
    const menuMessage ="Elige una Opcion";
    const buttons = [
      {
        type: 'reply', reply: { id: 'option_1', title: 'Agendar'}
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Consultar'}
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Ubicacion'}
      }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option){
    let response;
    switch(option){
      case 'agendar':
        this.appointmentState[to] = { step: 'name' }
        response = "Por favor, ingresa tu nombre:";
        break;
        case 'consultar':
        response = "Consultar Citas";
        break;
        case 'ubicacion':
        response = "Ubicacion Vet";
        break;
       default:
        response= 'Lo siento no entendi tu seleccion, por favor elige una de las opciones del menu.'
    }
    await whatsappService.sendMessage(to, response);
  }

  async sendMedia(to) {
    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-audio.aac';
    // const caption = 'Bienvenida';
    // const type = 'audio';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-imagen.png';
    // const caption = '¡Esto es una Imagen!';
    // const type = 'image';

    // const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-video.mp4';
    // const caption = '¡Esto es una video!';
    // const type = 'video';

    const mediaUrl = 'https://s3.amazonaws.com/gndx.dev/medpet-file.pdf';
    const caption = '¡Esto es un PDF!';
    const type = 'document';

    await whatsappService.sendMediaMessage(to, type, mediaUrl, caption);
  }

completeAppointment(to){
  const appointment = this.appointmentState[to];
  delete this.appointmentState[to];

  const userData =[
    to,
    appointment.name,
    appointment.petName,
    appointment.petType,
    appointment.reason,
    new Date().toISOString()
  ]

  appendToSheet(userData);

  return `Gracias por agendar tu cita.
  Resumen de tu cita:
  
  Nombre: ${appointment.name}
  Nombre de la mascota: ${appointment.petName}
  Tipo de mascota ${appointment.petType}
  Motivo ${appointment.reason}
    
  Nos pondremos en contacto para confirmar la fecha y hora de la cita`
}

  async handleAppointmetFLow(to, message){
    const state = this.appointmentState[to];
    let response;

    switch (state.step) {
      case 'name':
        state.name = message;
        state.step = 'petName';
        response = "Gracias, Ahora, ¿Cuál es el nombre de tu Mascota?"
        break;
      case 'petName':
        state.petName = message;
        state.step = 'petType';
        response = '¿Qué tipo de mascota es? (por ejemplo: perro, gato, huron, etc.)'
        break;
      case 'petType':
        state.petType = message;
        state.step = 'reason';
        response = '¿Cuál es el motivo de la Consulta?';
        break;
      case 'reason':
        state.reason = message;
        response = this.completeAppointment(to);
        break;
    }
    await whatsappService.sendMessage(to, response);
  
  }

}

export default new MessageHandler();