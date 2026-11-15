import { describe, it, expect } from "vitest";
import { poderDeCompra, alocacaoBarbell, metaReserva1Ano, cotasGratis } from "./snowball";

describe("bola de neve", () => {
  it("soma proventos à poupança", () => expect(poderDeCompra(1000, 45).total).toBe(1045));
  it("divide 95/5", () => expect(alocacaoBarbell(1000)).toEqual({ base: 950, pimenta: 50 }));
  it("reserva 3x salário em 12 meses", () => expect(metaReserva1Ano(4000, 0)).toEqual({ meta: 12000, falta: 12000, parcelaMensal: 1000 }));
  it("cotas grátis", () => expect(cotasGratis(45, 10.2)).toBe(4));
});
