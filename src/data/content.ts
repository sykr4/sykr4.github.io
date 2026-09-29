/**
 * Catálogo contrastado con la presentación SYKR4 (20/09/2026), el estudio de
 * servicios (18/09/2026) y los CV aportados. Los ejemplos no son casos de clientes.
 * Los alcances selectivos se estudian por proyecto; las configuraciones de
 * herramientas existentes no se presentan como productos propios terminados.
 */
export const MEDIA = {
  video: "/SYKR4_6_Planetas_WEB_720p.mp4",
  poster: "/images/sykr4-planetas-poster.jpg",
  team: "https://images.pexels.com/photos/6803554/pexels-photo-6803554.jpeg?auto=compress&cs=tinysrgb&fit=crop&w=1100&h=1320",
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
    microclaim: "Menos tareas repetidas. Más tiempo para revisar y decidir.",
    text: "Conectamos correos, documentos y solicitudes con las herramientas de tu empresa. Preparamos datos, respuestas y tareas para reducir trabajo manual, con reglas claras y revisión de tu equipo donde importa.",
    description: "Si tu equipo copia datos, busca documentos o responde las mismas consultas cada día, estudiamos qué parte del trabajo se puede simplificar. Configuramos las herramientas que ya utilizas y conectamos las piezas que faltan: desde extraer datos de una factura hasta preparar un presupuesto o consultar un pedido. La IA interpreta información; las reglas comprueban datos y tu equipo valida las acciones importantes. Empezamos por un proceso concreto, lo probamos con ejemplos autorizados y medimos si aporta una mejora antes de ampliarlo.",
    detailPoints: [
      "Documentos e informes: extraemos datos de correos y archivos, preparamos registros para revisión y reunimos datos comprobados en informes periódicos.",
      "Presupuestos y compras: preparamos borradores con catálogo y tarifas aprobadas. Para comparar proveedores, configuramos las herramientas existentes; la elección y la compra siguen en manos de tu equipo.",
      "Solicitudes y seguimiento comercial: ordenamos contactos de formularios y correo, evitamos duplicados y preparamos fichas, tareas y recordatorios sobre propuestas pendientes.",
      "Atención al cliente: clasificamos incidencias, preparamos respuestas, conectamos consultas con el estado real de los pedidos y agrupamos reclamaciones para reconocer motivos repetidos. Las excepciones se derivan a una persona.",
      "Conocimiento e incorporación: configuramos asistentes que consultan manuales y procedimientos, muestran sus fuentes y respetan permisos. Podemos adaptar esa base para guiar nuevas incorporaciones con contenidos aprobados.",
      "Reuniones, recepción y reservas: configuramos las herramientas existentes para recoger necesidades, proponer citas con disponibilidad real y convertir notas o grabaciones autorizadas en acuerdos y tareas revisables.",
      "Catálogos de ecommerce: ordenamos atributos, categorías y variantes, y preparamos fichas o traducciones a partir de datos del producto que tu equipo valida antes de publicar.",
      "Incidencias logísticas: relacionamos mensajes de entrega con su expedición, clasificamos el problema y preparamos una tarea para el responsable de operaciones.",
      "Apoyo al equipo IT: cuando encaja en un proyecto cloud, configuramos las herramientas de observación existentes para reunir alertas y contexto. El técnico decide y ejecuta los cambios.",
    ],
    outcome: "Menos datos copiados a mano y más información preparada para trabajar, con las excepciones visibles y las decisiones importantes bajo tu control.",
    scope: "Un proceso, unas fuentes y unas acciones acordadas. Comprobamos permisos, calidad y utilidad con tu equipo; las siguientes automatizaciones se valoran por separado.",
    cta: "Cuéntanos qué quieres automatizar",
    tags: ["Documentos y datos", "Atención y ventas", "Asistentes internos"],
    metric: "Menos trabajo manual",
    icon: "bot",
  },
  {
    title: "AWS, cloud y costes",
    microclaim: "Entiende tu gasto y decide qué merece cambiar.",
    text: "Revisamos tu infraestructura AWS y el consumo de IA para explicar dónde se va el presupuesto. Te ayudamos a priorizar mejoras según su impacto, esfuerzo y riesgo, y a definir cómo llevarlas a la práctica.",
    description: "Una factura tecnológica puede crecer sin que esté claro qué servicio aporta valor o qué cambio conviene hacer. Analizamos costes, uso y arquitectura de AWS con datos de tu entorno. Recibes prioridades explicadas, supuestos y riesgos para decidir con criterio. Si ya utilizas IA en un proceso, comparamos su coste, calidad y tiempos por tarea resuelta. La revisión inicial de AWS se realiza en lectura; el diseño y la implantación de mejoras se acuerdan después, con pruebas y una forma de volver atrás.",
    detailPoints: [
      "Gasto AWS y FinOps: revisamos cuentas, etiquetas, consumo y factura para localizar recursos infrautilizados y entender qué genera el coste.",
      "Arquitectura e infraestructura: analizamos servidores, almacenamiento, bases de datos y transferencias, junto con las necesidades de disponibilidad y crecimiento de la aplicación.",
      "Plan de mejoras: entregamos acciones priorizadas con estimación de impacto, esfuerzo, riesgos y condiciones para aplicarlas. Diferenciamos las oportunidades detectadas de los resultados comprobados.",
      "Diseño e implantación: definimos aparte los cambios de arquitectura, configuración o automatización de infraestructura que se decida ejecutar, con pruebas y reversión acordadas.",
      "Coste de IA y APIs: medimos llamadas, reintentos y revisión humana; probamos alternativas de modelo o configuración sin perder el criterio de calidad del proceso.",
      "Colaboración con agencias: estudiamos revisiones AWS y entregas concretas de cloud y DevOps para sus proyectos, con responsabilidades, calendario y documentación definidos.",
    ],
    outcome: "Una explicación del gasto y un plan de cambios que puedas valorar antes de comprometer presupuesto o tocar producción.",
    scope: "Revisión e implantación se presupuestan por separado. Las estimaciones se apoyan en tus datos; el ahorro se comprueba después de aplicar y observar los cambios.",
    cta: "Revisemos tu infraestructura",
    tags: ["AWS y arquitectura", "FinOps", "Coste de IA"],
    metric: "Decisiones sobre tu gasto",
    icon: "cloud",
  },
  {
    title: "Seguridad y Microsoft 365",
    microclaim: "Controla los accesos y comprueba que puedes recuperar datos.",
    text: "Revisamos cuentas, permisos y correo para identificar dónde reforzar la protección. También probamos la recuperación de tus copias y te dejamos medidas concretas, resultados documentados y prioridades claras para actuar.",
    description: "Saber quién puede acceder a la información y comprobar que una copia se restaura son necesidades distintas, pero ambas afectan a la continuidad del trabajo. Revisamos la protección de cuentas, correo y permisos en Microsoft 365, realizamos un diagnóstico defensivo y proponemos medidas ajustadas a tu entorno. También podemos probar una restauración en un espacio aislado y documentar qué funciona y qué necesita corregirse. Acordamos contigo las mejoras que se implantan y la formación necesaria para que el equipo las utilice.",
    detailPoints: [
      "Identidades y accesos: revisamos usuarios, permisos y roles para comprobar quién entra y qué información puede consultar o modificar.",
      "Cuentas y correo Microsoft 365: revisamos autenticación, protección de cuentas y configuración del correo; definimos las mejoras de seguridad que necesita tu entorno.",
      "Diagnóstico y refuerzo: identificamos configuraciones que conviene corregir y priorizamos medidas defensivas para los sistemas incluidos en el proyecto.",
      "Formación del equipo: adaptamos las pautas de uso y concienciación a los riesgos y cambios detectados en la revisión.",
      "Copias y restauración: revisamos qué se protege, accesos y retención. Probamos la recuperación de datos o de una carga acordada de Microsoft 365 o AWS, sin sobrescribir producción.",
      "Resultados y continuidad: documentamos las pruebas, los tiempos observados, las limitaciones y el procedimiento de recuperación, con responsables y mejoras pendientes.",
    ],
    outcome: "Más claridad sobre los accesos y las medidas pendientes, junto con evidencias de lo que puedes recuperar y de cómo hacerlo.",
    scope: "Definimos sistemas, pruebas y autorizaciones antes de empezar. Revisión, cambios y mantenimiento tienen alcances y horarios acordados.",
    cta: "Revisemos tu seguridad",
    tags: ["Microsoft 365", "Protección de cuentas", "Copias y recuperación"],
    metric: "Protección comprobable",
    icon: "shield",
  },
  {
    title: "Desarrollo e integraciones",
    microclaim: "Conecta tus herramientas y evita copiar los mismos datos.",
    text: "Unimos formularios, pedidos y sistemas de gestión con reglas que validan la información. Si un proceso necesita una herramienta interna, construimos una primera versión acotada para gestionar solicitudes, aprobaciones o tareas.",
    description: "Cuando una petición pasa por varias aplicaciones, copiar los mismos datos introduce trabajo y errores. Estudiamos el recorrido completo y conectamos las herramientas que ya usas mediante sus funciones disponibles o una integración específica. Si falta una interfaz para gestionar el proceso, desarrollamos una herramienta interna pequeña, con permisos y acciones definidos. La primera entrega resuelve un uso concreto: recibir una solicitud, revisar datos, aprobar una operación o seguir su estado. La probamos con tu equipo y documentamos cómo utilizarla y continuar su evolución.",
    detailPoints: [
      "Conexiones entre sistemas: integramos formularios, correo, pedidos y sistemas de gestión mediante conectores o APIs, según las posibilidades de cada herramienta.",
      "Datos y reglas de negocio: definimos campos, formatos, validaciones y controles de duplicados para que la información llegue al destino correcto.",
      "Herramientas internas: creamos interfaces acotadas para solicitudes, aprobaciones, tareas y seguimiento de procesos que hoy se gestionan en hojas o por correo.",
      "Permisos y trazabilidad: definimos roles, acciones permitidas y registros para revisar qué ha ocurrido y quién ha intervenido en el proceso.",
      "Pruebas y puesta en marcha: comprobamos datos, estados y permisos con tu equipo, y acordamos el entorno y la forma de recuperar la configuración.",
      "Entrega y evolución: documentamos el funcionamiento, formamos a quienes lo usarán y valoramos las siguientes funcionalidades por fases. También estudiamos integraciones concretas para agencias.",
    ],
    outcome: "Un proceso conectado, con menos pasos duplicados y una herramienta que tu equipo puede usar, revisar y hacer evolucionar.",
    scope: "Partimos de un proceso y una primera entrega definida. Acordamos pantallas, roles y sistemas implicados; las ampliaciones se valoran antes de desarrollarlas.",
    cta: "Cuéntanos qué necesitas conectar",
    tags: ["APIs y conectores", "Herramientas internas", "Reglas y permisos"],
    metric: "Un proceso conectado",
    icon: "code",
  },
  {
    title: "Web y ecommerce",
    microclaim: "Una web útil, una tienda que puedas gestionar.",
    text: "Diseñamos y desarrollamos webs y tiendas online, mejoramos las que ya existen y las conectamos con tu negocio. Definimos contenidos, funcionamiento y mantenimiento para que sepas qué recibes y cómo seguir utilizándolo.",
    description: "Tu web tiene que explicar lo que ofreces y facilitar el siguiente paso; tu tienda, permitir que el cliente compre y que tu equipo gestione el día a día. Creamos webs corporativas y ecommerce sobre plataformas estándar, con navegación, contenidos y funciones definidos. También ponemos a punto proyectos existentes: revisamos rendimiento, seguridad y flujos de contacto o compra. Conectamos formularios, pedidos y datos con las herramientas del negocio cuando el proyecto lo requiere. La entrega incluye pruebas y traspaso; el mantenimiento y las ampliaciones se acuerdan por separado.",
    detailPoints: [
      "Diseño y desarrollo: definimos navegación, estructura y adaptación a móvil para webs corporativas y tiendas. Acordamos las páginas, contenidos y funcionalidades antes de construir.",
      "Configuración de la plataforma: trabajamos con WordPress, Shopify o WooCommerce según el proyecto, y definimos el alojamiento, licencias y herramientas que necesita cada opción.",
      "Puesta en marcha de ecommerce: configuramos catálogo, variantes y opciones estándar de pago y envío. Probamos el proceso de compra con los contenidos y condiciones aprobados.",
      "Rendimiento y seguridad: revisamos la web existente y aplicamos mejoras acordadas en configuración, actualizaciones, permisos, caché o imágenes, con copia y pruebas de reversión.",
      "Integración con el negocio: conectamos formularios, pedidos y datos con las herramientas de gestión. Si encaja, configuramos agendas y reservas sobre la solución existente.",
      "Gestión del catálogo: normalizamos datos de proveedores, atributos y variantes, y preparamos fichas o traducciones para revisión antes de incorporarlas a la tienda.",
      "Pruebas y traspaso: comprobamos móvil, navegación, formularios y compra o reembolso de prueba, según el alcance. Entregamos acceso y formación para operar el proyecto.",
      "Mantenimiento y evolución: acordamos revisiones, actualizaciones probadas y pequeños cambios, con tareas y horario definidos. Las nuevas funcionalidades se presupuestan aparte.",
    ],
    outcome: "Una web o tienda que funciona con las necesidades de tu negocio, con control sobre su gestión y un alcance claro para cuidarla y mejorarla.",
    scope: "Definimos plataforma, páginas o catálogo, integraciones y responsabilidades sobre los contenidos. El mantenimiento se contrata con límites acordados.",
    cta: "Hablemos de tu web o tienda",
    tags: ["Web corporativa", "Tienda online", "Mejoras y mantenimiento"],
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
    tag: "AWS, cloud y costes",
    title: "La factura cloud crece. Las prioridades no están claras.",
    text: "Revisamos el gasto y el uso real de los recursos. Recibes un plan para decidir qué mantener, ajustar o estudiar, con el riesgo y el esfuerzo de cada cambio.",
    metric: "AWS",
    metricLabel: "de la factura a un plan de acción",
    image: "images/case-cloud.jpg",
    stack: ["Diagnóstico en lectura", "Prioridades", "Cambios acordados"],
    real: false,
  },
  {
    id: "security",
    index: "02",
    tag: "Seguridad y Microsoft 365",
    title: "Hay copias de seguridad, pero nadie ha probado a recuperar.",
    text: "Revisamos qué se protege y probamos una restauración acordada en un entorno aislado. Documentamos el resultado, los accesos necesarios y los pasos que faltan por resolver.",
    metric: "Copias",
    metricLabel: "de la suposición a una prueba documentada",
    image: "images/case-servers.jpg",
    stack: ["Accesos", "Restauración", "Procedimiento"],
    real: false,
  },
  {
    id: "bots",
    index: "03",
    tag: "IA y automatización",
    title: "Cada petición obliga a copiar datos de un correo.",
    text: "Extraemos la información, comprobamos los campos y preparamos un registro en la herramienta de destino. Una persona revisa los casos y aprueba antes de guardar lo importante.",
    metric: "Un flujo",
    metricLabel: "del correo a un registro revisable",
    image: "images/case-ai.jpg",
    stack: ["Extracción", "Validación", "Aprobación"],
    real: false,
  },
  {
    id: "digital",
    index: "04",
    tag: "Web e integraciones",
    title: "La web recibe solicitudes. El equipo vuelve a introducirlas.",
    text: "Revisamos el formulario y su conexión con el sistema de gestión. Preparamos los datos y la tarea de seguimiento para que el responsable trabaje sobre una solicitud organizada.",
    metric: "Conexión",
    metricLabel: "de la web al trabajo del equipo",
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
    text: "Documentos, solicitudes y consultas preparados para trabajar. Menos tareas repetidas, con revisión donde importa.",
    chip: "Extraer · Validar · Revisar",
    time: [14.25, 19.35] as [number, number],
  },
  {
    index: "02",
    title: "AWS, cloud y costes",
    text: "Entiende el gasto de AWS y de tus procesos de IA. Prioriza cambios con datos, pruebas y riesgos claros.",
    chip: "Analizar · Priorizar · Comprobar",
    time: [19.75, 23.45] as [number, number],
  },
  {
    index: "03",
    title: "Seguridad y Microsoft 365",
    text: "Revisa accesos, protege las cuentas y comprueba la recuperación de tus copias con una prueba documentada.",
    chip: "Accesos · Protección · Recuperación",
    time: [23.95, 27.55] as [number, number],
  },
  {
    index: "04",
    title: "Desarrollo e integraciones",
    text: "Conecta las herramientas que ya utilizas. Añade la interfaz o integración que falta para resolver un proceso concreto.",
    chip: "Conectar · Validar · Construir",
    time: [27.85, 32.15] as [number, number],
  },
  {
    index: "05",
    title: "Web y ecommerce",
    text: "Crea tu web o tienda, mejora su funcionamiento y conecta formularios, pedidos y datos con tu negocio.",
    chip: "Crear · Mejorar · Mantener",
    time: [32.45, 36.7] as [number, number],
  },
];

