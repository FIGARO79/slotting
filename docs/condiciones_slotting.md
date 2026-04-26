# Documentación: Motor de Slotting e IA (Logix WMS v2.0)

Este documento detalla los criterios lógicos, de Inteligencia Artificial y reglas de negocio que el sistema utiliza para optimizar el almacenamiento masivo y las sugerencias de ubicación.

---

## 1. Clasificación por Eficiencia (Scoring Físico 0-10)

A diferencia de cálculos teóricos, el sistema utiliza un **Puntaje de Eficiencia Físico** definido manualmente en el archivo `layout_almacen.xlsx`:

*   **Score 8-10 (Premium):** Ubicaciones de máxima velocidad, cerca de zonas de despacho o en niveles de fácil acceso.
*   **Score 4-7 (Medio):** Ubicaciones estándar de Rack o Minutería con recorridos moderados.
*   **Score 0-3 (Bajo):** Ubicaciones ineficientes, lejanas o de difícil acceso (Rincones, niveles muy altos, pasillos muertos).

---

## 2. Reglas de Negocio Inteligentes (Motor V2)

El motor evalúa los atributos del ítem para asignarlo a la mejor zona y nivel, priorizando el orden estructural y la eficiencia de picking.

### A. Zonificación y Niveles
*   **Cantilever:** Ítems con descripción `"ROD"` o `"INTEGRAL STEEL"`.
*   **Minutería:** Ítems con peso unitario inferior a **0.1 kg** (ajustado para incluir piezas pequeñas ligeras).
*   **Rack (Alta Rotación - SIC W, X):** Ubicados preferentemente en **Niveles 0, 1 o 2** (Piso y cintura) para máxima velocidad manual.
*   **Rack (Pesados - >10 kg):** Ubicados en **Niveles altos (3, 4, 5)** debido a la disponibilidad de espacio libre para montacargas.

### B. Regla de "Exilio" para Baja Rotación (SIC 0, Z, L)
Para preservar las ubicaciones eficientes, el sistema aplica una regla restrictiva para ítems que no se mueven:
*   **Criterio:** Artículos con SIC **0** (Nulo), **Z** (Mínimo) o **L** (Bajo).
*   **Restricción:** Solo se permite su ubicación en bines con **Score <= 3** y marcados como **"Cold"**.
*   **Flexibilidad:** Ignoran restricciones de zona habituales para encontrar cualquier "rincón" disponible en el almacén.
*   **Peso:** Menor a **0.1 kg** colocar en zonas frias de minutería, mayor a 0.1 kg en zonas frias de rack de nivel 2 o 3. si minuteria esta saturado poner en los niveles 2 o 3 de zonas frias de rack.


## 3. Optimizadores de Espacio (Afinidad y Llenado)

El sistema ya no busca solo un bin vacío, sino que busca el bin **más inteligente**:

1.  **Afinidad por Familia (SIC):** Si hay varios bines candidatos con el mismo score, el sistema elegirá aquel que ya contenga otros artículos del **mismo SIC Code**. Esto agrupa el inventario por velocidad de rotación.
2.  **Llenado Compacto:** A igualdad de condiciones, el motor prefiere un bin que ya tenga algo de stock (sin superar el límite) antes que "ensuciar" un bin virgen. Esto consolida el inventario y libera bines completos para recepciones voluminosas.

---

## 4. Aprendizaje Inteligente (IA Slotting)

El motor aprende de tus decisiones reales durante la **Sincronización de Archivos**:

*   **Detección de Movimientos:** Compara el archivo Excel del ERP contra la base de datos actual para ver qué SKUs se han movido físicamente.
*   **Filtro de Calidad (Validation Layer):** La IA **solo aprende** si la nueva ubicación elegida por el operario tiene un **Score Físico >= 6**. 
*   **Protección:** Esto evita que el sistema aprenda errores humanos o ubicaciones temporales ineficientes, garantizando que el conocimiento acumulado siempre sea de alta calidad.

---

## 5. Capacidad y Límites de Mezcla

Para evitar la saturación y facilitar el conteo cíclico, se aplican límites estrictos de SKUs distintos por bin:
*   **Minutería:** Máximo **3 SKUs**.
*   **Nivel 2 (Rack):** Máximo **6 SKUs** (Zona de alta densidad).
*   **Resto de Niveles:** Máximo **4 SKUs**.

---

## 6. Integración con ERP (Excel Real)

El sistema está configurado para leer directamente el archivo descargado de SAP/ERP:
*   **Nombre exacto:** `AURRSGLBD0250 - Item Stockroom Balance.xlsx`
*   **Tolerancia:** El lector es flexible con espacios simples, dobles o nombres de columnas descriptivos (ej. "Item Code" con espacios).
