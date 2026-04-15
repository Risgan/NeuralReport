from dataclasses import dataclass
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy.orm import Session

from app.models.catalogs import Param
from app.models.files import FileTotal


@dataclass
class StoreTaxes:
    """Impuestos calculados para una tienda."""
    store_code:   int
    value_month1: float
    value_month2: float
    value_month3: float
    total_value:  float
    iva:          float
    retefuente:   float
    rete_ica:     float
    total_neto:   float


def _round(value: float, decimals: int = 2) -> float:
    """Redondeo exacto usando Decimal para evitar errores de punto flotante."""
    return float(
        Decimal(str(value)).quantize(
            Decimal("0." + "0" * decimals),
            rounding=ROUND_HALF_UP,
        )
    )


def get_tax_rates(db: Session) -> dict[str, float]:
    """
    Obtiene las tasas activas desde la tabla params.
    Retorna dict con claves: iva, fte, ica
    """
    params = db.query(Param).filter(Param.active == True).all()
    rates  = {p.name: float(p.value) for p in params}

    return {
        "iva": rates.get("iva", 0.19),
        "fte": rates.get("fte", 0.035),
        "ica": rates.get("ica", 0.0069),
    }


def calculate_report_rows(
    db:       Session,
    file1_id: int,
    file2_id: int,
    file3_id: int,
) -> list[StoreTaxes]:
    """
    Consolida los totales de los 3 meses y calcula los impuestos
    por cada tienda única encontrada entre los 3 archivos.

    - Si una tienda no aparece en un mes su valor es 0.
    - Los impuestos se calculan sobre el total de los 3 meses.
    - total_neto = total_value - retefuente - rete_ica  (IVA no se resta)
    """
    rates = get_tax_rates(db)

    # Cargar totales de los 3 meses en dicts {store_code: total_value}
    def load_totals(file_id: int) -> dict[int, float]:
        rows = db.query(FileTotal).filter(FileTotal.file_id == file_id).all()
        return {r.store_code: float(r.total_value) for r in rows}

    month1 = load_totals(file1_id)
    month2 = load_totals(file2_id)
    month3 = load_totals(file3_id)

    # Unión de todas las tiendas únicas de los 3 meses
    all_stores = set(month1) | set(month2) | set(month3)

    results: list[StoreTaxes] = []

    for store_code in sorted(all_stores):
        v1 = month1.get(store_code, 0.0)
        v2 = month2.get(store_code, 0.0)
        v3 = month3.get(store_code, 0.0)

        total = _round(v1 + v2 + v3)
        iva   = _round(total * rates["iva"])
        fte   = _round(total * rates["fte"])
        ica   = _round(total * rates["ica"], 4)
        neto  = _round(total - fte - ica)

        results.append(StoreTaxes(
            store_code=store_code,
            value_month1=_round(v1),
            value_month2=_round(v2),
            value_month3=_round(v3),
            total_value=total,
            iva=iva,
            retefuente=fte,
            rete_ica=ica,
            total_neto=neto,
        ))

    return results