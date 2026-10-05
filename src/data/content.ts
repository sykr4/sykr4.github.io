/**
 * Catálogo contrastado con la presentación SYKR4 (20/09/2026), el estudio de
 * servicios (18/09/2026) y los CV aportados. Los ejemplos no son casos de clientes.
 * Los alcances selectivos se estudian por proyecto; las configuraciones de
 * herramientas existentes no se presentan como productos propios terminados.
 */
export const MEDIA = {
  video: "/SYKR4_6_Planetas_WEB_720p.mp4",
  poster: "/images/sykr4-planetas-poster.jpg",
};

export const NAV = [
  { id: "inicio", label: "Inicio" },
  { id: "manifiesto", label: "Enfoque" },
  { id: "servicios", label: "Servicios" },
  { id: "casos", label: "Ejemplos" },
  { id: "resultados", label: "Método" },
  { id: "nosotros", label: "Equipo" },
  { id: "recorrido", label: "Recorrido" },
  { id: "contacto", label: "Contacto" },
];

export type IconName = "server" | "cloud" | "rocket" | "code" | "bot" | "support" | "shield" | "web";

export interface Service {
  title: string;
  microclaim: string;
  text: string;
  description: string;
  detailPoints: string[];
  outcome: string;
  scope: string;
  cta: string;
  tags: string[];
  metric: string;
  icon: IconName;
}

