// Nueva Traducción Viviente (NTV).
// Edición y selección temática para parejas: amor, adoración, gozo, tiempos difíciles, paz y esperanza.

export const verseCategories = [
  'Amor',
  'Adoración',
  'Gozo',
  'Tiempos difíciles',
  'Paz',
  'Esperanza',
] as const;

export type VerseCategory = (typeof verseCategories)[number];
export type Verse = { category: VerseCategory; reference: string; text: string };

export const verses: Verse[] = [
  // --- AMOR (15) ---
  {
    category: 'Amor',
    reference: '1 Corintios 13:4',
    text: 'El amor es paciente y bondadoso. El amor no es celoso ni fanfarrón ni orgulloso',
  },
  {
    category: 'Amor',
    reference: '1 Corintios 13:5',
    text: 'no es ofensivo. No exige que las cosas se hagan a su manera. No se irrita ni lleva un registro de las ofensas recibidas.',
  },
  {
    category: 'Amor',
    reference: '1 Corintios 13:7',
    text: 'El amor nunca se da por vencido, jamás pierde la fe, siempre tiene esperanzas y se mantiene firme en toda circunstancia.',
  },
  {
    category: 'Amor',
    reference: '1 Corintios 13:13',
    text: 'Tres cosas durarán para siempre: la fe, la esperanza y el amor; y la mayor de las tres es el amor.',
  },
  {
    category: 'Amor',
    reference: '1 Juan 4:7',
    text: 'Queridos amigos, sigamos amándonos unos a otros, porque el amor viene de Dios. Todo el que ama es un hijo de Dios y conoce a Dios.',
  },
  {
    category: 'Amor',
    reference: '1 Juan 4:8',
    text: 'pero el que no ama no conoce a Dios, porque Dios es amor.',
  },
  {
    category: 'Amor',
    reference: '1 Juan 4:18',
    text: 'En esa clase de amor no hay temor, porque el amor perfecto expulsa todo temor. Si tenemos temor es por miedo al castigo, y esto muestra que no hemos experimentado la plenitud de su amor.',
  },
  {
    category: 'Amor',
    reference: '1 Juan 4:19',
    text: 'Nos amamos unos a otros, porque él nos amó primero.',
  },
  {
    category: 'Amor',
    reference: 'Juan 15:12',
    text: 'Este es mi mandamiento: ámense unos a otros de la misma manera en que yo los he amado.',
  },
  {
    category: 'Amor',
    reference: 'Colosenses 3:14',
    text: 'Sobre todo, vístanse de amor, lo cual nos une a todos en perfecta armonía.',
  },
  {
    category: 'Amor',
    reference: 'Efesios 4:2',
    text: 'Sean siempre humildes y amables. Sean pacientes unos con otros y tolérense las faltas por amor.',
  },
  {
    category: 'Amor',
    reference: 'Cantares 8:7',
    text: 'Las muchas aguas no pueden apagar el amor, ni los ríos pueden extinguirlo. Si un hombre tratara de comprar el amor con toda su riqueza, solo recibiría desprecio total.',
  },
  {
    category: 'Amor',
    reference: 'Romanos 12:10',
    text: 'Ámense unos a otros con un afecto genuino y deléitense al honrarse mutuamente.',
  },
  {
    category: 'Amor',
    reference: 'Proverbios 17:17',
    text: 'Un amigo es siempre leal, y un hermano nace para ayudar en tiempo de necesidad.',
  },
  {
    category: 'Amor',
    reference: '1 Pedro 4:8',
    text: 'Lo más importante de todo es que sigan demostrando profundo amor unos a otros, porque el amor cubre gran cantidad de pecados.',
  },

  // --- ADORACIÓN (15) ---
  {
    category: 'Adoración',
    reference: 'Salmos 100:2',
    text: 'Adoren al Señor con gozo; vengan ante él cantando con alegría.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 95:6',
    text: 'Vengan, postrémonos y adoremos; arrodillémonos delante del Señor, nuestro Creador,',
  },
  {
    category: 'Adoración',
    reference: 'Juan 4:24',
    text: 'Pues Dios es Espíritu, por eso todos los que lo adoran deben hacerlo en espíritu y en verdad.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 63:3',
    text: 'Tu amor inagotable es mejor que la vida misma; ¡cuánto te alabo!',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 63:4',
    text: 'Te alabaré mientras viva; a ti levantaré mis manos en oración.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 103:1',
    text: 'Que todo lo que soy alabe al Señor; con todo el corazón alabaré su santo nombre.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 103:2',
    text: 'Que todo lo que soy alabe al Señor; que nunca olvide todas las cosas buenas que hace por mí.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 145:3',
    text: '¡Grande es el Señor y el más digno de alabanza! Nadie puede medir su grandeza.',
  },
  {
    category: 'Adoración',
    reference: '1 Crónicas 16:29',
    text: '¡Den al Señor la gloria que merece! Traigan ofrendas y vengan a su presencia. Adoren al Señor en todo su santo esplendor.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 29:2',
    text: 'Den al Señor la gloria que pertenece a su nombre; adoren al Señor en la hermosura de su santidad.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 34:1',
    text: 'Alabaré al Señor en todo tiempo; a cada momento pronunciaré sus alabanzas.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 150:6',
    text: '¡Que todo lo que respira cante alabanzas al Señor! ¡Alabado sea el Señor!',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 96:9',
    text: 'Adoren al Señor en todo su santo esplendor; que toda la tierra tiemble delante de él.',
  },
  {
    category: 'Adoración',
    reference: 'Hebreos 13:15',
    text: 'Por lo tanto, por medio de Jesús, ofrezcamos continuamente a Dios un sacrificio de alabanza, es decir, el fruto de labios que confiesan su nombre.',
  },
  {
    category: 'Adoración',
    reference: 'Salmos 86:12',
    text: 'Con todo el corazón te alabaré, oh Señor mi Dios; daré gloria a tu nombre para siempre.',
  },

  // --- GOZO (15) ---
  {
    category: 'Gozo',
    reference: 'Salmos 16:11',
    text: 'Me mostrarás el camino de la vida; en tu presencia hay plenitud de gozo; a tu diestra hay delicias para siempre.',
  },
  {
    category: 'Gozo',
    reference: 'Nehemías 8:10',
    text: 'No se desalienten ni lloren, porque el gozo del Señor es su fuerza.',
  },
  {
    category: 'Gozo',
    reference: 'Filipenses 4:4',
    text: 'Alégrense siempre en el Señor. Insisto: ¡alégrense!',
  },
  {
    category: 'Gozo',
    reference: 'Romanos 15:13',
    text: 'Le pido a Dios, fuente de esperanza, que los llene completamente de alegría y paz, porque confían en él.',
  },
  {
    category: 'Gozo',
    reference: 'Salmos 30:5',
    text: 'Pues su ira dura solo un instante, ¡pero su favor perdura toda una vida! El llanto puede durar toda la noche, pero con la mañana llega la alegría.',
  },
  {
    category: 'Gozo',
    reference: 'Salmos 118:24',
    text: 'Este es el día que hizo el Señor; nos gozaremos y alegraremos en él.',
  },
  {
    category: 'Gozo',
    reference: 'Juan 15:11',
    text: 'Les he dicho estas cosas para que se llenen de mi gozo; así es, desbordarán de gozo.',
  },
  {
    category: 'Gozo',
    reference: 'Juan 16:24',
    text: 'Hasta ahora no han pedido nada en mi nombre. Pidan y recibirán, para que su gozo sea completo.',
  },
  {
    category: 'Gozo',
    reference: 'Salmos 126:3',
    text: '¡Grandes cosas ha hecho el Señor por nosotros, y estamos muy alegres!',
  },
  {
    category: 'Gozo',
    reference: 'Santiago 1:2',
    text: 'Amados hermanos, cuando tengan que enfrentar cualquier tipo de problemas, considérenlo como un tiempo para alegrarse mucho',
  },
  {
    category: 'Gozo',
    reference: '1 Tesalonicenses 5:16',
    text: 'Estén siempre alegres.',
  },
  {
    category: 'Gozo',
    reference: 'Salmos 97:11',
    text: 'La luz resplandece sobre los justos, y la alegría sobre los de corazón recto.',
  },
  {
    category: 'Gozo',
    reference: 'Salmos 32:11',
    text: '¡Alégrense en el Señor y gócense, ustedes los justos! ¡Canten de alegría todos ustedes los de corazón recto!',
  },
  {
    category: 'Gozo',
    reference: 'Proverbios 17:22',
    text: 'El corazón alegre es una buena medicina, pero el espíritu quebrantado seca los huesos.',
  },
  {
    category: 'Gozo',
    reference: 'Habacuc 3:18',
    text: '¡aun así me alegraré en el Señor! ¡Me gozaré en el Dios de mi salvación!',
  },

  // --- TIEMPOS DIFÍCILES (15) ---
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 46:1',
    text: 'Dios es nuestro refugio y nuestra fuerza, siempre está dispuesto a ayudar en tiempos de dificultad.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Isaías 41:10',
    text: 'No tengas miedo, porque yo estoy contigo; no te desalientes, porque yo soy tu Dios. Te daré fuerzas y te ayudaré; te sostendré con mi mano derecha victoriosa.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 23:4',
    text: 'Incluso cuando cruce por el oscuro valle de la muerte, no tendré miedo, porque tú estás a mi lado. Tu vara y tu cayado me protegen y me confortan.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Mateo 11:28',
    text: 'Luego dijo Jesús: «Vengan a mí todos los que están cansados y llevan cargas pesadas, y yo les daré descanso.',
  },
  {
    category: 'Tiempos difíciles',
    reference: '2 Corintios 12:9',
    text: 'Cada vez él me dijo: «Mi gracia es todo lo que necesitas; mi poder actúa mejor en la debilidad». Así que ahora me alegra jactarme de mis debilidades, para que el poder de Cristo pueda actuar a través de mí.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 34:17',
    text: 'El Señor oye a los suyos cuando claman a él por ayuda; los rescata de todas sus dificultades.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 34:18',
    text: 'El Señor está cerca de los que tienen el corazón quebrantado; rescata a los de espíritu destrozado.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Juan 16:33',
    text: 'Les he dicho todo esto para que tengan paz en mí. Aquí en el mundo tendrán muchas dificultades y tristezas; pero anímense, porque yo he vencido al mundo.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Romanos 8:28',
    text: 'Y sabemos que Dios hace que todas las cosas cooperen para el bien de quienes lo aman y son llamados según su propósito que él tiene para ellos.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Romanos 8:38',
    text: 'Pues estoy convencido de que jamás nada podrá separarnos del amor de Dios. Ni la muerte ni la vida, ni ángeles ni demonios, ni nuestros temores de hoy ni nuestras preocupaciones de mañana',
  },
  {
    category: 'Tiempos difíciles',
    reference: '2 Corintios 4:8',
    text: 'Por todos lados nos presionan las dificultades, pero no nos aplastan. Estamos perplejos, pero no caemos en la desesperación.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 9:9',
    text: 'El Señor es un refugio para los oprimidos, un lugar seguro en tiempos de angustia.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 91:1',
    text: 'Los que viven al amparo del Altísimo encontrarán descanso a la sombra del Todopoderoso.',
  },
  {
    category: 'Tiempos difíciles',
    reference: 'Salmos 121:1',
    text: 'Levanto la vista hacia las montañas, ¿de dónde vendrá mi ayuda? Mi ayuda viene del Señor, quien hizo el cielo y la tierra.',
  },
  {
    category: 'Tiempos difíciles',
    reference: '1 Pedro 5:7',
    text: 'Pongan todas sus preocupaciones y ansiedades en las manos de Dios, porque él cuida de ustedes.',
  },

  // --- PAZ (15) ---
  {
    category: 'Paz',
    reference: 'Juan 14:27',
    text: 'Les dejo un regalo: paz en la mente y en el corazón. Y la paz que yo doy es un regalo que el mundo no puede dar. Así que no se angustien ni tengan miedo.',
  },
  {
    category: 'Paz',
    reference: 'Filipenses 4:6',
    text: 'No se preocupen por nada; en cambio, oren por todo. Díganle a Dios lo que necesitan y denle gracias por todo lo que él ha hecho.',
  },
  {
    category: 'Paz',
    reference: 'Filipenses 4:7',
    text: 'Así experimentarán la paz de Dios, que supera todo lo que podemos entender. La paz de Dios cuidará su corazón y su mente mientras vivan en Cristo Jesús.',
  },
  {
    category: 'Paz',
    reference: 'Isaías 26:3',
    text: '¡Tú guardarás en perfecta paz a todos los que confían en ti, a todos los que concentran en ti sus pensamientos!',
  },
  {
    category: 'Paz',
    reference: 'Salmos 4:8',
    text: 'En paz me acostaré y dormiré, porque solo tú, oh Señor, me mantendrás a salvo.',
  },
  {
    category: 'Paz',
    reference: 'Salmos 29:11',
    text: 'El Señor da fuerza a su pueblo; el Señor bendice a su pueblo con paz.',
  },
  {
    category: 'Paz',
    reference: 'Romanos 5:1',
    text: 'Por lo tanto, ya que fuimos declarados justos a los ojos de Dios por medio de la fe, tenemos paz con Dios gracias a lo que Jesucristo nuestro Señor hizo por nosotros.',
  },
  {
    category: 'Paz',
    reference: 'Colosenses 3:15',
    text: 'Y que la paz que viene de Cristo gobierne en sus corazones. Pues, como miembros de un mismo cuerpo, ustedes son llamados a vivir en paz. Y sean siempre agradecidos.',
  },
  {
    category: 'Paz',
    reference: '2 Tesalonicenses 3:16',
    text: 'Que el Señor de paz les dé paz en todo momento y en cada situación. El Señor sea con todos ustedes.',
  },
  {
    category: 'Paz',
    reference: 'Salmos 85:8',
    text: 'Escucho con atención lo que Dios el Señor está diciendo, porque él promete paz a su pueblo fiel.',
  },
  {
    category: 'Paz',
    reference: 'Mateo 5:9',
    text: 'Dios bendice a los que procuran la paz, porque serán llamados hijos de Dios.',
  },
  {
    category: 'Paz',
    reference: 'Proverbios 3:2',
    text: 'Ellos te darán muchos años de vida y te traerán paz y prosperidad.',
  },
  {
    category: 'Paz',
    reference: 'Isaías 54:10',
    text: 'Pues las montañas podrán moverse y las colinas desaparecer, pero aun así mi fiel amor por ti permanecerá; mi pacto de bendición nunca será roto, dice el Señor, que tiene misericordia de ti.',
  },
  {
    category: 'Paz',
    reference: 'Números 6:26',
    text: 'que el Señor te mire con agrado y te dé su paz.',
  },
  {
    category: 'Paz',
    reference: 'Romanos 14:19',
    text: 'Por lo tanto, procuremos que nuestras acciones promuevan la paz y la edificación mutua.',
  },

  // --- ESPERANZA (15) ---
  {
    category: 'Esperanza',
    reference: 'Jeremías 29:11',
    text: '«Pues yo sé los planes que tengo para ustedes», dice el Señor. «Son planes para lo bueno y no para lo malo, para darles un futuro y una esperanza.',
  },
  {
    category: 'Esperanza',
    reference: 'Romanos 12:12',
    text: 'Alégrense por la esperanza que tenemos. Sean pacientes en las dificultades y sigan orando.',
  },
  {
    category: 'Esperanza',
    reference: 'Hebreos 11:1',
    text: 'La fe es la confianza de que en verdad sucederá lo que esperamos; es lo que nos da la certeza de las cosas que no podemos ver.',
  },
  {
    category: 'Esperanza',
    reference: 'Salmos 71:5',
    text: 'Oh Señor, solo tú eres mi esperanza; en ti he confiado, oh Señor, desde mi niñez.',
  },
  {
    category: 'Esperanza',
    reference: 'Lamentaciones 3:22',
    text: '¡El fiel amor del Señor nunca se acaba! Sus misericordias jamás terminan.',
  },
  {
    category: 'Esperanza',
    reference: 'Lamentaciones 3:23',
    text: 'Grande es su fidelidad; sus misericordias son nuevas cada mañana.',
  },
  {
    category: 'Esperanza',
    reference: 'Salmos 130:5',
    text: 'Yo cuento con el Señor; sí, cuento con él; en su palabra he puesto mi esperanza.',
  },
  {
    category: 'Esperanza',
    reference: 'Isaías 40:31',
    text: 'pero los que confían en el Señor renovarán sus fuerzas; volarán alto, con alas como las águilas. Correrán y no se cansarán; caminarán y no se fatigarán.',
  },
  {
    category: 'Esperanza',
    reference: 'Romanos 8:24',
    text: 'Fuimos salvos con esa esperanza. Si ya tenemos lo que esperamos, no hay necesidad de seguir esperando.',
  },
  {
    category: 'Esperanza',
    reference: 'Salmos 62:5',
    text: 'Que todo mi ser espere en silencio delante de Dios, porque en él está mi esperanza.',
  },
  {
    category: 'Esperanza',
    reference: 'Salmos 33:20',
    text: 'Ponemos nuestra esperanza en el Señor; él es nuestra ayuda y nuestro escudo.',
  },
  {
    category: 'Esperanza',
    reference: 'Proverbios 23:18',
    text: 'Pues sin duda hay un futuro para ti, y tu esperanza no será cortada.',
  },
  {
    category: 'Esperanza',
    reference: 'Tito 2:13',
    text: 'mientras esperamos con esperanza ese día maravilloso en que se manifieste la gloria de nuestro gran Dios y Salvador Jesucristo.',
  },
  {
    category: 'Esperanza',
    reference: '1 Pedro 1:3',
    text: 'Toda la alabanza sea para Dios, el Padre de nuestro Señor Jesucristo. Es por su gran misericordia que hemos nacido de nuevo, porque Dios levantó a Jesucristo de los muertos. Ahora vivimos con gran esperanza',
  },
  {
    category: 'Esperanza',
    reference: 'Salmos 42:11',
    text: '¿Por qué estoy desanimado? ¿Por qué está tan triste mi corazón? ¡Pondré mi esperanza en Dios! Nuevamente lo alabaré, ¡a mi Salvador y a mi Dios!',
  },
];

export function searchVerses(category: VerseCategory | 'Todos', search: string) {
  const normalize = (s: string) =>
    s
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLocaleLowerCase('es');
  const query = normalize(search.trim());
  return verses.filter(
    v =>
      (category === 'Todos' || v.category === category) &&
      normalize(`${v.reference} ${v.text}`).includes(query)
  );
}

/**
 * Returns the unique verse of the day based on the Dominican calendar date (YYYY-MM-DD).
 * Deterministic and shared so both partners read the exact same verse each day.
 */
export function dailyVerse(dateString: string): Verse {
  let hash = 0;
  for (let i = 0; i < dateString.length; i++) {
    hash = (hash * 31 + dateString.charCodeAt(i)) >>> 0;
  }
  return verses[hash % verses.length]!;
}
