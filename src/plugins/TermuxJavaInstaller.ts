/**
 * TermuxJavaInstaller - Versión Simplificada
 * Detecta si Termux está instalado y facilita la instalación de Java Runtime
 * SIN dependencias de @capacitor/app o @capacitor/clipboard
 */

export class TermuxJavaInstaller {
  /**
   * Comando para instalar OpenJDK 21 JRE en Termux
   */
  static getJavaInstallCommand(): string {
    return `apt update && apt install -y openjdk-21-jre-headless && echo "✅ Java instalado exitosamente"`;
  }

  /**
   * Comando para verificar si Java está instalado
   */
  static getJavaCheckCommand(): string {
    return `java -version`;
  }

  /**
   * Copia el comando al portapapeles (usando API nativa del navegador)
   */
  static async copyToClipboard(text: string): Promise<boolean> {
    try {
      // Intentar usar la API nativa de Clipboard
      if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback: crear un textarea temporal
        const textarea = document.createElement('textarea');
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        return true;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  }

  /**
   * Abre Termux usando deep link
   */
  static openTermux(): void {
    try {
      // Intentar abrir Termux con deep link
      window.location.href = 'termux://new-session';
      
      // Fallback: si no abre en 2 segundos, mostrar instrucción manual
      setTimeout(() => {
        alert(
          '💡 Si Termux no se abrió automáticamente:\n\n' +
          '1. Abre Termux manualmente\n' +
          '2. El comando ya está copiado al portapapeles\n' +
          '3. Pega con Ctrl+V y presiona Enter'
        );
      }, 2000);
    } catch (error) {
      console.error('Error opening Termux:', error);
    }
  }

  /**
   * Obtiene la ruta donde debe estar Java para que TaichiX lo encuentre
   */
  static getJavaPath(): string {
    return `/data/data/com.taichix.app/files/runtime/java/bin/java`;
  }

  /**
   * Instrucciones completas para el usuario
   */
  static getDetailedInstructions(): string {
    return (
      '=== INSTALACIÓN DE JAVA EN TERMUX ===\n\n' +
      '1. Abre Termux\n' +
      '2. Copia y pega este comando:\n\n' +
      this.getJavaInstallCommand() +
      '\n\n3. Espera a que termine (puede tomar 5-10 minutos)\n' +
      '4. Verifica con: ' + this.getJavaCheckCommand() + '\n' +
      '5. ¡Listo! Vuelve a TaichiX y crea tu servidor\n\n' +
      'NOTA: Esto instalará OpenJDK 21 JRE en tu dispositivo.'
    );
  }

  /**
   * Función completa para instalar Java
   */
  static async installJavaInTermux(): Promise<void> {
    const command = this.getJavaInstallCommand();
    
    // Copiar al portapapeles
    const copied = await this.copyToClipboard(command);
    
    if (copied) {
      alert('✅ Comando copiado al portapapeles\n\nAbriendo Termux...');
    } else {
      alert('Comando:\n\n' + command + '\n\nCópialo manualmente en Termux');
    }
    
    // Abrir Termux
    this.openTermux();
  }
}
