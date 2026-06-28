import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { AUDASYAS_SYSTEM_PROMPT } from "./guidance.functions";

const AnalysisSchema = z.object({
  parecer: z.string(),
  justificativa: z.string(),
  reflexao: z.string(),
});

export type AssetAnalysis = {
  parecer: "Compra forte" | "Aguardar" | "Rebalancear";
  justificativa: string;
  reflexao: string;
};

const InputSchema = z.object({
  ticker: z.string().min(1).max(12),
  preco_atual: z.number().nullable(),
  variacao_dia: z.number().nullable(),
  percentual_carteira: z.number().min(0).max(100),
  aporte_mensal: z.number().min(0),
});

export const analyzeAsset = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const valorAlocado = (data.aporte_mensal * data.percentual_carteira) / 100;

    const { output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: AUDASYAS_SYSTEM_PROMPT,
      output: Output.object({ schema: AnalysisSchema }),
      prompt: `Analise o ativo abaixo sob a ótica da Colheita da Tâmara (20/30/50 anos) e da Regra dos Percentuais (3% conservador / 5% equilibrado / 10% audaz).

Dados:
- Ticker: ${data.ticker}
- Preço atual: ${data.preco_atual !== null ? `R$ ${data.preco_atual.toFixed(2)}` : "indisponível"}
- Variação do dia: ${data.variacao_dia !== null ? `${data.variacao_dia.toFixed(2)}%` : "indisponível"}
- Percentual definido na carteira: ${data.percentual_carteira}%
- Aporte mensal total: R$ ${data.aporte_mensal.toFixed(2)}
- Valor mensal destinado a este ativo: R$ ${valorAlocado.toFixed(2)}

Responda em português do Brasil:
- parecer: exatamente um de "Compra forte", "Aguardar", "Rebalancear".
- justificativa: 2-3 frases sóbrias citando o horizonte de longo prazo e, se couber, princípio bíblico de prudência (Provérbios/Eclesiastes). NUNCA recomende resgate do principal.
- reflexao: pergunta reflexiva curta sobre o legado que este aporte constrói.`,
    });

    const normalize = (s: string): AssetAnalysis["parecer"] => {
      const v = s.toLowerCase();
      if (v.includes("compra")) return "Compra forte";
      if (v.includes("rebalance")) return "Rebalancear";
      return "Aguardar";
    };
    return {
      parecer: normalize(output.parecer),
      justificativa: output.justificativa,
      reflexao: output.reflexao,
    } satisfies AssetAnalysis;
  });