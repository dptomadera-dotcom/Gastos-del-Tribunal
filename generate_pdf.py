# -*- coding: utf-8 -*-
import sys
from fpdf import FPDF

class ManualPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font("helvetica", "I", 8)
            self.set_text_color(100, 116, 139) # slate-500
            self.cell(0, 10, "Manual de Usuario - Mis Gastos Tribunal 2026", 0, 0, "L")
            self.cell(0, 10, "Cuaderno Digital", 0, 1, "R")
            self.set_draw_color(226, 232, 240) # slate-200
            self.line(10, 18, 200, 18)
            self.ln(5)

    def footer(self):
        if self.page_no() > 1:
            self.set_y(-15)
            self.set_font("helvetica", "I", 8)
            self.set_text_color(100, 116, 139) # slate-500
            self.cell(0, 10, f"Pagina {self.page_no()}/{{nb}}", 0, 0, "C")

    def chapter_title(self, num, title):
        self.set_font("helvetica", "B", 14)
        self.set_text_color(79, 70, 229) # indigo-600
        self.ln(4)
        self.cell(0, 10, f"{num}. {title}", 0, 1, "L")
        self.set_draw_color(79, 70, 229)
        self.set_line_width(0.5)
        self.line(self.get_x(), self.get_y(), self.get_x() + 190, self.get_y())
        self.ln(4)

    def section_title(self, title):
        self.set_font("helvetica", "B", 11)
        self.set_text_color(15, 23, 42) # slate-900
        self.ln(2)
        self.cell(0, 8, title, 0, 1, "L")
        self.ln(1)

    def paragraph(self, text, style=""):
        self.set_font("helvetica", style, 10)
        self.set_text_color(51, 65, 85) # slate-700
        self.multi_cell(0, 5, text)
        self.ln(3)

    def bullet_point(self, title, description):
        self.set_font("helvetica", "B", 10)
        self.set_text_color(15, 23, 42) # slate-900
        self.write(5, "  -  " + title + ": ")
        self.set_font("helvetica", "", 10)
        self.set_text_color(51, 65, 85) # slate-700
        self.multi_cell(0, 5, description)
        self.ln(2)

