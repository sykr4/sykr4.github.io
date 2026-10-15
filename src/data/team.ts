/** Names, specialties and experience come from the supplied About. New roles are client-confirmed. */
export interface TeamMember {
  id: string;
  name: string;
  firstName: string;
  area: string;
  summary: string;
  experience?: string;
  image: string;
  imagePosition: string;
  initials: string;
  bio: string[];
  responsibilities: string[];
  specialties: string[];
}

export const BUSINESS_CONTACT = { name: "Equipo SYKR4", phone: "+34 674 09 72 80", href: "tel:+34674097280", whatsappHref: "https://wa.me/34674097280" };
export const TEAM_SOCIAL = { name: "Instagram", handle: "@sykr4_tech", href: "https://www.instagram.com/sykr4_tech/" };

export const TEAM: readonly TeamMember[] = [
  {
    id: "javier", name: "Javier Millán", firstName: "Javier", area: "Desarrollo e integraciones",
    summary: "Crea aplicaciones web y conecta las herramientas de tu empresa.",
    experience: "5 años de experiencia", image: "/images/team/javier.webp", imagePosition: "50% 28%", initials: "JM",
    bio: [
      "Javier es responsable de desarrollo y conexión de aplicaciones en SYKR4. Aporta 5 años de experiencia en programación, sistemas y aplicaciones web.",
      "Su trabajo se centra en conectar las herramientas de tu empresa y desarrollar las aplicaciones que necesita cada proceso. Junto a Enrique, dirige las áreas técnicas y participa en las decisiones y la puesta en marcha del proyecto.",
    ],
    responsibilities: ["Desarrollo de aplicaciones web y herramientas internas.", "Conexión de plataformas mediante APIs e integraciones.", "Programación y sistemas para simplificar procesos de trabajo."],
    specialties: ["Aplicaciones web", "APIs", "Integraciones"],
  },
  {
    id: "enrique", name: "Enrique Acón", firstName: "Enrique", area: "Arquitectura y seguridad",
    summary: "Diseña y gestiona sistemas en AWS, costes cloud y seguridad.",
    experience: "10 años de experiencia", image: "/images/team/enrique.webp", imagePosition: "50% 26%", initials: "EA",
    bio: [
      "Enrique es responsable de arquitectura tecnológica y seguridad en SYKR4. Cuenta con 10 años de experiencia en sistemas, arquitectura AWS, control de costes, ciberseguridad y Microsoft 365.",
      "Aporta criterio para definir la infraestructura y las medidas de protección de cada proyecto. Junto a Javier, dirige las áreas técnicas, ayuda a establecer prioridades y acompaña la puesta en marcha.",
    ],
    responsibilities: ["Diseño y gestión de sistemas e infraestructura en AWS.", "Análisis y control de costes de los servicios en la nube.", "Ciberseguridad, accesos y entornos de Microsoft 365."],
    specialties: ["AWS y sistemas", "Costes cloud", "Microsoft 365"],
  },
  {
    id: "carlos", name: "Carlos", firstName: "Carlos", area: "Clientes y comunicación",
    summary: "Conecta las necesidades de tu empresa con el equipo técnico.",
    image: "/images/team/carlos.webp", imagePosition: "50% 10%", initials: "C",
    bio: [
      "Carlos se encarga de la relación con los clientes de SYKR4: busca nuevas oportunidades, conoce las necesidades de cada empresa y organiza las reuniones con el equipo técnico.",
      "También gestiona el marketing en redes sociales y la comunicación comercial. Recoge el contexto de cada consulta y lo traslada al equipo técnico para que la conversación avance con las personas adecuadas.",
    ],
    responsibilities: ["Captación de clientes y primera atención de las consultas.", "Organización de reuniones y coordinación con el equipo técnico.", "Marketing en redes sociales y comunicación comercial."],
    specialties: ["Clientes", "Reuniones", "Redes sociales"],
  },
];
