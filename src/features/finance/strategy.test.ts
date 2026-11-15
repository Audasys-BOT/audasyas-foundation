import { describe, it, expect } from "vitest";
import {
  capacidadeAporte,
  priorizarReserva,
  isOpportunity,
  distribuirAtivos,
  dividirAporte,
  patrimonioParaRenda,
  mesesAteRendaPassiva,
  descreverMeses,
  diasAteData,
  mesesAteData,
  resumoDividas,
  valorFuturoAportes,
} from "./strategy";

describe("capacidadeAporte", () => {
  it("calcula salário − custo fixo", () => {
    expect(capacidadeAporte(8000, 5000)).toBe(3000);
  });

  it("permite valor negativo quando o custo excede o salário (sinaliza déficit)", () => {
    expect(capacidadeAporte(3000, 5000)).toBe(-2000);
  });

  it("trata zeros/inputs ausentes", () => {
    expect(capacidadeAporte(0, 0)).toBe(0);
    expect(capacidadeAporte(NaN as unknown as number, 100)).toBe(-100);
  });
});

describe("priorizarReserva", () => {
  it("sugere preencher a reserva até o teto, dentro da capacidade", () => {
    const r = priorizarReserva({ capacidade: 3000, reservaAtual: 2000, tetoReserva: 10000 });
    expect(r.reservaFaltante).toBe(8000);
    expect(r.sugestaoReserva).toBe(3000); // limitado pela capacidade
    expect(r.aporteSugerido).toBe(0);
    expect(r.metaAtingida).toBe(false);
  });

  it("aloca o que falta para a reserva e libera o resto para ativos", () => {
    const r = priorizarReserva({ capacidade: 3000, reservaAtual: 9500, tetoReserva: 10000 });
    expect(r.reservaFaltante).toBe(500);
    expect(r.sugestaoReserva).toBe(500);
    expect(r.aporteSugerido).toBe(2500);
    expect(r.metaAtingida).toBe(false);
  });

  it("marca meta atingida quando reserva ≥ teto e libera 100% para ativos", () => {
    const r = priorizarReserva({ capacidade: 3000, reservaAtual: 10000, tetoReserva: 10000 });
    expect(r.reservaFaltante).toBe(0);
    expect(r.sugestaoReserva).toBe(0);
    expect(r.aporteSugerido).toBe(3000);
    expect(r.metaAtingida).toBe(true);
  });

  it("nunca sugere valores negativos", () => {
    const r = priorizarReserva({ capacidade: -500, reservaAtual: 0, tetoReserva: 1000 });
    expect(r.sugestaoReserva).toBe(0);
    expect(r.aporteSugerido).toBe(0);
  });

  it("não considera meta quando teto = 0 (usuário ainda não definiu)", () => {
    const r = priorizarReserva({ capacidade: 3000, reservaAtual: 0, tetoReserva: 0 });
    expect(r.metaAtingida).toBe(false);
    expect(r.aporteSugerido).toBe(3000);
  });
});

describe("isOpportunity (+3% rule)", () => {
  it("é oportunidade quando a queda for ≥ 3%", () => {
    expect(isOpportunity(-3)).toBe(true);
    expect(isOpportunity(-3.01)).toBe(true);
    expect(isOpportunity(-12)).toBe(true);
  });

  it("não é oportunidade para quedas leves, estável ou alta", () => {
    expect(isOpportunity(-2.99)).toBe(false);
    expect(isOpportunity(0)).toBe(false);
    expect(isOpportunity(5)).toBe(false);
  });

  it("não é oportunidade quando a variação é desconhecida", () => {
    expect(isOpportunity(null)).toBe(false);
  });
});