export const SERVICES: Service[] = [
  {
    title: "IA y automatización",
    microclaim: "Menos tareas repetitivas. Más tiempo para tu negocio.",
    text: "Automatizamos tareas como pasar datos de facturas, ordenar solicitudes o preparar respuestas. Conectamos las herramientas que ya usas para reducir el trabajo manual, con tu equipo al mando de las decisiones importantes.",
    description: "¿Tu equipo pasa el día copiando datos, buscando documentos o contestando las mismas preguntas? Conectamos las herramientas que ya utiliza tu equipo para agilizar ese trabajo: extraer datos de una factura, preparar un presupuesto o consultar el estado de un pedido. La inteligencia artificial (IA) interpreta la información, las reglas comprueban los datos y tu equipo aprueba las acciones importantes. Empezamos por un proceso concreto, lo probamos con información que nos autorices a utilizar y medimos si aporta una mejora antes de ampliarlo.",
    detailPoints: [
      "Documentos e informes: extraemos datos de correos y archivos para que tu equipo los revise sin tener que copiarlos a mano. También reunimos la información comprobada en informes periódicos.",
      "Presupuestos y compras: preparamos borradores de presupuestos con tu catálogo y tus tarifas aprobadas. Configuramos las herramientas que ya utilizas para comparar proveedores; tu equipo elige el proveedor y realiza la compra.",
      "Contactos y seguimiento de ventas: organizamos los contactos que llegan por formularios y correo, evitamos duplicados y preparamos fichas, tareas y recordatorios para dar seguimiento a las propuestas pendientes.",
      "Atención al cliente: organizamos las incidencias, preparamos respuestas y conectamos las consultas con el estado real de los pedidos. Agrupamos las reclamaciones para detectar problemas repetidos y derivamos los casos excepcionales a una persona.",
      "Consultas internas y nuevas incorporaciones: configuramos asistentes que responden a partir de tus manuales y procedimientos, indican de dónde sacan la información y respetan los permisos de acceso. También pueden orientar a las nuevas incorporaciones con contenidos aprobados por tu empresa.",
      "Reuniones, recepción y reservas: configuramos tus herramientas para recoger solicitudes y proponer citas según la disponibilidad real. Convertimos notas o grabaciones autorizadas en acuerdos y tareas que tu equipo puede revisar.",
      "Catálogos de tiendas online: organizamos categorías, características y variantes de tus productos. Preparamos fichas o traducciones a partir de sus datos para que tu equipo las apruebe antes de publicar.",
      "Problemas con los envíos: relacionamos cada aviso de entrega con su envío, identificamos el tipo de incidencia y preparamos una tarea para la persona responsable de operaciones.",
      "Apoyo al equipo técnico: dentro de un proyecto en la nube, configuramos las herramientas de supervisión que ya utilizas para reunir avisos y la información necesaria para entenderlos. El personal técnico decide y ejecuta los cambios.",
    ],
    outcome: "Menos datos copiados a mano y más información lista para trabajar. Tu equipo puede identificar las excepciones y mantiene el control de las decisiones importantes.",
    scope: "Acordamos qué proceso automatizar, qué información utilizar y qué acciones realizar. Probamos los permisos, la calidad de los resultados y su utilidad con tu equipo. Las siguientes automatizaciones se valoran por separado.",
    cta: "Cuéntanos qué tarea quieres automatizar",
    tags: ["Documentos y datos", "Atención y ventas", "Asistentes internos"],
    metric: "Menos trabajo manual",
    icon: "bot",
  },
  {
    title: "AWS y control de costes",
    microclaim: "Descubre en qué gastas y qué puedes mejorar.",
    text: "Revisamos tu infraestructura AWS y el consumo de IA para explicar dónde se va el presupuesto. Te ayudamos a priorizar mejoras según su impacto, esfuerzo y riesgo, y a definir cómo llevarlas a la práctica.",
    description: "¿Tu factura de AWS crece y no tienes claro por qué? Analizamos qué utilizas, cuánto cuesta y cómo están organizados tus servidores y servicios. Te entregamos un plan de mejoras con prioridades, estimaciones y riesgos explicados. Si ya usas IA, comparamos su coste, calidad y tiempo por tarea resuelta. En la revisión inicial consultamos la información sin modificar tu entorno. Si decides aplicar mejoras, acordamos por separado su diseño y puesta en marcha, con pruebas y una forma de volver a la configuración anterior.",
    detailPoints: [
      "Control del gasto en AWS: analizamos las cuentas, el consumo y la factura, junto con las etiquetas que identifican los recursos. Localizamos servicios poco utilizados y te explicamos qué está generando el coste.",
      "Servidores y servicios en la nube: estudiamos tus servidores, almacenamiento, bases de datos y transferencias de información. Comprobamos cómo encajan con el funcionamiento de tu aplicación, su crecimiento previsto y la disponibilidad que necesita.",
      "Plan de mejoras: ordenamos las acciones por prioridad e indicamos su impacto estimado, el trabajo necesario, los riesgos y las condiciones para aplicarlas. Dejamos claro qué mejoras son posibles y cuáles se han comprobado.",
      "Diseño y puesta en marcha: acordamos y presupuestamos por separado los cambios que decidas aplicar, desde reorganizar los servicios hasta ajustar su configuración o automatizar su gestión. Incluimos pruebas y un procedimiento para volver a la situación anterior.",
      "Coste de la IA y sus conexiones: medimos las peticiones a servicios de IA, los intentos repetidos y el tiempo de revisión de tu equipo. Probamos otros modelos o ajustes manteniendo los requisitos de calidad de cada tarea.",
      "Apoyo a agencias: colaboramos en revisiones de AWS y tareas concretas de infraestructura en la nube y automatización de despliegues. Acordamos qué entrega cada parte, las fechas y la documentación del proyecto.",
    ],
    outcome: "Entenderás qué genera tu gasto y qué cambios merece la pena valorar, con un plan que puedes revisar antes de invertir o modificar los sistemas que utilizas a diario.",
    scope: "La revisión y la puesta en marcha se presupuestan por separado. Calculamos las estimaciones con tus datos y comprobamos el ahorro después de aplicar los cambios y observar los resultados.",
    cta: "Cuéntanos qué quieres mejorar en AWS",
    tags: ["AWS y servidores", "Control de costes", "Coste de IA"],
    metric: "Tu gasto, explicado",
    icon: "cloud",
  },
  {
    title: "Seguridad y Microsoft 365",
    microclaim: "Protege tus cuentas y comprueba que puedes recuperar tus datos.",
    text: "Revisamos tus cuentas, el correo y los permisos de acceso para identificar qué protección conviene reforzar. También comprobamos si tus copias de seguridad permiten recuperar los datos. Acordamos las medidas contigo y documentamos las pruebas y lo que queda por resolver.",
    description: "¿Sabes quién puede acceder a la información de tu empresa? ¿Podrías recuperarla si la perdieras? Analizamos la seguridad de tus cuentas, correo y permisos en Microsoft 365 para detectar puntos débiles y proponer mejoras adaptadas a tu negocio. También podemos probar tus copias de seguridad en un espacio separado, sin sobrescribir los sistemas que utilizas a diario. Te mostramos qué funciona, qué necesita corregirse y cómo recuperar la información. Acordamos los cambios que vamos a aplicar y la formación que necesita tu equipo.",
    detailPoints: [
      "Usuarios y permisos: comprobamos quién puede acceder a tus sistemas, qué información puede consultar o modificar y quién tiene permisos de administración.",
      "Cuentas y correo de Microsoft 365: comprobamos cómo se verifica la identidad de los usuarios, cómo se protegen sus cuentas y cómo está configurado el correo. Con esa información, concretamos las mejoras necesarias.",
      "Detección de puntos débiles: identificamos configuraciones que conviene corregir y ordenamos las medidas de protección por prioridad para los sistemas incluidos en el proyecto.",
      "Formación del equipo: enseñamos pautas de uso seguro adaptadas a los riesgos de tu empresa y a los cambios que se hayan aplicado.",
      "Copias de seguridad y recuperación: comprobamos qué datos se guardan, durante cuánto tiempo y quién puede acceder a ellos. Probamos la recuperación de los datos o del sistema de Microsoft 365 o AWS que acordemos contigo, sin sobrescribir el entorno de trabajo.",
      "Procedimiento de recuperación: documentamos los resultados de las pruebas, cuánto han tardado las pruebas y las limitaciones encontradas. Dejamos por escrito los pasos para recuperar la información, quién se encarga de cada tarea y qué mejoras quedan pendientes.",
    ],
    outcome: "Sabrás quién tiene acceso a tu información, qué medidas de protección faltan y qué datos o sistemas has podido recuperar en las pruebas, con los pasos para hacerlo.",
    scope: "Antes de empezar, acordamos qué sistemas y pruebas incluimos y qué permisos necesitamos. La revisión, los cambios y el mantenimiento tienen sus propias tareas y horarios acordados.",
    cta: "Hablemos de la seguridad de tu empresa",
    tags: ["Microsoft 365", "Protección de cuentas", "Copias y recuperación"],
    metric: "Seguridad que puedes comprobar",
    icon: "shield",
  },
  {
    title: "Desarrollo e integraciones",
    microclaim: "Conecta tus herramientas y evita copiar los mismos datos.",
    text: "Conectamos formularios, pedidos y programas de gestión para que la información pase de una herramienta a otra con las comprobaciones necesarias. También creamos una primera versión de una herramienta interna para gestionar un proceso concreto, como solicitudes, aprobaciones o tareas.",
    description: "Si una solicitud pasa por varias aplicaciones, tu equipo puede acabar copiando los mismos datos una y otra vez. Conectamos las herramientas que ya utilizas para reducir esos pasos y los errores que pueden provocar. Aprovechamos las conexiones que ofrece cada programa o desarrollamos una conexión específica. Si además necesitas una herramienta interna, creamos una primera versión para un uso concreto: recibir solicitudes, revisar datos, aprobar operaciones o consultar su estado. La probamos con tu equipo, establecemos los permisos y documentamos cómo utilizarla y ampliarla.",
    detailPoints: [
      "Conexión de herramientas: enlazamos formularios, correo, pedidos y programas de gestión para que compartan información, según las posibilidades de conexión de cada aplicación.",
      "Datos y comprobaciones: acordamos qué información debe pasar de una herramienta a otra, en qué formato y con qué verificaciones. Añadimos controles de duplicados para que los datos lleguen al lugar correcto.",
      "Aplicaciones internas: creamos herramientas para gestionar solicitudes, aprobaciones, tareas y procesos que hoy dependen de hojas de cálculo o cadenas de correos.",
      "Permisos y registro de actividad: establecemos qué puede hacer cada persona y qué acciones quedan registradas, para consultar qué ha ocurrido y quién ha intervenido.",
      "Pruebas y puesta en marcha: comprobamos con tu equipo que los datos, los estados de cada proceso y los permisos funcionan como se ha acordado. Concretamos dónde se instalará la solución y cómo recuperar su configuración.",
      "Entrega y siguientes mejoras: documentamos cómo funciona la herramienta, formamos a quienes van a usarla y valoramos las nuevas funciones por fases. También estudiamos conexiones entre aplicaciones para proyectos de agencias.",
    ],
    outcome: "Tus herramientas comparten la información necesaria, con menos pasos repetidos y un proceso que tu equipo puede utilizar, consultar y mejorar.",
    scope: "Empezamos por un proceso concreto y acordamos qué incluye la primera entrega: pantallas, permisos y herramientas conectadas. Valoramos las ampliaciones antes de desarrollarlas.",
    cta: "Cuéntanos qué necesitas conectar",
    tags: ["Conexión de aplicaciones", "Herramientas internas", "Datos y permisos"],
    metric: "Herramientas conectadas",
    icon: "code",
  },
  {
    title: "Web y tiendas online",
    microclaim: "Una web que explica tu negocio. Una tienda fácil de gestionar.",
    text: "Creamos webs y tiendas online, mejoramos las que ya tienes y las conectamos con tus herramientas de gestión. Acordamos qué incluirán y te enseñamos a utilizarlas, con opciones de mantenimiento para seguir cuidándolas después de la entrega.",
    description: "Tu web debe explicar lo que ofreces y facilitar que te contacten. Tu tienda debe ayudar a comprar y permitir que tu equipo gestione el día a día. Creamos webs de empresa y tiendas online con plataformas habituales, adaptadas a lo que necesita tu negocio. También mejoramos proyectos existentes para que carguen mejor, estén más protegidos y funcionen correctamente al contactar o comprar. Cuando el proyecto lo requiere, conectamos los formularios y pedidos con tus herramientas de gestión. Probamos el resultado, te entregamos los accesos y te enseñamos a utilizarlo. El mantenimiento y las ampliaciones se acuerdan por separado.",
    detailPoints: [
      "Diseño y desarrollo: organizamos las páginas, los contenidos y la navegación de tu web o tienda para que se adapte también al móvil. Acordamos contigo qué incluirá antes de construirla.",
      "Plataforma y alojamiento: trabajamos con WordPress, Shopify o WooCommerce según las necesidades del proyecto. Concretamos dónde se alojará la web y qué licencias y herramientas necesita.",
      "Puesta en marcha de la tienda: configuramos el catálogo, las variantes de los productos y las opciones habituales de pago y envío. Probamos el proceso de compra con los contenidos y condiciones que hayas aprobado.",
      "Velocidad y seguridad: mejoramos la web existente según lo acordado, con ajustes en su configuración, actualizaciones, permisos o carga de imágenes y contenidos. Hacemos una copia y probamos cómo volver al estado anterior.",
      "Conexión con tu negocio: enlazamos formularios, pedidos y datos con tus herramientas de gestión. Si encaja en el proyecto, configuramos citas y reservas sobre la solución que ya utilizas.",
      "Organización del catálogo: unificamos los datos de proveedores, las características y las variantes de tus productos. Preparamos fichas o traducciones para que las revises antes de incorporarlas a la tienda.",
      "Pruebas y entrega: comprobamos el uso desde móvil, la navegación y los formularios. En tiendas, probamos también la compra o el reembolso según lo acordado. Te entregamos los accesos y te enseñamos a gestionar el proyecto.",
      "Mantenimiento y mejoras: acordamos revisiones, actualizaciones probadas y pequeños cambios, con tareas y horario definidos. Las nuevas funciones se presupuestan por separado.",
    ],
    outcome: "Una web o tienda adaptada a tu negocio, con los accesos y la formación para gestionarla y un plan claro de lo que incluye su mantenimiento y sus mejoras.",
    scope: "Acordamos la plataforma, las páginas o el catálogo, las conexiones con otras herramientas y quién aporta los contenidos. El mantenimiento se contrata con tareas y límites definidos.",
    cta: "Hablemos de tu web o tienda",
    tags: ["Web de empresa", "Tienda online", "Mejoras y mantenimiento"],
    metric: "Crear, mejorar y mantener",
    icon: "web",
  },
];

