export interface ChatbotNode {
  id: string;
  botMessage: string;
  options?: { label: string; nextNodeId: string }[];
  /** Terminal nodes have a response instead of options */
  response?: string;
}

export const chatbotFlows: Record<string, ChatbotNode> = {
  // ── Root ──
  root: {
    id: "root",
    botMessage: "¡Hola! 👋 Soy el asistente virtual de Favoron. ¿En qué puedo ayudarte?",
    options: [
      { label: "📦 Mis pedidos", nextNodeId: "orders" },
      { label: "💳 Pagos", nextNodeId: "payments" },
      { label: "✈️ Viajeros", nextNodeId: "travelers" },
      { label: "🚚 Entregas", nextNodeId: "deliveries" },
      { label: "ℹ️ General", nextNodeId: "general" },
    ],
  },

  // ── Mis pedidos ──
  orders: {
    id: "orders",
    botMessage: "¿Qué necesitas saber sobre tu pedido?",
    options: [
      { label: "Estado de mi pedido", nextNodeId: "orders_status" },
      { label: "Tiempos de entrega", nextNodeId: "orders_times" },
      { label: "Modificar o cancelar pedido", nextNodeId: "orders_cancel" },
      { label: "Mi pedido llegó dañado", nextNodeId: "orders_damaged" },
    ],
  },
  orders_status: {
    id: "orders_status",
    botMessage: "Puedes ver el estado de tu pedido en tu Dashboard. Inicia sesión y verás el timeline con cada etapa: solicitud, cotización, pago, compra, en camino y entregado.",
    response: "Si no encuentras tu pedido o el estado no se actualiza, contáctanos por WhatsApp y te ayudamos.",
  },
  orders_times: {
    id: "orders_times",
    botMessage: "El tiempo de entrega depende de la disponibilidad de viajeros y la tienda donde se compre tu producto.",
    response: "Normalmente tarda entre 1 y 3 semanas desde la confirmación del pedido. Si la tienda envía rápido y hay viajero disponible, puede ser menos.",
  },
  orders_cancel: {
    id: "orders_cancel",
    botMessage: "Puedes solicitar la cancelación de tu pedido dependiendo del estado en que se encuentre.",
    response: "Si tu pedido aún no ha sido comprado, puedes cancelarlo desde tu Dashboard. Si ya fue comprado, contáctanos por WhatsApp para revisar las opciones.",
  },
  orders_damaged: {
    id: "orders_damaged",
    botMessage: "Lamentamos que tu producto haya llegado dañado.",
    response: "Contáctanos por WhatsApp con fotos del producto y del empaque. Revisaremos tu caso y te daremos una solución lo antes posible.",
  },

  // ── Pagos ──
  payments: {
    id: "payments",
    botMessage: "¿Qué necesitas saber sobre pagos?",
    options: [
      { label: "Métodos de pago", nextNodeId: "payments_methods" },
      { label: "Problema con mi cobro", nextNodeId: "payments_issue" },
      { label: "Solicitar reembolso", nextNodeId: "payments_refund" },
      { label: "¿Cuándo me cobran?", nextNodeId: "payments_when" },
    ],
  },
  payments_methods: {
    id: "payments_methods",
    botMessage: "Aceptamos transferencia bancaria y pago con tarjeta de crédito/débito a través de Recurrente.",
    response: "Al confirmar tu cotización, podrás elegir el método de pago que prefieras. Los datos bancarios se muestran en la pantalla de pago.",
  },
  payments_issue: {
    id: "payments_issue",
    botMessage: "Si tuviste un problema con tu cobro, necesitamos revisarlo manualmente.",
    response: "Contáctanos por WhatsApp con el comprobante de pago y el número de tu pedido. Lo resolveremos lo antes posible.",
  },
  payments_refund: {
    id: "payments_refund",
    botMessage: "Los reembolsos se procesan cuando un producto es cancelado antes de la compra o si hay un problema verificado con tu pedido.",
    response: "El reembolso se hace por transferencia bancaria a la cuenta que tengas registrada en tu perfil. El tiempo de procesamiento es de 3-5 días hábiles.",
  },
  payments_when: {
    id: "payments_when",
    botMessage: "El pago se solicita una vez que aceptas la cotización de tu pedido.",
    response: "Tienes un plazo limitado para realizar el pago después de aceptar la cotización. Si no pagas a tiempo, la cotización expira y deberás solicitar una nueva.",
  },

  // ── Viajeros ──
  travelers: {
    id: "travelers",
    botMessage: "¿Qué te gustaría saber sobre ser viajero?",
    options: [
      { label: "Cómo registrarme", nextNodeId: "travelers_register" },
      { label: "Requisitos", nextNodeId: "travelers_requirements" },
      { label: "¿Cómo me pagan?", nextNodeId: "travelers_payment" },
      { label: "¿Cuánto puedo ganar?", nextNodeId: "travelers_earnings" },
    ],
  },
  travelers_register: {
    id: "travelers_register",
    botMessage: "¡Es muy fácil! Crea tu cuenta en Favoron, completa tu perfil con tus datos y registra tu próximo viaje desde el Dashboard.",
    response: "Nuestro equipo revisará tu viaje y te asignará paquetes para transportar. ¡Empieza a ganar dinero extra mientras viajas!",
  },
  travelers_requirements: {
    id: "travelers_requirements",
    botMessage: "Para ser viajero necesitas:",
    response: "1. Tener una cuenta verificada en Favoron\n2. Completar tu perfil con nombre, teléfono y documento\n3. Registrar un viaje con fechas y destino\n4. Tener espacio en tu equipaje para los paquetes asignados",
  },
  travelers_payment: {
    id: "travelers_payment",
    botMessage: "El pago a viajeros se realiza por transferencia bancaria una vez que todos los paquetes de tu viaje sean entregados.",
    response: "Asegúrate de tener tus datos bancarios actualizados en tu perfil. El monto se acumula por viaje y se procesa cuando se completan todas las entregas.",
  },
  travelers_earnings: {
    id: "travelers_earnings",
    botMessage: "Tus ganancias dependen del número y tipo de paquetes que transportes.",
    response: "Cada paquete tiene una propina asignada que se define al momento de la cotización. Mientras más paquetes lleves, más ganas. ¡Algunos viajeros ganan cientos de quetzales por viaje!",
  },

  // ── Entregas ──
  deliveries: {
    id: "deliveries",
    botMessage: "¿Qué necesitas saber sobre las entregas?",
    options: [
      { label: "Puntos de entrega", nextNodeId: "deliveries_points" },
      { label: "Entrega a domicilio", nextNodeId: "deliveries_home" },
      { label: "Horarios de entrega", nextNodeId: "deliveries_schedule" },
    ],
  },
  deliveries_points: {
    id: "deliveries_points",
    botMessage: "Contamos con puntos de entrega en la Ciudad de Guatemala donde puedes recoger tus paquetes.",
    response: "Al momento de hacer tu pedido, podrás seleccionar el punto de entrega más conveniente para ti. Los detalles de dirección y horario se muestran en tu Dashboard.",
  },
  deliveries_home: {
    id: "deliveries_home",
    botMessage: "Ofrecemos entrega a domicilio dentro de la Ciudad de Guatemala y algunas zonas del interior.",
    response: "La tarifa de entrega varía según la ubicación. Dentro de la Ciudad de Guatemala tiene un costo menor que fuera de la ciudad. El costo se incluye en tu cotización.",
  },
  deliveries_schedule: {
    id: "deliveries_schedule",
    botMessage: "Los horarios de entrega dependen de la disponibilidad del viajero y la coordinación con nuestro equipo.",
    response: "Una vez que el viajero llegue a Guatemala con tus productos, coordinamos la entrega y te notificamos por WhatsApp con la fecha y hora estimada.",
  },

  // ── General ──
  general: {
    id: "general",
    botMessage: "¿Sobre qué tema general necesitas información?",
    options: [
      { label: "¿Cómo funciona Favoron?", nextNodeId: "general_how" },
      { label: "Productos permitidos", nextNodeId: "general_products" },
      { label: "¿Es seguro?", nextNodeId: "general_security" },
      { label: "Favoron Prime", nextNodeId: "general_prime" },
    ],
  },
  general_how: {
    id: "general_how",
    botMessage: "Favoron conecta shoppers con viajeros internacionales.",
    response: "Tú haces tu pedido de productos de cualquier parte del mundo, un viajero los trae en su maleta y te los entregamos en Guatemala. Es simple, seguro y personal. Sin intermediarios de importación.",
  },
  general_products: {
    id: "general_products",
    botMessage: "Puedes pedir la mayoría de productos disponibles en tiendas del mundo: electrónica, ropa, zapatos, cosméticos, suplementos, accesorios y más.",
    response: "Los productos deben caber en la maleta de un viajero. Hay restricciones para productos regulados, líquidos peligrosos y artículos prohibidos por aduanas.",
  },
  general_security: {
    id: "general_security",
    botMessage: "Tu seguridad es nuestra prioridad.",
    response: "Verificamos a todos los viajeros, hacemos seguimiento de cada paquete y contamos con un proceso de confirmación en cada etapa. Tu pedido está protegido de principio a fin.",
  },
  general_prime: {
    id: "general_prime",
    botMessage: "Favoron Prime es nuestra membresía premium con beneficios exclusivos.",
    response: "Con Prime obtienes: menor tarifa de servicio, descuento en entregas a domicilio y exención de penalización por cancelación. Puedes activarlo desde tu perfil.",
  },
};

export const ROOT_NODE_ID = "root";
