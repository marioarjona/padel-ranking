# Indra Pádel

App para llevar el ranking Elo individual del grupo de pádel: se apuntan los sets de cada partido,
se sortean partidos nivelados y se genera la tier list. Los datos se guardan en Firebase (Firestore),
así que todo el grupo ve y apunta lo mismo.

## Puesta en marcha (una sola vez, ~10 minutos)

### 1. Crear el proyecto de Firebase
1. Entra en <https://console.firebase.google.com> con tu cuenta de Google y pulsa **Crear un proyecto**
   (Analytics no hace falta).
2. **Compilación → Firestore Database → Crear base de datos**. Elige la ubicación `eur3 (europe-west)`
   y empieza en **modo de producción**.
3. **Compilación → Authentication → Comenzar → Método de acceso → Anónimo → Habilitar**.
4. **Configuración del proyecto (⚙️) → Tus apps → icono `</>` (Web)**. Ponle un nombre, no marques Hosting,
   y copia el objeto `firebaseConfig` que aparece.

### 2. Pegar la configuración
Abre `firebase-config.js` y sustituye los valores por los que copiaste.

### 3. Publicar las reglas de seguridad
En **Firestore Database → Reglas**, borra lo que haya, pega el contenido de `firestore.rules` y pulsa **Publicar**.

### 4. Publicar la web con GitHub Pages
1. Sube estos archivos al repositorio (`git add . && git commit && git push`).
2. En GitHub: **Settings → Pages → Build and deployment → Deploy from a branch**, rama `main`, carpeta `/ (root)`.
3. En un par de minutos estará en `https://<tu-usuario>.github.io/<nombre-del-repo>/`.
4. En Firebase: **Authentication → Configuración → Dominios autorizados → Agregar dominio** y añade
   `<tu-usuario>.github.io`.

### 5. Primer uso
Abre la web, ve a **Jugadores** y añade al grupo. Después pasa el enlace por el grupo de WhatsApp.

## Cómo funciona el ranking
- Todos empiezan con 1000 puntos y cada set cuenta por separado.
- La fuerza de una pareja es la media de sus dos jugadores. Ganar a una pareja más fuerte da más puntos;
  perder contra una más floja resta más.
- La diferencia de juegos multiplica: un 6-0 vale el doble que un 7-6.
- Fórmula: `Δ = 32 × (1 + dif_juegos/6) × (resultado − esperado)`, con
  `esperado = 1 / (1 + 10^((media_rival − media_propia)/400))`.
- Con menos de 6 sets jugados, el jugador sale como *provisional*.
- Tier list por puestos: 2 en S, 2 en A, 4 en B, 2 en C y 2 en D (proporcional si no sois 12).

## Seguridad
Cualquiera que tenga el enlace puede apuntar y borrar partidos (no hay cuentas, para que sea cómodo).
Las reglas de `firestore.rules` solo impiden datos mal formados. Si alguien hace el gamberro, se puede
restaurar desde el historial borrando lo que sobre.

## Probar en local
Los módulos no funcionan abriendo el archivo con doble clic. Sirve la carpeta con cualquier servidor estático, por ejemplo:

```bash
npx serve .
```

Sin configurar Firebase, la app funciona igual, pero guarda los datos solo en tu navegador.
