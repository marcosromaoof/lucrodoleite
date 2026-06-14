"use client";

import { useState } from "react";
import { FormField } from "@/components/ui/form-field";

type ExpenseCategoryFieldsProps = {
  categories: readonly string[];
  defaultCategory?: string | null;
  defaultQuantity?: number | null;
  defaultUnit?: string | null;
  defaultUnitPrice?: number | null;
  eligibleCategories: readonly string[];
  units: readonly string[];
};

export function ExpenseCategoryFields({
  categories,
  defaultCategory,
  defaultQuantity,
  defaultUnit,
  defaultUnitPrice,
  eligibleCategories,
  units,
}: ExpenseCategoryFieldsProps) {
  const [category, setCategory] = useState(defaultCategory ?? "");
  const showQuantityFields = eligibleCategories.includes(category);

  return (
    <>
      <FormField label="Categoria">
        <select className="field" name="category" onChange={(event) => setCategory(event.target.value)} required value={category}>
          <option value="">Selecione</option>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FormField>

      {showQuantityFields ? (
        <div className="grid gap-4 md:grid-cols-3">
          <FormField label="Quantidade">
            <input
              className="field"
              defaultValue={defaultQuantity ?? undefined}
              min="0"
              name="quantity"
              step="0.001"
              type="number"
            />
          </FormField>
          <FormField label="Unidade">
            <select className="field" defaultValue={defaultUnit ?? ""} name="unit">
              <option value="">Selecione</option>
              {units.map((unit) => (
                <option key={unit} value={unit}>
                  {unit}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Valor unitário">
            <input
              className="field"
              defaultValue={defaultUnitPrice ?? undefined}
              min="0"
              name="unitPrice"
              step="0.0001"
              type="number"
            />
          </FormField>
        </div>
      ) : null}
    </>
  );
}
