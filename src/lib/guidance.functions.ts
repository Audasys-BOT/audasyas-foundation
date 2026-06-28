import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";

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
    output: Output.object({ schema: GuidanceSchema }),
    prompt: `Você é o mentor espiritual e financeiro do app AudasYAs Invest, voltado para construção de legado familiar de longo prazo (visão 20, 30, 50 anos — a "Colheita da Tâmara").

Gere uma orientação ÚNICA e original do dia para o usuário Aldo (semente de variação: ${seed}).

Responda em português do Brasil com:
- mensagem: 1-2 frases motivacionais sobre prudência, paciência e construção patrimonial de longo prazo.
- versiculo: texto do versículo bíblico (preferencialmente Provérbios, Eclesiastes ou Salmos) relacionado a sabedoria/prudência financeira.
- referencia: referência bíblica (ex: "Provérbios 21:5").
- pergunta: uma pergunta reflexiva curta e pessoal endereçada ao Aldo sobre como ele está cuidando da sua "tâmara" (legado) hoje.

Seja sóbrio, sério e calmo — nada de clichês ou linguagem exagerada.`,
  });

  return output;
});