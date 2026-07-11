# Guía: Base de datos de invitados + Publicación con dominio

## Parte 1 — Base de datos con Supabase (gratis)

Cada confirmación de asistencia y sugerencia de canción queda guardada en una
base de datos real (PostgreSQL). Los datos los ves de dos formas:
- En tu **panel privado**: `https://mi-boda-pi.vercel.app/admin.html` (con login)
- En el panel de Supabase (tablas con filtros, búsqueda y exportación)

### Paso 1: Crear el proyecto
1. Entra a https://supabase.com y crea una cuenta (puedes usar tu Google)
2. Clic en **New project**:
   - Nombre: `mi-boda`
   - Database password: inventa una y **guárdala** (no la volverás a necesitar
     para el uso diario, pero es importante conservarla)
   - Región: `South America (São Paulo)` (la más cercana a Colombia)
3. Espera 1-2 minutos a que el proyecto se cree

### Paso 2: Crear las tablas
1. En el menú lateral, entra a **SQL Editor**
2. Abre el archivo `sql/supabase-setup.sql` de esta carpeta, copia TODO su
   contenido, pégalo en el editor y presiona **Run**
3. Debe decir "Success. No rows returned"

### Paso 3: Crear tu usuario de administrador
1. Menú lateral → **Authentication → Users → Add user → Create new user**
2. Email: `juanhernandezconde@gmail.com`
3. Contraseña: inventa una (esta será la del panel /admin.html)
4. Marca **Auto Confirm User** y crea el usuario

### Paso 4: Conectar la invitación
1. Menú lateral → **Project Settings → API** (o el ícono de engranaje)
2. Copia dos valores:
   - **Project URL** (ej: `https://abcdefgh.supabase.co`)
   - **anon public** key (una cadena larga que empieza con `eyJ...`)
3. Abre `js/config.js` y pégalos entre las comillas:
   ```javascript
   const SUPABASE_URL = 'https://abcdefgh.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```
4. Vuelve a desplegar: `npx vercel deploy --prod --yes`

### Cómo funciona la seguridad
- La clave `anon` que queda pública SOLO permite **insertar** respuestas
  (los invitados no pueden leer los datos de otros)
- Para **ver** los datos se necesita iniciar sesión con tu usuario
  (política de seguridad a nivel de fila en la base de datos)

### Tu panel privado
Entra a `https://mi-boda-pi.vercel.app/admin.html`, inicia sesión con el
usuario del Paso 3 y verás:
- Totales: respuestas, confirmados a ceremonia, a fiesta, no asisten, canciones
- Tabla de confirmaciones (fecha, nombre, ceremonia, fiesta, restricciones, mensaje)
- Tabla de canciones sugeridas con su link
- Botón para exportar todo a CSV (se abre en Excel)

---

## Parte 2 — Publicar en la nube con URL propia

### Opción recomendada: Netlify (gratis, la más simple)

1. Entra a https://app.netlify.com y crea una cuenta (puedes usar tu Google)
2. En el panel, busca **"Add new site → Deploy manually"**
3. **Arrastra la carpeta completa `MI BODA`** a la zona de carga
4. En ~30 segundos tendrás una URL tipo `https://algo-aleatorio.netlify.app`
5. En **Site settings → Change site name** puedes ponerle algo bonito gratis:
   `https://juanynatalia.netlify.app`

### Dominio propio (opcional, de pago)

Si quieres algo como `www.juanynatalia.com`:
1. Compra el dominio (~$12 USD/año) en Namecheap, GoDaddy o el propio Netlify
2. En Netlify: **Domain settings → Add custom domain** y sigue las instrucciones
   (Netlify configura el HTTPS automáticamente)

### Alternativas gratuitas
- **Vercel** (vercel.com): mismo proceso de arrastrar y soltar
- **GitHub Pages**: requiere subir el código a un repositorio de GitHub

### Importante al actualizar
Cada vez que cambies algo en la invitación, vuelve a arrastrar la carpeta en
Netlify (pestaña **Deploys**) para publicar la nueva versión.
