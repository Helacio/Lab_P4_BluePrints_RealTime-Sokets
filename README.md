# Lab P4 — BluePrints en Tiempo Real (Sockets & STOMP)

> **Repositorio:** `DECSIS-ECI/Lab_P4_BluePrints_RealTime-Sokets`  
> **Front:** React + Vite (Canvas, CRUD, y selector de tecnología RT)  
> **Backends guía (elige uno o compáralos):**
> - **Socket.IO (Node.js):** https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md
> - **STOMP (Spring Boot):** https://github.com/DECSIS-ECI/example-backend-stopm/tree/main
>
> 🎥 **Video de la demo:** https://youtu.be/2ylHehlPyBQ

---

## ⬇️ Descarga y puesta en marcha

Para correr el proyecto **solo tenés que ejecutar** [`start-lab5.cmd`](./start-lab5.cmd) (doble clic en Windows). El script se encarga de todo:

1. **Clona** el backend Socket.IO del equipo (solo la primera vez).
2. **Instala** las dependencias de front y back.
3. **Crea** `.env.local` (si no existe) apuntando la API REST a la VM del equipo (`http://68.155.159.205:8080`) y el tiempo real a `http://localhost:3001`.
4. **Levanta** ambos servicios: front en `http://localhost:5173` y Socket.IO en `http://localhost:3001`.

Requisitos: **Git** y **Node.js 18+** con `npm`. Internet solo se necesita la primera vez (para clonar el backend).

Después abrí `http://localhost:5173`, ingresá con `student / student123`, elegí **Socket.IO (Node)** en el selector de tecnología y listo.

> Las secciones siguientes (clonado, `.env.local` y levantado manual) quedan como **referencia opcional** por si querés apuntar a otra API (p. ej. tu Lab P2 local) o ver paso a paso qué hace el script.

---

### 🔧 Referencia opcional: puesta en marcha manual

### Prerequisitos

- **Node.js 18+** (recomendado 20 LTS) y `npm`.
- **API CRUD de la Parte 3** (una de las dos opciones):
  1. **VM del equipo (recomendado)**: ya está desplegada en `http://68.155.159.205:8080` y lista para usar. Credenciales: `student / student123`.
  2. **Local**: el repo `Lab_P2_BluePrints_Java21_API_Security_JWT` (`mvn spring-boot:run`). Requiere Java 21, Maven y, si usas el perfil `pg`, Postgres (o el perfil `dev` con datos en memoria).

### 1) Clonar los repos

```bash
# Frontend de este laboratorio
git clone https://github.com/Helacio/Lab_P4_BluePrints_RealTime-Sokets.git

# Backend de tiempo real Socket.IO (repo del equipo)
git clone https://github.com/Helacio/example-backend-socketio-node-.git
```

> **Importante**: usa el backend Socket.IO del equipo, no el repo guía del curso.
> La versión del equipo emite `blueprint-update` con `{ author, name, point }` a toda la sala
> (`io.to(room)`), que es el contrato que espera este frontend.

### 2) Configurar el frontend

> Si usaste `start-lab5.cmd`, este paso ya quedó resuelto: el script crea `.env.local` por vos.
> Solo hacelo manual si querés apuntar a una API distinta (p. ej. tu Lab P2 local).

En la raíz del frontend crea `.env.local`:

```bash
# REST (API CRUD de la Parte 3): VM del equipo o tu API local
VITE_API_BASE=http://68.155.159.205:8080   # o http://localhost:8080 si corrés el Lab_P2 local

# Tiempo real con Socket.IO
VITE_IO_BASE=http://localhost:3001
```

### 3) Levantar los servicios

Terminal 1 — backend de tiempo real:

```bash
cd <carpeta-del-backend-socketio>
npm i
npm run dev
# Socket.IO en http://localhost:3001
```

Terminal 2 — frontend:

```bash
cd Lab_P4_BluePrints_RealTime-Sokets
npm i
npm run dev
# http://localhost:5173
```

### 4) Probar

1. Abrir `http://localhost:5173` e ingresar con `student / student123`.
2. En **Tecnología** seleccionar **Socket.IO (Node)**.
3. Usa el panel del autor para listar planos (ej. autor `john`), ábrelo y dibuja con clics.
4. Abre una **segunda pestaña** con el mismo autor y plano: los puntos se replican en tiempo real.
5. Por último guarda los puntos nuevos con **Save/Update** y prueba **Create** y **Delete**.