describe("distribuirAtivos (3/5/10 + boost de oportunidade)", () => {
  const assets = [
    { ticker: "KNIP11", pct: 3, change: 0 },
    { ticker: "BBAS3", pct: 5, change: 1.2 },
    { ticker: "ITSA4", pct: 10, change: -1 },
  ];

  it("distribui proporcionalmente aos percentuais (normalizado)", () => {
    const out = distribuirAtivos(1800, assets); // total pct = 18 → 100/300/1000
    const map = Object.fromEntries(out.map((a) => [a.ticker, a]));
    expect(map.KNIP11.base).toBeCloseTo(300, 6); // 3/18 * 1800
    expect(map.BBAS3.base).toBeCloseTo(500, 6); // 5/18 * 1800
    expect(map.ITSA4.base).toBeCloseTo(1000, 6); // 10/18 * 1800
    expect(out.every((a) => !a.isOpportunity)).toBe(true);
    expect(out.every((a) => a.boost === 0)).toBe(true);
    const total = out.reduce((s, a) => s + a.total, 0);
    expect(total).toBeCloseTo(1800, 6);
  });

  it("aplica +3% sobre o base quando a queda do ativo for > 3%", () => {
    const withDrop = [
      { ticker: "KNIP11", pct: 3, change: 0 },
      { ticker: "BBAS3", pct: 5, change: -4.2 }, // oportunidade
      { ticker: "ITSA4", pct: 10, change: -1 },
    ];
    const out = distribuirAtivos(1800, withDrop);
    const bbas = out.find((a) => a.ticker === "BBAS3")!;
    expect(bbas.isOpportunity).toBe(true);
    expect(bbas.base).toBeCloseTo(500, 6);
    expect(bbas.boost).toBeCloseTo(15, 6); // 3% de 500
    expect(bbas.total).toBeCloseTo(515, 6);
    // outros não recebem boost
    expect(out.find((a) => a.ticker === "KNIP11")!.boost).toBe(0);
    expect(out.find((a) => a.ticker === "ITSA4")!.boost).toBe(0);
  });

  it("retorna zeros quando não há ativos ou valor disponível", () => {
    expect(distribuirAtivos(1000, [])).toEqual([]);
    const out = distribuirAtivos(0, assets);
    expect(out.every((a) => a.total === 0)).toBe(true);
  });

  it("ignora valores negativos de aporte (não distribui dívida)", () => {
    const out = distribuirAtivos(-500, assets);
    expect(out.every((a) => a.base === 0 && a.total === 0)).toBe(true);
  });
});

describe("dividirAporte (priorização Reserva → Ativos)", () => {
  it("consome o aporte na reserva até o que falta, restante para ativos", () => {
    const r = dividirAporte({ aporte: 800, reservaFaltante: 500, metaAtingida: false });
    expect(r.valorReserva).toBe(500);
    expect(r.valorAtivos).toBe(300);
  });

  it("todo o aporte vai para reserva quando ela não está coberta", () => {
    const r = dividirAporte({ aporte: 300, reservaFaltante: 1000, metaAtingida: false });
    expect(r.valorReserva).toBe(300);
    expect(r.valorAtivos).toBe(0);
  });

  it("libera 100% para ativos quando a meta foi atingida", () => {
    const r = dividirAporte({ aporte: 1000, reservaFaltante: 0, metaAtingida: true });
    expect(r.valorReserva).toBe(0);
    expect(r.valorAtivos).toBe(1000);
  });
});

describe("integração: capacidade → reserva → distribuição com oportunidade", () => {
  it("fluxo completo com meta atingida e ativo em queda > 3%", () => {
    const cap = capacidadeAporte(10000, 6000); // 4000
    const p = priorizarReserva({ capacidade: cap, reservaAtual: 20000, tetoReserva: 20000 });
    expect(p.metaAtingida).toBe(true);
    expect(p.aporteSugerido).toBe(4000);

    const split = dividirAporte({ aporte: p.aporteSugerido, reservaFaltante: p.reservaFaltante, metaAtingida: p.metaAtingida });
    expect(split.valorAtivos).toBe(4000);

    const out = distribuirAtivos(split.valorAtivos, [
      { ticker: "A", pct: 3, change: 0 },
      { ticker: "B", pct: 5, change: -5 }, // oportunidade
      { ticker: "C", pct: 10, change: 1 },
    ]);
    const b = out.find((x) => x.ticker === "B")!;
    // 5/18 * 4000 = 1111.111... base; boost = 3%
    expect(b.base).toBeCloseTo(1111.1111, 3);
    expect(b.boost).toBeCloseTo(33.3333, 3);
    expect(b.total).toBeCloseTo(1144.4444, 3);
  });

  it("fluxo com reserva pendente: nada distribuído em ativos", () => {
    const cap = capacidadeAporte(8000, 5000); // 3000
    const p = priorizarReserva({ capacidade: cap, reservaAtual: 1000, tetoReserva: 20000 });
    expect(p.sugestaoReserva).toBe(3000);
    expect(p.aporteSugerido).toBe(0);
    const split = dividirAporte({ aporte: 3000, reservaFaltante: p.reservaFaltante, metaAtingida: p.metaAtingida });
    expect(split.valorReserva).toBe(3000);
    expect(split.valorAtivos).toBe(0);
  });
});
describe("projeção de liberdade financeira", () => {
  const taxa = 0.08 / 12;

  it("calcula o patrimônio necessário para uma renda mensal", () => {
    expect(patrimonioParaRenda(2400, taxa)).toBeCloseTo(360000, 6);
  });

  it("devolve zero quando não há renda alvo ou taxa", () => {
    expect(patrimonioParaRenda(0, taxa)).toBe(0);
    expect(patrimonioParaRenda(2400, 0)).toBe(0);
  });

  it("converte aporte + renda alvo em meses", () => {
    const meses = mesesAteRendaPassiva({ rendaAlvo: 2400, aporteMensal: 1200, taxaMensal: taxa });
    expect(meses).not.toBeNull();
    // patrimônio no mês n = 1200 * ((1+i)^n - 1) / i deve cobrir a renda alvo
    const n = meses as number;
    const patrimonio = 1200 * ((Math.pow(1 + taxa, n) - 1) / taxa);
    expect(patrimonio).toBeGreaterThanOrEqual(360000 - 1);
  });

  it("não tem data quando não existe aporte", () => {
    expect(mesesAteRendaPassiva({ rendaAlvo: 2400, aporteMensal: 0, taxaMensal: taxa })).toBeNull();
    expect(mesesAteRendaPassiva({ rendaAlvo: 2400, aporteMensal: -300, taxaMensal: taxa })).toBeNull();
  });

  it("descreve meses em anos e meses", () => {
    expect(descreverMeses(0)).toBe("0 meses");
    expect(descreverMeses(1)).toBe("1 mês");
    expect(descreverMeses(12)).toBe("1 ano");
    expect(descreverMeses(171)).toBe("14 anos e 3 meses");
  });
});

