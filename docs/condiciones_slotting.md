si ves bien pero n# Documentacion: Condiciones de Slotting e IA (Logix WMS)

Este documento detalla los criterios logicos, de Inteligencia Artificial y reglas de negocio que el sistema Logix utiliza para sugerir ubicaciones optimas de almacenamiento durante los procesos de Inbound (Recepcion).

---

## 1. Clasificacion por Rotacion (SIC Code / ABC Dinamico)

El sistema determina la rotacion de un item (si es "Hot" o "Cold") utilizando un sistema de Prioridades Jerarquicas:

*   **PRIORIDAD 1 (Maestro ERP):** El sistema lee en tiempo real el valor oficial de la columna `SIC_Code_stockroom` desde el archivo maestro (SAP/ERP). Si el ERP ya calculo la rotacion (ej. `W`, `X`, `Z`), Logix obedece esta clasificacion matematicamente perfecta sin cuestionarla.
*   **PRIORIDAD 2 (Calculo Local - Fallback):** Solo si el maestro no proporciona un `SIC Code` valido (viene vacio, '0' o 'N/A'), Logix calculara los "hits" (frecuencia de recepcion) de los ultimos 90 dias locales para adivinar la rotacion:

| Codigo | Rango de Hits (90 dias) | Zona Ideal |
| :--- | :--- | :--- |
| **W** | > 30 | Alta Rotacion (Hot) |
| **X** | 11 - 30 | Alta Rotacion (Hot) |
| **Y** | 7 - 10 | Alta Rotacion (Hot) |
| **K** | 5 - 6 | Baja Rotacion (Cold) |
| **L** | 3 - 4 | Baja Rotacion (Cold) |
| **Z** | 1 - 2 | Baja Rotacion (Cold) |
| **0** | 0 | Baja Rotacion (Cold) |

---

## 2. Reubicacion Proactiva (Optimizador Espacial)

A diferencia de los sistemas estaticos, Logix evalua si la ubicacion actual de un item sigue siendo la optima.
Si un item esta guardado en un cajon (ej. zona `Cold`) pero su clasificacion de rotacion cambia (ej. SAP lo actualiza a `W - Hot`), el sistema forzara una sugerencia de reubicacion proactiva hacia un cajon `Hot` vacio durante su proxima recepcion, rompiendo el estatus quo para optimizar los tiempos de picking.

---

## 3. Reglas de Asignacion por Atributos Fisicos

El motor de slotting tradicional evalua las caracteristicas fisicas antes de sugerir un nivel y zona:

### A. Zonificacion por Descripcion
*   **Cantilever:** Si el nombre del item contiene las palabras clave `"ROD"` o `"INTEGRAL STEEL"`.
*   **Minuteria:** Si el peso unitario del item es inferior a **0.1 kg**.

### B. Niveles en Rack (Basado en Peso y Rotacion)
Si el item no entra en Cantilever o Minuteria, el sistema prioriza la seguridad y el espacio:

1.  **Items Pesados (> 10 kg):** Ubicados obligatoriamente en niveles altos (**3, 4 o 5**) para manipulacion exclusiva con montacargas.
2.  **Alta Rotacion (W, X):** Ubicados en niveles de piso (**0 o 1**) para maximizar la velocidad de picking manual.
3.  **Resto de items (Y, K, L, Z, 0):** Todos los items de peso medio/bajo (<= 10 kg) que no sean criticos se centralizan en el **Nivel 2**, aprovechando la altura ergonomica ideal.

---

## 4. Motor de IA (AI Slotting con Conciencia Espacial)

El servicio `AISlottingService` aprende de las decisiones de los operarios, pero cruza esa informacion con el mapa topologico del almacen para no cometer errores:

1.  **Patron por Item (Alta Confianza):** Si un item especifico se guarda manualmente en una ubicacion al menos **2 veces**, la IA recordara ese bin como la ubicacion preferida.
2.  **Patron por Categoria (Conciencia Espacial):** Si items de la misma rotacion (ej. SIC `W`) se guardan consistentemente en un area al menos **5 veces**, la IA aprendera el patron. Sin embargo, solo sugerira esa ubicacion si el cajon aprendido coincide con la regla de temperatura (Hot/Cold) de la categoria.
3.  **Filtro de Seguridad:** La IA NUNCA aprende de ubicaciones virtuales como `XDOCK`, `PUTAWAY` o `STAGE`.

