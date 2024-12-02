import whatsappService from './whatsappService.js';

class MessageHandler {
  async handleIncomingMessage(message, senderInfo) {
    if (message?.type === 'text') {
      const incommingMessage = message.text.body.toLowerCase().trim();

      if(this.isGreeting(incommingMessage)){
        await this.sendWelcomemessage(message.from, message.id, senderInfo);
        await this.sendWelcomeMenu(message.from);
      }else if(incommingMessage === 'media'){
        await this.sendMedia(message.from);
      }else {
        const response = `Echo: ${message.text.body}`;
        await whatsappService.sendMessage(message.from, response, message.id);
      }
        await whatsappService.markAsRead(message.id);
    }else if(message?.type === 'interactive'){
      const option = message?.interactive?.button_reply?.title.toLowerCase().trim();
      await this.handleMenuOption(message.from, option);
      await this.whatsappService.markAsRead(message.id);

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
        type: 'reply', reply: { id: 'option_1', title: 'Agendar Cita'}
      },
      {
        type: 'reply', reply: { id: 'option_2', title: 'Consultar Citas'}
      },
      {
        type: 'reply', reply: { id: 'option_3', title: 'Ubicacion Vet'}
      }
    ];
    await whatsappService.sendInteractiveButtons(to, menuMessage, buttons);
  }

  async handleMenuOption(to, option){
    let response;
    switch(option){
      case 'Agendar Cita':
        response = "Agendar Cita";
        break;
        case 'Consultar Citas':
        response = "Consultar Citas";
        break;
        case 'Ubicacion Vet':
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
}

export default new MessageHandler();