export interface Case {
  id: string;
  index: string;
  tag: string;
  title: string;
  text: string;
  metric: string;
  metricLabel: string;
  image: string;
  stack: string[];
  real: boolean;
}

export const CASES: Case[] = [
  {
    id: "aws",
    index: "01",
    tag: "AWS y control de costes",
    title: "La factura de AWS crece y no sabes qué conviene cambiar.",
    text: "Revisamos tu factura y cómo utilizas los servicios contratados. Te proponemos qué mantener o ajustar y por dónde empezar, con el trabajo y los riesgos que implica cada cambio.",
    metric: "AWS",
    metricLabel: "Entiende el gasto y decide qué mejorar",
    image: "images/case-cloud.jpg",
    stack: ["Revisión sin hacer cambios", "Qué mejorar primero", "Cambios acordados"],
    real: false,
  },
  {
    id: "security",
    index: "02",
    tag: "Seguridad y Microsoft 365",
    title: "Tienes copias de seguridad. ¿Sabes si podrías recuperar tus datos?",
    text: "Revisamos qué información guardan las copias y probamos su recuperación en un entorno separado de tus sistemas habituales. Te explicamos el resultado, qué accesos hacen falta y qué queda por resolver.",
    metric: "Copias",
    metricLabel: "Comprueba que puedes recuperar tus datos",
    image: "images/case-servers.jpg",
    stack: ["Accesos", "Recuperación de datos", "Procedimiento"],
    real: false,
  },
  {
    id: "bots",
    index: "03",
    tag: "IA y automatización",
    title: "Cada solicitud obliga a copiar datos de un correo.",
    text: "Recogemos los datos del correo, comprobamos que estén completos y preparamos el registro en tu herramienta de trabajo. Tu equipo revisa los casos que lo necesitan y aprueba la información importante antes de guardarla.",
    metric: "Un proceso",
    metricLabel: "Del correo a los datos listos para revisar",
    image: "images/case-ai.jpg",
    stack: ["Recogida de datos", "Comprobación", "Aprobación"],
    real: false,
  },
  {
    id: "digital",
    index: "04",
    tag: "Web e integraciones",
    title: "Llegan solicitudes por la web. Tu equipo vuelve a copiarlas a mano.",
    text: "Conectamos el formulario de tu web con la herramienta que utilizas para gestionar las solicitudes. Preparamos los datos y la tarea de seguimiento para que la persona responsable pueda atender cada consulta.",
    metric: "Conexión",
    metricLabel: "De la web a tu herramienta de trabajo",
    image: "images/case-digital.jpg",
    stack: ["Formulario", "Sistema de gestión", "Seguimiento"],
    real: false,
  },
];

