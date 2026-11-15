import { describe, it, expect } from "vitest";
import { tetoReserva, diagnosticoCustoVida, sorveteParaSorveteria, transbordoReserva } from "./strategy";

describe("Reserva e custo de vida", () => {
  it("teto da reserva é 3x o salário (5000 -> 15000)", () => {
    expect(tetoReserva(5000)).toBe(15000);
  });
  it("custo até 70% do salário é saudável", () => {
    expect(diagnosticoCustoVida(5000, 3500)).toBe("saudavel");
  });
  it("custo entre 70% e 90% pede atenção", () => {
    expect(diagnosticoCustoVida(5000, 4000)).toBe("atencao");
  });
  it("custo acima de 90% é alerta", () => {
    expect(diagnosticoCustoVida(5000, 4800)).toBe("alerta");
  });
  it("o que passa de 15000 transborda para a carteira", () => {
    expect(transbordoReserva(15150, 15000)).toBe(150);
    expect(transbordoReserva(12000, 15000)).toBe(0);
  });
  it("sem juros, R$450/mês por 20 anos = 108000", () => {
    expect(sorveteParaSorveteria(450, 20, 0)).toBe(108000);
  });
});
