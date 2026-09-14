/**
 * Seed de la biblioteca global de formatos.
 *
 * Inserta un set inicial de formatos virales (reel, carrusel, story) con
 * skeletons escritos a mano, validados contra el mismo schema Zod que usa
 * el extractor de IA. Idempotente: si ya existe un formato global con el
 * mismo nombre y tipo, lo salta.
 *
 * Uso: npm run db:seed
 */
import { config } from "dotenv";
config({ path: [".env.local", ".env"] });

import { skeletonOutput, type SkeletonOutput } from "../src/lib/validations/ai";

type Seed = {
  name: string;
  contentType: "reel" | "carousel" | "story";
  skeleton: SkeletonOutput;
  performanceNotes: string;
};

const SEEDS: Seed[] = [
  {
    name: "Funciona / No funciona",
    contentType: "reel",
    performanceNotes:
      "Contraste binario que obliga a quedarse hasta el final para ver qué sí funciona. Muy fuerte en nichos de servicios y educación.",
    skeleton: {
      name: "Funciona / No funciona",
      structure: [
        {
          section: "hook",
          purpose: "Nombrar el error común que la audiencia está cometiendo ahora mismo",
          relative_duration: "0 a 3 segundos",
        },
        {
          section: "contexto",
          purpose: "Explicar por qué casi todos hacen lo que NO funciona",
          relative_duration: "3 a 10 segundos",
        },
        {
          section: "problema",
          purpose: "Mostrar la consecuencia concreta de seguir haciéndolo mal",
          relative_duration: "10 a 18 segundos",
        },
        {
          section: "solucion",
          purpose: "Revelar lo que SÍ funciona con un paso accionable",
          relative_duration: "18 a 30 segundos",
        },
        {
          section: "cta",
          purpose: "Pedir la palabra clave en comentarios para recibir el recurso",
          relative_duration: "30 a 35 segundos",
        },
      ],
      hook_type: "Error común ('Deja de hacer X si quieres Y')",
      pacing: "Rápido, frases cortas, corte cada 2 a 3 segundos",
      visual_elements: [
        "Texto en pantalla con ✗ en rojo para lo que no funciona",
        "Texto en pantalla con ✓ en verde para lo que sí",
        "Zoom in en la revelación de la solución",
      ],
      cta_type: "Comentario con palabra clave",
      replicable_rules: [
        "El hook siempre nombra un comportamiento que la audiencia reconoce como propio",
        "Nunca revelar la solución antes del segundo 18",
        "Exactamente un consejo accionable en la solución, no una lista",
        "El CTA pide una palabra concreta, no 'sígueme'",
      ],
    },
  },
  {
    name: "Tier List",
    contentType: "reel",
    performanceNotes:
      "Ranking de opciones del nicho de peor a mejor. Genera comentarios porque la audiencia discute el orden.",
    skeleton: {
      name: "Tier List",
      structure: [
        {
          section: "hook",
          purpose: "Anunciar que se van a rankear las opciones más populares del nicho",
          relative_duration: "0 a 3 segundos",
        },
        {
          section: "contexto",
          purpose: "Explicar el criterio del ranking en una frase",
          relative_duration: "3 a 7 segundos",
        },
        {
          section: "problema",
          purpose: "Rankear las opciones malas o sobrevaloradas (tiers C y B)",
          relative_duration: "7 a 20 segundos",
        },
        {
          section: "solucion",
          purpose: "Revelar la opción tier S y por qué",
          relative_duration: "20 a 32 segundos",
        },
        {
          section: "cta",
          purpose: "Preguntar con qué tier no están de acuerdo y ofrecer la guía completa",
          relative_duration: "32 a 38 segundos",
        },
      ],
      hook_type: "Promesa de ranking ('Rankeé todas las X y esto es lo que encontré')",
      pacing: "Medio, una opción cada 3 a 4 segundos, aceleración hacia el tier S",
      visual_elements: [
        "Tabla de tiers en pantalla que se va llenando",
        "Letras S, A, B, C con colores",
        "Cada opción aparece como tarjeta al nombrarla",
      ],
      cta_type: "Pregunta abierta + palabra clave",
      replicable_rules: [
        "Mínimo 4 opciones, máximo 7",
        "Poner al menos una opción popular en tier bajo para provocar debate",
        "El tier S siempre va al final y se justifica con un dato",
        "El criterio del ranking se dice explícitamente",
      ],
    },
  },
  {
    name: "Historia de cliente antes / después",
    contentType: "reel",
    performanceNotes:
      "Caso real con números concretos. Convierte muy bien porque la prueba social es específica.",
    skeleton: {
      name: "Historia de cliente antes / después",
      structure: [
        {
          section: "hook",
          purpose: "Decir el resultado final con número y tiempo ('X pasó de A a B en N días')",
          relative_duration: "0 a 3 segundos",
        },
        {
          section: "contexto",
          purpose: "Presentar al cliente y su situación inicial con la que la audiencia se identifica",
          relative_duration: "3 a 10 segundos",
        },
        {
          section: "problema",
          purpose: "Qué había intentado antes y por qué no funcionó",
          relative_duration: "10 a 17 segundos",
        },
        {
          section: "solucion",
          purpose: "Los 2 o 3 cambios concretos que hicieron la diferencia",
          relative_duration: "17 a 30 segundos",
        },
        {
          section: "cta",
          purpose: "Invitar a quien esté en la situación inicial a comentar la palabra clave",
          relative_duration: "30 a 35 segundos",
        },
      ],
      hook_type: "Resultado con número ('De 480 a 720 en 90 días')",
      pacing: "Narrativo, pausado en el antes, más rápido en la solución",
      visual_elements: [
        "Número del antes y después en pantalla, grande",
        "Captura o testimonio del cliente (con permiso)",
        "Lista de los cambios como bullets que aparecen uno a uno",
      ],
      cta_type: "Identificación + palabra clave",
      replicable_rules: [
        "El hook lleva siempre un número de inicio, un número final y un plazo",
        "El cliente tiene que ser reconocible como 'alguien como yo'",
        "Nunca prometer el mismo resultado, mostrar el proceso",
        "Máximo 3 cambios en la solución",
      ],
    },
  },
  {
    name: "5 errores que te están costando",
    contentType: "carousel",
    performanceNotes:
      "Carrusel de errores con la solución en cada slide. Alto en guardados porque funciona como checklist.",
    skeleton: {
      name: "5 errores que te están costando",
      structure: [
        {
          section: "portada",
          purpose: "Título con el número de errores y lo que cuestan (dinero, tiempo, clientes)",
          relative_duration: "slide 1",
        },
        {
          section: "gancho",
          purpose: "Afirmar que la mayoría comete al menos 3 de estos sin saberlo",
          relative_duration: "slide 2",
        },
        {
          section: "errores",
          purpose: "Un error por slide: nombre del error, por qué duele, qué hacer en su lugar",
          relative_duration: "slides 3 a 7",
        },
        {
          section: "resumen",
          purpose: "Checklist de los 5 en un solo slide para que lo guarden",
          relative_duration: "slide 8",
        },
        {
          section: "cta",
          purpose: "Pedir guardar y comentar la palabra clave para recibir la versión completa",
          relative_duration: "slide 9",
        },
      ],
      hook_type: "Número + pérdida ('5 errores que te están costando clientes')",
      pacing: "Un concepto por slide, máximo 25 palabras por slide",
      visual_elements: [
        "Número grande del error en cada slide",
        "Icono ✗ en el error y ✓ en la corrección",
        "Slide de resumen con checkboxes",
      ],
      cta_type: "Guardar + comentario con palabra clave",
      replicable_rules: [
        "Exactamente 5 errores, ni más ni menos",
        "Cada error lleva su corrección en el mismo slide",
        "El slide de resumen es obligatorio: es lo que se guarda",
        "La portada tiene máximo 8 palabras",
      ],
    },
  },
  {
    name: "Mito vs realidad",
    contentType: "carousel",
    performanceNotes:
      "Desmonta creencias del nicho. Genera comentarios de gente defendiendo el mito.",
    skeleton: {
      name: "Mito vs realidad",
      structure: [
        {
          section: "portada",
          purpose: "Enunciar el mito más popular del nicho como si fuera cierto",
          relative_duration: "slide 1",
        },
        {
          section: "giro",
          purpose: "Decir que es falso y que hay más mitos así",
          relative_duration: "slide 2",
        },
        {
          section: "mitos",
          purpose: "Un mito por slide: el mito en grande, la realidad debajo con un dato",
          relative_duration: "slides 3 a 8",
        },
        {
          section: "cta",
          purpose: "Preguntar cuál creían y ofrecer el recurso con la palabra clave",
          relative_duration: "slide 9",
        },
      ],
      hook_type: "Afirmación falsa presentada como verdad",
      pacing: "Mito arriba, realidad abajo, mismo layout en todos los slides",
      visual_elements: [
        "Mito tachado en la parte superior del slide",
        "Realidad en color de marca debajo",
        "Un dato o cifra por slide",
      ],
      cta_type: "Pregunta + palabra clave",
      replicable_rules: [
        "El mito de la portada tiene que ser uno que la audiencia realmente crea",
        "Cada realidad lleva un dato, no solo opinión",
        "Entre 4 y 6 mitos",
        "Nunca burlarse de quien cree el mito",
      ],
    },
  },
  {
    name: "Secuencia de venta en 4 stories",
    contentType: "story",
    performanceNotes:
      "Secuencia clásica que vende: conectar, probar, mostrar, pedir. Pensada para publicar el mismo día.",
    skeleton: {
      name: "Secuencia de venta en 4 stories",
      structure: [
        {
          section: "conexion",
          purpose: "Contar algo personal o del día a día que conecte con el dolor de la audiencia",
          relative_duration: "story 1",
        },
        {
          section: "prueba",
          purpose: "Mostrar un resultado, testimonio o captura que demuestre que funciona",
          relative_duration: "story 2",
        },
        {
          section: "producto",
          purpose: "Explicar qué es la oferta y para quién es, en 2 frases",
          relative_duration: "story 3",
        },
        {
          section: "cta",
          purpose: "Pedir una acción única: responder la story, sticker o link",
          relative_duration: "story 4",
        },
      ],
      hook_type: "Confesión personal o momento cotidiano",
      pacing: "Una idea por story, texto corto, cara a cámara o captura",
      visual_elements: [
        "Story 1 cara a cámara sin producción",
        "Story 2 captura de resultado o testimonio",
        "Story 4 con sticker de pregunta o link",
      ],
      cta_type: "Respuesta directa a la story",
      replicable_rules: [
        "La primera story nunca vende",
        "La prueba tiene que ser real y específica",
        "Un solo CTA en la última story",
        "Toda la secuencia se publica en el mismo bloque horario",
      ],
    },
  },
  {
    name: "Pregunta del seguidor",
    contentType: "story",
    performanceNotes:
      "Responder una pregunta real (o frecuente) de la audiencia. Genera más preguntas y conversación en DM.",
    skeleton: {
      name: "Pregunta del seguidor",
      structure: [
        {
          section: "conexion",
          purpose: "Mostrar la pregunta recibida (captura o sticker) y decir que es muy común",
          relative_duration: "story 1",
        },
        {
          section: "prueba",
          purpose: "Responder con la experiencia propia o de un cliente",
          relative_duration: "story 2",
        },
        {
          section: "producto",
          purpose: "Mencionar que esto es parte de lo que se trabaja en la oferta",
          relative_duration: "story 3",
        },
        {
          section: "cta",
          purpose: "Abrir sticker de preguntas para la siguiente ronda",
          relative_duration: "story 4",
        },
      ],
      hook_type: "Pregunta real de la audiencia",
      pacing: "Conversacional, como respuesta directa",
      visual_elements: [
        "Captura de la pregunta con nombre tapado",
        "Cara a cámara respondiendo",
        "Sticker de preguntas al final",
      ],
      cta_type: "Sticker de preguntas",
      replicable_rules: [
        "La pregunta se muestra literal, no parafraseada",
        "La respuesta da valor completo, no la mitad",
        "La mención de la oferta es de una frase, sin presión",
        "Siempre cerrar pidiendo más preguntas",
      ],
    },
  },
];