---

## 5. Excepciones Absolutas (Prioridad Maxima)

1. **Cross-Docking (XDOCK):** Si el item escaneado tiene reservas pendientes para clientes (`xdock_pending > 0`), el sistema ignorara todas las reglas anteriores y la IA, sugiriendo invariablemente **"XDOCK"** (en rojo) para forzar la separacion de la mercancia.
2. **Capacidad del Bin (Regla de Mezcla):** El sistema verifica cuantos SKUs hay en el cajon para evitar saturacion:
    *   **Minuteria:** Maximo **3 SKUs**.
    *   **Nivel 2:** Maximo **6 SKUs** (Zona optimizada de alta densidad).
    *   **Otros Niveles de Rack:** Maximo **4 SKUs**.

---

## ROADMAP: Evolucion a WMS Clase Mundial (Integracion Outbound)

El sistema actual esta preparado arquitectonicamente para absorber datos de Salidas (Outbound / Picking) desde el ERP. Al conectar un CSV o tabla de despachos (ej. `OUTBOUND_ORDERS.csv`), Logix desbloqueara las siguientes capacidades avanzadas:

1.  **Slotting por Afinidad (Market Basket Analysis):**
    *   **Logica:** La IA analizara que items se despachan juntos en las mismas ordenes (ej. Tornillo A + Tuerca B en el 80% de los pedidos).
    *   **Accion:** Durante la recepcion, Logix sugerira guardar esos items en cajones contiguos, reduciendo drasticamente las distancias caminadas durante el picking.
2.  **Reabastecimiento Predictivo (Replenishment Automatico):**
    *   **Logica:** Logix cruzara las ordenes pendientes del dia con el inventario fisico en las ubicaciones "Hot" (nivel de piso).
    *   **Accion:** Si el stock en el nivel 1 es insuficiente para cubrir la demanda del dia, el sistema generara tareas automaticas para que los montacargas bajen pallets desde las zonas de reserva (niveles 4 o 5) antes de que inicie el turno de picking.
3.  **Inventario Perpetuo en Tiempo Real:**
    *   **Logica:** Descontar inventario al milisegundo desde Logix, sin esperar la actualizacion por lotes del ERP.
    *   **Accion:** Evitar que el sistema sugiera guardar mercancia en un cajon que SAP considera medio lleno, pero que acaba de vaciarse fisicamente hace unos minutos.
4.  **Deteccion de Zombis (Campana de Limpieza):**
    *   **Logica:** Identificar items almacenados en posiciones "Premium" (Hot Spots) que llevan mas de 6 meses sin una sola salida registrada.
    *   **Accion:** Generar reportes automaticos sugiriendo la reubicacion de estos items a niveles superiores (Cold Spots), liberando espacio de altisimo valor para mercancia de alta rotacion.
5.  **Rutas de Picking Optimizadas (Pathfinding):**
    *   **Logica:** Teniendo las ordenes de salida y las coordenadas exactas de cada item en el layout de Logix.
    *   **Accion:** Generar una lista de recoleccion digital ordenada logicamente en forma de "S" o "U", garantizando que el operario nunca tenga que volver atras en el mismo pasillo.

---

### Requisitos de Integracion (OUTBOUND_ORDERS.csv)

Para habilitar estas capacidades avanzadas en el futuro, el ERP (SAP) solo necesita exportar un archivo CSV diario o en tiempo real con los movimientos de salida. El archivo debe contener como minimo las siguientes columnas:

| Nombre Sugerido de Columna | Descripcion | Obligatorio |
| :--- | :--- | :--- |
| `Order_ID` | Numero de la orden de venta, orden de produccion o picking. (Clave para analisis de afinidad y agrupamiento). | **Si** |
| `Item_Code` | El codigo unico del SKU (debe coincidir con el maestro). | **Si** |
| `Quantity` | Cantidad de unidades a despachar o despachadas. | **Si** |
| `Timestamp` | Fecha y hora de la creacion de la orden o despacho. | No (pero muy recomendado para predecir picos) |
| `Destination` | Cliente, linea de produccion o area de destino. | No |