// Five overlays for the five service worlds. The sixth world is the destination.
// Video timing is intentionally preserved from v10.
export const CHAPTERS = [
  {
    index: "01",
    title: "IA y automatización",
    text: "Menos tiempo copiando datos o respondiendo lo mismo. Preparamos la información y dejamos las decisiones importantes en manos de tu equipo.",
    chip: "Recoger datos · Comprobar · Revisar",
    time: [14.25, 19.35] as [number, number],
  },
  {
    index: "02",
    title: "AWS y control de costes",
    text: "Descubre en qué gastas en AWS y en IA. Te ayudamos a decidir qué mejorar primero y qué implica cada cambio.",
    chip: "Analizar · Decidir · Comprobar",
    time: [19.75, 23.45] as [number, number],
  },
  {
    index: "03",
    title: "Seguridad y Microsoft 365",
    text: "Controla quién accede a tu información, refuerza la protección de tus cuentas y comprueba que puedes recuperar tus datos.",
    chip: "Accesos · Protección · Recuperación",
    time: [23.95, 27.55] as [number, number],
  },
  {
    index: "04",
    title: "Desarrollo e integraciones",
    text: "Conectamos tus aplicaciones y creamos las herramientas que faltan para que tu equipo trabaje con menos pasos manuales.",
    chip: "Conectar · Validar · Construir",
    time: [27.85, 32.15] as [number, number],
  },
  {
    index: "05",
    title: "Web y tiendas online",
    text: "Creamos o mejoramos tu web o tienda online y conectamos sus formularios y pedidos con las herramientas de tu negocio.",
    chip: "Crear · Mejorar · Mantener",
    time: [32.45, 36.7] as [number, number],
  },
];