describe("contagem regressiva de dívidas", () => {
  // Fixa "hoje" em 06/06/2026 para os testes serem determinísticos.
  const hoje = new Date(2026, 5, 6);

  it("conta dias até a data e devolve negativo quando já passou", () => {
    expect(diasAteData("2026-06-06", hoje)).toBe(0);
    expect(diasAteData("2027-06-06", hoje)).toBe(365);
    expect(diasAteData("2026-05-06", hoje)).toBe(-31);
    expect(diasAteData("data-invalida", hoje)).toBe(0);
  });

  it("converte a data final em meses cheios", () => {
    expect(mesesAteData("2027-06-06", hoje)).toBe(12);
    expect(mesesAteData("2027-11-15", hoje)).toBe(18);
    expect(mesesAteData("2026-06-06", hoje)).toBe(0);
  });

  it("consolida o dinheiro preso por mês e até a quitação", () => {
    const r = resumoDividas(
      [
        { id: "carro", nome: "Carro", parcela: 1300, ultimaParcela: "2027-06-06" }, // 12 meses
        { id: "cartao", nome: "Cartão", parcela: 200, ultimaParcela: "2027-11-15" }, // 18 meses
      ],
      hoje,
    );
    expect(r.totalMensal).toBe(1500);
    expect(r.totalAPagar).toBe(1300 * 12 + 200 * 18);
    expect(r.mesesAteLiberdade).toBe(18);
    expect(r.dataLiberdade).toBe("2027-11-15");
    // ordenado da quitação mais próxima para a mais distante
    expect(r.detalhes.map((d) => d.id)).toEqual(["carro", "cartao"]);
    expect(r.detalhes[0].mesesRestantes).toBe(12);
    expect(r.detalhes[0].diasRestantes).toBe(365);
  });

  it("deixa de fora as dívidas já vencidas", () => {
    const r = resumoDividas(
      [{ id: "antiga", nome: "Empréstimo antigo", parcela: 500, ultimaParcela: "2026-01-10" }],
      hoje,
    );
    expect(r.detalhes[0].quitada).toBe(true);
    expect(r.totalMensal).toBe(0);
    expect(r.totalAPagar).toBe(0);
    expect(r.mesesAteLiberdade).toBe(0);
    expect(r.dataLiberdade).toBeNull();
  });

  it("ignora parcelas negativas ou ausentes", () => {
    const r = resumoDividas(
      [{ id: "x", nome: "Sem valor", parcela: -100, ultimaParcela: "2027-06-06" }],
      hoje,
    );
    expect(r.totalMensal).toBe(0);
    expect(r.detalhes[0].restanteAPagar).toBe(0);
  });

  it("projeta o valor do dinheiro liberado após a quitação", () => {
    const taxa = 0.08 / 12;
    expect(valorFuturoAportes({ aporteMensal: 1000, meses: 12, taxaMensal: 0 })).toBe(12000);
    const comJuros = valorFuturoAportes({ aporteMensal: 1000, meses: 12, taxaMensal: taxa });
    expect(comJuros).toBeGreaterThan(12000);
    expect(comJuros).toBeCloseTo(1000 * ((Math.pow(1 + taxa, 12) - 1) / taxa), 6);
    expect(valorFuturoAportes({ aporteMensal: 0, meses: 12, taxaMensal: taxa })).toBe(0);
    expect(valorFuturoAportes({ aporteMensal: 1000, meses: 0, taxaMensal: taxa })).toBe(0);
  });
});
