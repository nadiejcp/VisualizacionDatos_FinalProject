# Visualización de Emisiones de $\text{CO}_2$ en el Mundo

Este proyecto es una aplicación web interactiva desarrollada para la materia de **Visualización de Datos**. Su objetivo principal es explorar, analizar y visualizar las emisiones de dióxido de carbono ($\text{CO}_2$) globalmente y por país a lo largo del tiempo.

---

## 📁 Estructura del Proyecto

```text
VisualizacionDatos_FinalProject/
├── data_analysis/         # Scripts de análisis de datos y notebooks
│   ├── data/
│   │   ├── raw/           # Conjunto de datos original en bruto (data.csv)
│   │   └── processed/     # Datos limpios y procesados generados por el notebook
│   ├── .venv/             # Entorno virtual de Python (opcional)
│   ├── analyze.ipynb      # Jupyter Notebook de exploración y procesamiento de datos
│   ├── install.bat        # Script de instalación automática de dependencias para Windows
│   └── requirements.txt   # Librerías de Python requeridas
└── frontend/              # Aplicación web construida con Next.js
    ├── app/               # Páginas y rutas de Next.js (App Router)
    ├── components/        # Componentes de React para gráficos e interfaz
    ├── lib/               # Utilidades de procesamiento de datos en el cliente
    └── public/data/       # Archivos de datos procesados consumidos por la aplicación
```

---

## 📊 Ubicación de los Datos

* **Datos sin procesar (*Raw Data*):**  
  Ubicados en `data_analysis/data/raw/data.csv`. Contienen la información histórica global de emisiones.
* **Datos procesados (*Processed Data*):**  
  Ubicados en `data_analysis/data/processed/`. Incluyen conjuntos estructurados como:
  * `country_emissions.csv`: Emisiones consolidadas por país.
  * `total_emissions.csv`: Emisiones totales agregadas.
  * `data.csv`: Versión filtrada y procesada.
* **Datos del Frontend:**  
  Copiados en `frontend/public/data/` para ser servidos estáticamente e integrados en las visualizaciones de Next.js.

---

## 🐍 Ejecución del Notebook de Análisis (`analyze.ipynb`)

Para ejecutar el análisis de datos y la generación de archivos procesados:

1. **Navegar al directorio de análisis:**
   ```bash
   cd data_analysis
   ```

2. **Crear e instalar el entorno virtual de Python:**
   * **En Windows (Automático):**
     Ejecuta el archivo `install.bat`:
     ```cmd
     install.bat
     ```
   * **Manualmente (Windows / Mac / Linux):**
     ```bash
     python -m venv .venv
     
     # Activar el entorno virtual:
     # En Windows (CMD/PowerShell):
     .venv\Scripts\activate
     # En macOS/Linux:
     source .venv/bin/activate

     # Instalar dependencias:
     pip install -r requirements.txt
     ```

3. **Abrir y ejecutar el notebook:**
   * Puedes abrir `data_analysis/analyze.ipynb` en tu IDE preferido (VS Code / Cursor / PyCharm) seleccionando el entorno kernel `.venv`.
   * O lanzar Jupyter Notebook directamente desde la terminal activa:
     ```bash
     jupyter notebook analyze.ipynb
     ```
   * Ejecuta todas las celdas (*Run All*) para procesar los datos y exportar los CSV a la carpeta `data/processed/`.

---

## 💻 Ejecución del Frontend (Next.js App)

El frontend está construido con **Next.js** (React & TypeScript) y Tailwind CSS para ofrecer una interfaz moderna e interactiva.

### Requisitos previos
* [Node.js](https://nodejs.org/) (versión 18 o superior)
* `npm` (incluido con Node.js), `pnpm`, `yarn` o `bun`

### Pasos para levantar la aplicación:

1. **Navegar al directorio del frontend:**
   ```bash
   cd frontend
   ```

2. **Instalar las dependencias de Node:**
   ```bash
   npm install
   ```

3. **Ejecutar el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**  
   Accede a [http://localhost:3000](http://localhost:3000) para interactuar con la visualización.

---

## 🛠️ Tecnologías Utilizadas

* **Procesamiento de Datos:** Python, Pandas, Jupyter Notebook, Matplotlib, Altair.
* **Frontend Web:** Next.js (App Router), React 19, TypeScript, Tailwind CSS.
