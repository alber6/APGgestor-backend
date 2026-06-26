# ⚡ APGgestor - Backend API

Sistema de gestión interna (ERP) diseñado para optimizar la asignación de obras, órdenes de trabajo e instalaciones eléctricas/solares. Este repositorio contiene la API REST encargada de la lógica de negocio, autenticación segura y persistencia de datos.

## 🔗 Enlace de Producción
* **API URL:** https://apggestor-backend.onrender.com/api

## 🛠️ Tecnologías y Arquitectura
* **Entorno de Ejecución:** Node.js con Express.
* **Base de Datos:** MongoDB Atlas utilizando Mongoose como ODM.
* **Seguridad y Autenticación:** JSON Web Tokens (JWT) para la gestión de sesiones y encriptación de credenciales.
* **Procesamiento de Datos:** Módulo nativo `fs` para la ingesta, lectura y procesamiento automatizado de las semillas desde archivos estructurados CSV.

## 📊 Modelo de Datos (Colecciones Relacionadas)
La base de datos se genera dinámicamente e integra las siguientes colecciones:
1. **users:** Gestión de cuentas con encriptación y segregación de accesos por roles (`admin` y `operario`).
2. **operarios:** Registro de la plantilla técnica vinculada a las órdenes de trabajo.
3. **jobs (obras):** Órdenes de trabajo que enlazan de forma relacional un cliente específico (`customer`), un tipo de instalación y el técnico asignado.
4. **customers:** Historial de clientes con datos de contacto y direcciones físicas integradas.

## ⚙️ Configuración del Entorno (`.env`)
Para levantar este servidor en local, crea un archivo `.env` basado en el archivo `.env.example` incluido en el repositorio con las siguientes variables:
* `PORT`: Puerto de escucha del servidor (Por defecto: 5000).
* `MONGO_URI`: Cadena de conexión cifrada a tu clúster de MongoDB Atlas.
* `JWT_SECRET`: Llave secreta para la firma y validación de los tokens de sesión.

## 🚀 Instalación y Despliegue Local
1. Instala las dependencias del sistema:
   ```bash
   npm install
2. Ejecuta el script de la semilla para poblar la base de datos desde los CSVs generados (mínimo 100 registros)
   ```bash
   npm run seed
   node seeds.js
3. Arranca el servidor de desarrollo:
   ```bash
   npm run dev