export const STATS = [
  { value: 1, prefix: "", suffix: "", label: "Entender: revisamos el proceso, las herramientas y lo que necesitas resolver." },
  { value: 2, prefix: "", suffix: "", label: "Definir: acordamos la entrega, el precio, el plazo y las responsabilidades." },
  { value: 3, prefix: "", suffix: "", label: "Implementar: configuramos o desarrollamos lo necesario, con acceso autorizado." },
  { value: 4, prefix: "", suffix: "", label: "Comprobar: probamos contigo, documentamos y acordamos cómo continuar." },
];

export const PILLARS = [
  { title: "Experiencia que orienta decisiones", text: "Traducimos tus objetivos en decisiones técnicas: qué priorizar, qué conservar y dónde invertir. Tienes interlocución directa con los responsables técnicos y un alcance claro antes de empezar." },
  { title: "Especialidades que trabajan juntas", text: "Coordinamos sistemas, cloud, seguridad y desarrollo con una visión compartida. Cada decisión tiene en cuenta cómo funciona el conjunto y cómo lo utilizará tu equipo." },
  { title: "Continuidad después de la entrega", text: "Probamos contigo, documentamos y formamos a tu equipo según el proyecto. Dejamos clara la administración de la solución y acordamos el soporte y las siguientes mejoras que necesites." },
];

// Tools are supported by the supplied CVs or the service documentation.
export const TECH = ["AWS", "Microsoft 365", "SharePoint", "Linux", "Docker", "Terraform", "WordPress", "Shopify", "WooCommerce", "React", "Python", "MySQL", "OpenAI", "n8n"];

export const HELP_OPTIONS = [...SERVICES.map((service) => service.title), "Quiero orientación"];