def build_manual():
    pdf = ManualPDF()
    pdf.alias_nb_pages()
    
    # ------------------ PORTADA ------------------
    pdf.add_page()
    
    # Background Accent Top Bar
    pdf.set_fill_color(79, 70, 229) # Indigo
    pdf.rect(0, 0, 210, 40, "F")
    
    # Bottom Accent Bar
    pdf.set_fill_color(16, 185, 129) # Emerald
    pdf.rect(0, 280, 210, 17, "F")
    
    pdf.ln(45)
    
    # Title
    pdf.set_font("helvetica", "B", 26)
    pdf.set_text_color(15, 23, 42) # slate-900
    pdf.cell(0, 15, "MANUAL DE USUARIO", 0, 1, "C")
    
    # Subtitle
    pdf.set_font("helvetica", "B", 14)
    pdf.set_text_color(79, 70, 229) # Indigo
    pdf.cell(0, 10, "Mis Gastos Tribunal 2026", 0, 1, "C")
    
    # Description
    pdf.set_font("helvetica", "I", 10)
    pdf.set_text_color(100, 116, 139) # slate-500
    pdf.cell(0, 8, "Cuaderno Digital de Liquidacion de Dietas y Justificantes", 0, 1, "C")
    
    pdf.ln(25)
    
    # Box with highlights
    pdf.set_fill_color(248, 250, 252) # slate-50
    pdf.set_draw_color(226, 232, 240) # slate-200
    pdf.rect(30, 120, 150, 75, "DF")
    
    pdf.set_xy(35, 125)
    pdf.set_font("helvetica", "B", 11)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(140, 6, "Funcionalidades Clave del Aplicativo:", 0, 1, "C")
    pdf.ln(2)
    
    pdf.set_x(35)
    pdf.set_font("helvetica", "", 9.5)
    pdf.set_text_color(51, 65, 85)
    pdf.multi_cell(140, 4.5, 
        "- Calculo Automático de Dietas y Kilometraje según normativa oficial.\n"
        "- Escaneo Inteligente (OCR) de justificantes con la IA de Google Gemini.\n"
        "- Funcionamiento Offline-First: Tus datos están seguros sin conexión.\n"
        "- Sincronizacion en la nube opcional y encriptada mediante Supabase.\n"
        "- Exportacion en un clic del expediente en PDF firmado y comprimido en ZIP."
    )
    
    pdf.ln(35)
    
    # Footer Info
    pdf.set_xy(10, 235)
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 6, "Creado para los miembros de Tribunales de Oposiciones", 0, 1, "C")
    
    pdf.set_font("helvetica", "", 9)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 5, "Convocatoria 2026 - Gobierno de Canarias", 0, 1, "C")
    pdf.cell(0, 5, "Versión 1.1 - Soporte PWA, Gemini y Supabase RLS", 0, 1, "C")
    
    # ------------------ CONTENIDO ------------------
    pdf.add_page()
    
    # 1. INTRODUCCIÓN
    pdf.chapter_title("1", "Introducción y Propósito")
    pdf.paragraph(
        "Mis Gastos Tribunal 2026 es una aplicación web progresiva (PWA) diseñada para simplificar y "
        "automatizar la recopilación, control y liquidación de indemnizaciones por razón del servicio (dietas, "
        "gastos de locomoción, parking, taxis y alojamiento) de los vocales y miembros de los tribunales de oposiciones."
    )
    pdf.paragraph(
        "El objetivo es eliminar las tareas manuales y la acumulación desordenada de tickets físicos, calculando "
        "de forma exacta los importes acumulados según la normativa oficial de indemnizaciones y permitiendo "
        "exportar el expediente completo listo para entregar en la Secretaría del Tribunal."
    )
    
    # 2. PRIMEROS PASOS
    pdf.chapter_title("2", "Primeros Pasos y Configuración")
    
    pdf.section_title("Acceso e Instalación (PWA)")
    pdf.paragraph(
        "La aplicación funciona en cualquier dispositivo (móvil, tablet u ordenador) ingresando al enlace:"
    )
    pdf.set_font("helvetica", "B", 10)
    pdf.set_text_color(79, 70, 229)
    pdf.cell(0, 6, "https://dptomadera-dotcom.github.io/Gastos-del-Tribunal/", 0, 1, "C")
    pdf.ln(2)
    
    pdf.paragraph(
        "Para tener la mejor experiencia de usuario y poder usar la aplicación como si fuera una app nativa del móvil (incluso sin conexión a internet), te recomendamos instalarla:"
    )
    pdf.bullet_point("En Android", "Pulsa en el botón 'Instalar App Móvil' en el menú lateral izquierdo o el banner inferior de Chrome, y selecciona 'Instalar'.")
    pdf.bullet_point("En iOS (iPhone/iPad)", "Abre el enlace en Safari, toca el botón de 'Compartir' (el cuadrado con la flecha hacia arriba) y selecciona 'Añadir a la pantalla de inicio'.")
    
    pdf.section_title("Configuración de Perfil")
    pdf.paragraph(
        "La primera vez que abras la app, se te redirigirá a la pestaña 'Perfil de Vocal'. Es obligatorio rellenar estos datos para que se calculen los importes de forma legal:"
    )
    pdf.bullet_point("Datos Personales", "Tu nombre completo, DNI y el Cargo que ocupas en el tribunal (Vocal, Presidente, Secretario, etc.).")
    pdf.bullet_point("Medio de Transporte", "Si utilizas tu coche o moto propia para los desplazamientos, debes configurar la marca, modelo y matrícula de tu vehículo. La aplicación aplicará automáticamente el importe por kilómetro reglamentario (0,26 euros/km para turismos y 0,106 euros/km para motocicletas).")

    # 3. CONFIGURACIÓN AVANZADA
    pdf.add_page()
    pdf.chapter_title("3", "Configuración Avanzada (Opcional)")
    
    pdf.section_title("Ajustes de Inteligencia Artificial (Gemini)")
    pdf.paragraph(
        "Para habilitar el escaneo inteligente de justificantes mediante Inteligencia Artificial, ve a la sección "
        "'Ajustes de Inteligencia Artificial (Gemini)' en tu Perfil:"
    )
    pdf.bullet_point("API Key de Gemini", "Pega tu clave personal gratuita (se puede obtener en Google AI Studio haciendo clic en el enlace provisto). Esta clave se almacena exclusivamente en tu dispositivo de forma segura y se comunica directamente con los servidores de Google para procesar las imágenes de los tickets.")

    pdf.section_title("Sincronización en la Nube (Supabase)")
    pdf.paragraph(
        "Por defecto, la app guarda todo en la base de datos local de tu móvil (IndexedDB), asegurando que funciona sin internet. "
        "Si quieres habilitar el guardado multidispositivo (por ejemplo, tomar fotos con el móvil y ver los gastos en el ordenador), "
        "puedes configurar la conexión a Supabase:"
    )
    pdf.bullet_point("Datos de Conexión", "Introduce la 'Supabase URL' y la 'Supabase Anon Key' de tu proyecto en el panel 'Configuración de Conexión Supabase (Hostings Públicos)'. Haz clic en 'Guardar Conexión' y la app se recargará automáticamente.")
    pdf.bullet_point("Registro/Login", "Una vez conectada a Supabase, puedes crear una cuenta o iniciar sesión. Desde ese momento, tus datos se sincronizarán en la nube de forma encriptada bajo políticas estrictas de seguridad de fila (RLS).")

    # 4. GESTIÓN DE SESIONES
    pdf.chapter_title("4", "Gestión de Sesiones de Trabajo")
    pdf.paragraph(
        "El expediente oficial de dietas requiere asociar los viajes a días concretos en los que el tribunal se ha reunido. "
        "Por tanto, el primer paso en el flujo ordinario es crear las sesiones en la sección 'Mis Sesiones':"
    )
    pdf.bullet_point("Añadir Sesión", "Introduce la fecha del día de trabajo, la hora de inicio y de fin de la sesión, y un objeto breve descriptivo (ej. 'Corrección de examen escrito', 'Acta de constitución', 'Entrevistas de la fase práctica').")
    pdf.bullet_point("Trazabilidad", "Cada sesión muestra los gastos y justificantes asociados creados para ese día, manteniendo un control exhaustivo de cada jornada.")

    # 5. REGISTRO DE DIETAS
    pdf.add_page()
    pdf.chapter_title("5", "Registro de Dietas de Viaje")
    pdf.paragraph(
        "En la pestaña 'Registro de Dieta' puedes crear un registro para cada desplazamiento realizado. Es posible asociar un viaje a una o varias sesiones de trabajo de días consecutivos:"
    )
    pdf.bullet_point("Horas de Salida y Llegada", "Indica la hora exacta a la que sales de tu domicilio y a la que regresas. La aplicación calculará automáticamente si tienes derecho a media dieta de manutención (19,50 euros) o a una dieta completa (39,00 euros) de acuerdo con los horarios reales estipulados por el reglamento de indemnizaciones.")
    pdf.bullet_point("Medio de Transporte", "Selecciona cómo has viajado: coche propio, motocicleta, taxi, guagua, avión o barco.")
    pdf.bullet_point("Kilómetros Recorridos", "Si viajas en coche propio, introduce los kilómetros de ida y vuelta. La app los multiplicará por tu tarifa por kilómetro de forma automática.")
    pdf.bullet_point("Gastos Adicionales", "Registra los importes del parking, taxi, guagua, alquiler del vehículo o alojamiento, si existieran.")
    
    # 6. ESCÁNER DE JUSTIFICANTES
    pdf.chapter_title("6", "Cartera y Escáner de Justificantes")
    pdf.paragraph(
        "Para justificar los importes de parking, taxi, billetes o alojamiento ante intervención, es obligatorio adjuntar una foto del ticket. "
        "La pestaña 'Justificantes' funciona como tu cartera digital:"
    )
    pdf.bullet_point("Subir Justificante", "Pulsa en 'Hacer foto con la cámara' en tu móvil, o 'Subir archivo de imagen/PDF' desde tu dispositivo.")
    pdf.bullet_point("Análisis Inteligente (Gemini IA)", "Tras cargar la imagen, pulsa el botón 'Analizar ticket con IA (Gemini)'. La inteligencia artificial leerá el texto del ticket, identificará el título descriptivo, la fecha de emisión y clasificará la categoría de gasto, autocompletando el formulario por ti.")
    pdf.bullet_point("Asociación con Dietas", "Una vez creado, selecciona el gasto de la lista para asociarlo. Esto garantizará que el ticket se adjunte en la sección adecuada del expediente.")

    # 7. EXPORTACIÓN DEL EXPEDIENTE
    pdf.chapter_title("7", "Exportación del Expediente y Cierre")
    pdf.paragraph(
        "Al finalizar las sesiones del tribunal o cuando debas presentar la liquidación mensual, dirígete a la pestaña "
        "'Exportar a Secretaría':"
    )
    pdf.bullet_point("Hoja de Liquidación (PDF)", "Revisa el resumen desglosado de todos tus desplazamientos, dietas e importes acumulados. Pulsa en 'Generar PDF del Expediente'. Se abrirá el diálogo de impresión con un diseño profesional y limpio que puedes guardar como PDF y firmar digitalmente.")
    pdf.bullet_point("Archivo de Justificantes (ZIP)", "Pulsa en 'Descargar Zip de Justificantes'. La app generará un archivo ZIP que contiene todas tus facturas y tickets organizados, renombrados de forma legible (ej. '01_parking_2026-06-27.jpg') para que el auditor pueda revisarlos de forma ordenada.")

    # Output file path
    output_path = "c:/Users/gmedc/Google Drive/Mi unidad/OPOSICIONES 2026/09_PRUEBAS/Gastos-del-Tribunal/Manual_Usuario_Gastos_Tribunal.pdf"
    pdf.output(output_path)
    print(f"PDF generado con éxito en: {output_path}")

if __name__ == "__main__":
    build_manual()
