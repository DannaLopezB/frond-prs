import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering } from '@angular/platform-server';
import { provideHttpClient, withFetch } from '@angular/common/http';
import { appConfig } from './app.config';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(),
    provideHttpClient(withFetch())  // ✅ Agregar conFetch aquí
  ]
};

// Combina la configuración del servidor con la configuración existente de la aplicación
export const config = mergeApplicationConfig(appConfig, serverConfig);