export const STATS = [
  { value: 1, prefix: "", suffix: "", label: "Entender: vemos cómo trabajas, qué herramientas utilizas y qué necesitas resolver." },
  { value: 2, prefix: "", suffix: "", label: "Definir: acordamos qué incluye el proyecto, cuánto cuesta, los plazos y quién se ocupa de cada parte." },
  { value: 3, prefix: "", suffix: "", label: "Poner en marcha: configuramos o desarrollamos lo acordado con los permisos que nos facilites." },
  { value: 4, prefix: "", suffix: "", label: "Comprobar: probamos el resultado contigo, dejamos por escrito cómo funciona y acordamos los siguientes pasos." },
];

export const PILLARS = [
  { title: "Experiencia para decidir mejor", text: "Te ayudamos a decidir qué hacer primero, qué merece la pena mantener y dónde invertir. Hablas directamente con los responsables técnicos y sabes qué incluye el proyecto antes de empezar." },
  { title: "Especialidades que trabajan juntas", text: "Coordinamos sistemas, servicios en la nube, seguridad y desarrollo para que las mejoras encajen entre sí y con la forma de trabajar de tu equipo." },
  { title: "Continuidad después de la entrega", text: "Probamos el resultado contigo, explicamos cómo funciona y formamos a tu equipo según el proyecto. Dejamos claro quién lo gestiona y acordamos el soporte y las mejoras que necesites después." },
];

// Tools are supported by the supplied CVs or the service documentation.
export const TECH = ["AWS", "Microsoft 365", "SharePoint", "Linux", "Docker", "Terraform", "WordPress", "Shopify", "WooCommerce", "React", "Python", "MySQL", "OpenAI", "n8n"];

export const HELP_OPTIONS = [...SERVICES.map((service) => service.title), "No sé qué necesito todavía"];
