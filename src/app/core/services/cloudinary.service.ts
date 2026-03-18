import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface CloudinaryResponse {
  secure_url: string;
  public_id: string;
  format: string;
  width: number;
  height: number;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root',
})
export class CloudinaryService {
  private cloudName = (environment.cloudinary?.cloudName || '').trim();
  private uploadPreset = (environment.cloudinary?.uploadPreset || '').trim();
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  /**
   * Sube una imagen a Cloudinary organizándola en carpetas por ID de categoría
   * @param file - Archivo de imagen a subir
   * @param folderName - ID de la categoría (se usará como nombre de carpeta)
   * @returns Observable con la URL segura de la imagen subida
   */
  uploadImage(file: File, folderName: string): Observable<string> {
    const formData = this.createFormData(file, folderName);

    return from(
      fetch(this.uploadUrl, {
        method: 'POST',
        body: formData,
      }).then(async (response) => {
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const backendMessage = errorPayload?.error?.message;
          throw new Error(
            backendMessage
              ? `Error al subir imagen: ${backendMessage}`
              : `Error al subir imagen: ${response.status} ${response.statusText}`,
          );
        }
        return response.json();
      })
    ).pipe(map((data: CloudinaryResponse) => data.secure_url));
  }

  /**
   * Sube múltiples imágenes a Cloudinary en la misma carpeta
   * @param files - Array de archivos a subir
   * @param folderName - ID de la categoría
   * @returns Observable con array de URLs
   */
  uploadMultipleImages(files: File[], folderName: string): Observable<string[]> {
    const uploadPromises = files.map((file) =>
      fetch(this.uploadUrl, {
        method: 'POST',
        body: this.createFormData(file, folderName),
      }).then(async (response) => {
        if (!response.ok) {
          const errorPayload = await response.json().catch(() => null);
          const backendMessage = errorPayload?.error?.message;
          throw new Error(
            backendMessage
              ? `Error al subir imagen: ${backendMessage}`
              : `Error al subir imagen: ${response.status} ${response.statusText}`,
          );
        }
        return response.json();
      })
    );

    return from(Promise.all(uploadPromises)).pipe(
      map((responses: CloudinaryResponse[]) => responses.map((res) => res.secure_url))
    );
  }

  private createFormData(file: File, folderName: string): FormData {
    if (!this.cloudName) {
      throw new Error('Cloudinary cloudName no está configurado en environment.');
    }

    if (!this.uploadPreset) {
      throw new Error('Cloudinary uploadPreset no está configurado en environment.');
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', this.uploadPreset);
    formData.append('folder', (folderName || '').toString().trim() || 'general');

    // Defensa adicional: si por alguna razón no quedó adjunto, evitamos request inválida.
    if (!formData.has('upload_preset')) {
      throw new Error('No se pudo adjuntar upload_preset en la solicitud a Cloudinary.');
    }

    return formData;
  }
}
