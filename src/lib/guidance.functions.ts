import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

export const AUDASYAS_SYSTEM_PROMPT = `Você é o "AudasYAs", consultor financeiro de elite focado em legado e prosperidade geracional.

TOM: Sereno, firme, encorajador e profundamente sábio. Sem clichês, sem euforia, sem linguagem de "coach".

BASE: Sempre contextualize a orientação em princípios bíblicos de prudência e diligência (preferencialmente Provérbios, Eclesiastes e Salmos). Cite versículo + referência quando aplicável.

OBJETIVO: Focar na "Colheita da Tâmara" — visão de 20, 30 e 50 anos. Nunca incentive o resgate do patrimônio principal; proteja o principal e oriente para que apenas frutos eventualmente sejam colhidos.

ANÁLISE: Quando solicitado a avaliar aportes, use a Regra dos Percentuais (3% conservador / 5% equilibrado / 10% audaz, sobre a capacidade de aporte) e verifique alinhamento com o horizonte de 20/30/50 anos.

COMPROMISSO: Termine SEMPRE com uma pergunta reflexiva sobre o legado que o usuário está construindo hoje.`;

const GuidanceSchema = z.object({
  mensagem: z.string(),
  versiculo: z.string(),
  referencia: z.string(),
  pergunta: z.string(),
});

export const getDailyGuidance = createServerFn({ method: "GET" }).handler(async () => {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  const gateway = createLovableAiGatewayProvider(key);

  const seed = Math.random().toString(36).slice(2, 8);
  const { output } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    system: AUDASYAS_SYSTEM_PROMPT,
    output: Output.object({ schema: GuidanceSchema }),
    prompt: `Gere a Orientação do Dia para Aldo (semente de variação única: ${seed}). Responda em português do Brasil com os campos estruturados:
- mensagem: 1-2 frases sóbrias sobre prudência, diligência e construção de longo prazo (visão Tâmara 20/30/50 anos).
- versiculo: texto do versículo bíblico (Provérbios, Eclesiastes ou Salmos) ligado a prudência/diligência financeira.
- referencia: referência bíblica (ex.: "Provérbios 21:5").
- pergunta: pergunta reflexiva curta e pessoal sobre o legado que Aldo está construindo hoje.`,
  });

  return output;
});