async function main() {
  const { neonConfig } = await import("@neondatabase/serverless");
  const ws = (await import("ws")).default;
  neonConfig.webSocketConstructor = ws;

  const { withServiceContext } = await import("../src/db/context");
  const { formats } = await import("../src/db/schema");
  const { and, eq } = await import("drizzle-orm");

  let inserted = 0;
  let skipped = 0;

  for (const seed of SEEDS) {
    const parsed = skeletonOutput.safeParse(seed.skeleton);
    if (!parsed.success) {
      throw new Error(
        `Skeleton inválido para "${seed.name}": ${JSON.stringify(parsed.error.issues)}`,
      );
    }

    const done = await withServiceContext(async (tx) => {
      const [existing] = await tx
        .select({ id: formats.id })
        .from(formats)
        .where(
          and(
            eq(formats.ownerScope, "global"),
            eq(formats.name, seed.name),
            eq(formats.contentType, seed.contentType),
          ),
        )
        .limit(1);
      if (existing) return false;

      await tx.insert(formats).values({
        ownerScope: "global",
        userId: null,
        name: seed.name,
        contentType: seed.contentType,
        skeleton: parsed.data,
        performanceNotes: seed.performanceNotes,
        status: "active",
      });
      return true;
    });

    if (done) {
      inserted += 1;
      console.log(`  + ${seed.name} [${seed.contentType}]`);
    } else {
      skipped += 1;
      console.log(`  = ${seed.name} [${seed.contentType}] (ya existe)`);
    }
  }

  console.log(`\nSeed listo: ${inserted} insertados, ${skipped} ya existían.`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
