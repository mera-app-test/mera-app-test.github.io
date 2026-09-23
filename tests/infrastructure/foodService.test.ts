// Use case-ovi namirnica nad pravim statičkim referentnim podacima.
import { describe, expect, it } from "vitest";
import { createFoodService } from "../../src/application";
import { createStaticReferenceData } from "../../src/infrastructure/reference-static/referenceData";

const svc = createFoodService(createStaticReferenceData());

describe("FoodService", () => {
  it("pretraga ćirilicom nalazi oba oblika sočiva", async () => {
    const r = await svc.search("сочиво");
    expect(r.map((x) => x.id).sort()).toEqual(["sociva", "sociva-kuvano"]);
    expect(r.find((x) => x.id === "sociva")!.kcalPer100g).toEqual({ kind: "exact", value: 340, decimals: 0 });
  });
  it("detalj: 150 g kuvanog pirinča, redosled kao na deklaraciji, drugi oblik ponuđen", async () => {
    const d = (await svc.detail("pirinac-beli-kuvan", 150))!;
    // 125,16 kcal/100 g × 1,5 = 187,74 → prikaz 188 (dobro potvrđeno, ceo broj)
    expect(d.energy).toEqual({ kind: "exact", value: 188, decimals: 0 });
    expect(d.rows.map((r) => r.key)).toEqual(["fat", "saturatedFat", "availableCarbohydrate", "sugars", "fiber", "protein", "salt", "sodium"]);
    expect(d.otherForms).toEqual([{ id: "pirinac-beli", form: "sirovo" }]);
    expect(d.why.source.fdcId).toBe("169757");
  });
  it("„Zašto?\" navodi dopunjene nutrijente i izvor dopune", async () => {
    const d = (await svc.detail("ovsene-pahuljice", 100))!;
    expect(d.why.fill?.fdcId).toBe("169705");
    expect(d.why.filledNutrients).toEqual(["saturatedFat", "fiber"]);
    expect(d.why.missing).toEqual(["sugars"]);
  });
  it("status podataka je ODOBRENO", async () => {
    expect((await svc.info()).foodsStatus).toBe("ODOBRENO");
  });
});