---

## 🎯 Objetivo del laboratorio
Implementar **colaboración en tiempo real** para el caso de BluePrints. El Front consume la API CRUD de la Parte 3 (o equivalente) y habilita tiempo real usando **Socket.IO** o **STOMP**, para que múltiples clientes dibujen el mismo plano de forma simultánea.

Al finalizar, el equipo debe:
1. Integrar el Front con su **API CRUD** (listar/crear/actualizar/eliminar planos, y total de puntos por autor).
2. Conectar el Front a un backend de **tiempo real** (Socket.IO **o** STOMP) siguiendo los repos guía.
3. Demostrar **colaboración en vivo** (dos pestañas navegando el mismo plano).

---

## 🧩 Alcance y criterios funcionales
- **CRUD** (REST):
  - `GET /api/blueprints?author=:author` → lista por autor (incluye total de puntos).
  - `GET /api/blueprints/:author/:name` → puntos del plano.
  - `POST /api/blueprints` → crear.
  - `PUT /api/blueprints/:author/:name` → actualizar.
  - `DELETE /api/blueprints/:author/:name` → eliminar.
- **Tiempo real (RT)** (elige uno):
  - **Socket.IO** (rooms): `join-room`, `draw-event` → broadcast `blueprint-update`.
  - **STOMP** (topics): `@MessageMapping("/draw")` → `convertAndSend(/topic/blueprints.{author}.{name})`.
- **UI**:
  - Canvas con **dibujo por clic** (incremental).
  - Panel del autor: **tabla** de planos y **total de puntos** (`reduce`).
  - Barra de acciones: **Create / Save/Update / Delete** y **selector de tecnología** (None / Socket.IO / STOMP).
- **DX/Calidad**: código limpio, manejo de errores, README de equipo.

---

## 🏗️ Arquitectura (visión rápida)

```
React (Vite)
 ├─ HTTP (REST CRUD + estado inicial) ───────────────> Tu API (P3 / propia)
 └─ Tiempo Real (elige uno):
     ├─ Socket.IO: join-room / draw-event ──────────> Socket.IO Server (Node)
     └─ STOMP: /app/draw -> /topic/blueprints.* ────> Spring WebSocket/STOMP
```

**Convenciones recomendadas**  
- **Plano como canal/sala**: `blueprints.{author}.{name}`  
- **Payload de punto**: `{ x, y }`

---

## 📦 Repos guía (clona/consulta)
- **Socket.IO (Node.js)**: https://github.com/DECSIS-ECI/example-backend-socketio-node-/blob/main/README.md  
  - *Uso típico en el cliente:* `io(VITE_IO_BASE, { transports: ['websocket'] })`, `join-room`, `draw-event`, `blueprint-update`.
- **STOMP (Spring Boot)**: https://github.com/DECSIS-ECI/example-backend-stopm/tree/main  
  - *Uso típico en el cliente:* `@stomp/stompjs` → `client.publish('/app/draw', body)`; suscripción a `/topic/blueprints.{author}.{name}`.

---

## ⚙️ Variables de entorno (Front)
> `start-lab5.cmd` ya crea `.env.local` con estos valores. Esta sección es referencia por si querés cambiarlos (p. ej. usar tu Lab P2 local en vez de la VM).

Crea `.env.local` en la raíz del proyecto **Front**:
```bash
# REST (el backend del labP2 + Delete)
VITE_API_BASE=http://68.155.159.205:8080   # VM del equipo (o http://localhost:8080 si corre el Lab_P2 local, alojado en "https://github.com/Helacio/Lab_P2_BluePrints_Java21_API_Security_JWT")

# Tiempo real: apunta a uno u otro según el backend que uses
VITE_IO_BASE=http://localhost:3001     # si usas Socket.IO (Node)
VITE_STOMP_BASE=http://68.155.159.205:8080  # si usas STOMP (Spring)
```
En la UI, selecciona la tecnología en el **selector RT**.

---

## Puesta en marcha manual (opcional)

### 1) Backend RT (elige uno)

