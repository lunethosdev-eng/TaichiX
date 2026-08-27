/**
 * TermuxJavaInstaller
 * Detecta si Termux está instalado y facilita la instalación de Java Runtime
 */

import { App } from '@capacitor/app';
import { Clipboard } from '@capacitor/clipboard';

export class TermuxJavaInstaller {
  /**
   * Verifica si Termux está instalado en el dispositivo
   */
  static async isTermuxInstalled(): Promise<boolean> {
    try {
      // Intentar abrir la app de Termux (si no está, fallará)
      // Usamos un deep link que no hace nada pero verifica si la app existe
      await App.canOpenUrl({ url: 'termux://shell' });
      return true;
    } catch {
      return false;
    }
  }

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
   * Copia el comando al portapapeles y abre Termux
   */
  static async installJavaInTermux(): Promise<void> {
    try {
      const command = this.getJavaInstallCommand();
      
      // Copiar al portapapeles
      await Clipboard.write({
        string: command,
      });

      // Abrir Termux
      await App.openUrl({
        url: 'termux://new-session',
      });

      console.log('✅ Comando copiado al portapapeles. Termux abierto.');
      console.log('ℹ️ El usuario debe pegar el comando con Ctrl+V y presionar Enter');
    } catch (error) {
      console.error('Error abriendo Termux:', error);
      throw new Error('No se pudo abrir Termux. ¿Está instalado?');
    }
  }

  /**
   * Obtiene la ruta donde debe estar Java para que TaichiX lo encuentre
   */
  static getJavaPath(): string {
    return `/data/data/com.taichix.app/files/runtime/java/bin/java`;
  }

  /**
   * Comando completo con explicación para el usuario
   */
  static getDetailedInstructions(): string {
    return `
=== INSTALACIÓN DE JAVA EN TERMUX ===

1. Abre Termux
2. Copia y pega este comando:

${this.getJavaInstallCommand()}

3. Espera a que termine (puede tomar 5-10 minutos)
4. Verifica con: ${this.getJavaCheckCommand()}
5. ¡Listo! Vuelve a TaichiX y crea tu servidor

NOTA: Esto instalará OpenJDK 21 JRE en tu dispositivo.
`;
  }
}