**Opción A — Socket.IO (Node.js)**  
Clona el repo del equipo y sigue su README:  
https://github.com/Helacio/example-backend-socketio-node-
```bash
npm i
npm run dev
# expone: http://localhost:3001
# prueba rápida del estado inicial:
curl http://localhost:3001/api/blueprints/juan/plano-1
```

**Opción B — STOMP (Spring Boot)**  
Sigue el repo guía:  
https://github.com/DECSIS-ECI/example-backend-stopm/tree/main
```bash
./mvnw spring-boot:run
# expone: http://localhost:8080
# endpoint WS (ej.): /ws-blueprints
```

### 2) Front (este repo)
```bash
npm i
npm run dev
# http://localhost:5173
```

> La API REST (CRUD) debe estar configurada en `.env.local` (ver sección "Configurar el frontend").
> Si no existe, el front intentará `http://localhost:8080` y fallará con `ERR_CONNECTION_REFUSED` al listar planos.

En la interfaz: selecciona **Socket.IO** o **STOMP**, define `author` y `name`, abre **dos pestañas** y dibuja en el canvas (clics).

---

## 🔌 Protocolos de Tiempo Real (detalle mínimo)

### A) Socket.IO
- **Unirse a sala**
  ```js
  socket.emit('join-room', `blueprints.${author}.${name}`)
  ```
- **Enviar punto**
  ```js
  socket.emit('draw-event', { room, author, name, point: { x, y } })
  ```
- **Recibir actualización**
  ```js
  socket.on('blueprint-update', (upd) => { /* append points y repintar */ })
  ```

### B) STOMP
- **Publicar punto**
  ```js
  client.publish({ destination: '/app/draw', body: JSON.stringify({ author, name, point }) })
  ```
- **Suscribirse a tópico**
  ```js
  client.subscribe(`/topic/blueprints.${author}.${name}`, (msg) => { /* append points y repintar */ })
  ```

---

## 🧪 Casos de prueba mínimos
- **Estado inicial**: al seleccionar plano, el canvas carga puntos (`GET /api/blueprints/:author/:name`).  
- **Dibujo local**: clic en canvas agrega puntos y redibuja.  
- **RT multi-pestaña**: con 2 pestañas, los puntos se **replican** casi en tiempo real.  
- **CRUD**: Create/Save/Delete funcionan y refrescan la lista y el **Total** del autor.

---

## 📊 Entregables del equipo
1. Código del Front integrado con **CRUD** y **RT** (Socket.IO o STOMP).  
2. **Video de la demo** (≤ 90s, colaboración en vivo + CRUD): https://youtu.be/2ylHehlPyBQ  
3. **README del equipo**: setup, endpoints usados, decisiones (rooms/tópicos), y (opcional) breve comparativa Socket.IO vs STOMP.

---

## 🧮 Rúbrica sugerida
- **Funcionalidad (40%)**: RT estable (join/broadcast), aislamiento por plano, CRUD operativo.  
- **Calidad técnica (30%)**: estructura limpia, manejo de errores, documentación clara.  
- **Observabilidad/DX (15%)**: logs útiles (conexión, eventos), health checks básicos.  
- **Análisis (15%)**: hallazgos (latencia/reconexión) y, si aplica, pros/cons Socket.IO vs STOMP.

---

## 🩺 Troubleshooting
- **Pantalla en blanco (Front)**: revisa consola; confirma `@vitejs/plugin-react` instalado y que `AppP4.jsx` esté en `src/`.  
- **No hay broadcast**: ambas pestañas deben hacer `join-room` al **mismo** plano (Socket.IO) o suscribirse al **mismo tópico** (STOMP).  
- **CORS**: en dev permite `http://localhost:5173`; en prod, **restringe orígenes**.  
- **Socket.IO no conecta**: fuerza transporte WebSocket `{ transports: ['websocket'] }`.  
- **STOMP no recibe**: verifica `brokerURL`/`webSocketFactory` y los prefijos `/app` y `/topic` en Spring.

---

## 🔐 Seguridad (mínimos)
- Validación de payloads (p. ej., zod/joi).  
- Restricción de orígenes en prod.  
- Opcional: **JWT** + autorización por plano/sala.

---

## 📄 Licencia
MIT (o la definida por el curso/equipo).
