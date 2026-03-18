import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, from } from 'rxjs';
import { map, retry } from 'rxjs/operators';
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
  private http = inject(HttpClient);
  private cloudName = (environment.cloudinary?.cloudName || '').trim();
  private uploadPreset = (environment.cloudinary?.uploadPreset || '').trim();
  private uploadUrl = `https://api.cloudinary.com/v1_1/${this.cloudName}/image/upload`;

  private getUploadUrl(): string {
    const cloudName = (environment.cloudinary?.cloudName || '').trim();
    if (!cloudName) {
      throw new Error('Cloudinary cloudName no está configurado en environment.');
    }
    return `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;
  }

  private getUploadPreset(): string {
    const preset = (environment.cloudinary?.uploadPreset || '').trim();
    if (!preset) {
      throw new Error('Cloudinary uploadPreset no está configurado en environment.');
    }
    return preset;
  }

  /**
   * Sube una imagen a Cloudinary organizándola en carpetas por ID de categoría
   * @param file - Archivo de imagen a subir
   * @param folderName - ID de la categoría (se usará como nombre de carpeta)
   * @returns Observable con la URL segura de la imagen subida
   */
  uploadImage(file: File, folderName: string): Observable<string> {
    const formData = this.createFormData(file, folderName);
    return this.http.post<CloudinaryResponse>(this.getUploadUrl(), formData).pipe(
      retry({ count: 2, delay: 250 }),
      map((data: CloudinaryResponse) => data.secure_url),
    );
  }

  /**
   * Sube múltiples imágenes a Cloudinary en la misma carpeta
   * @param files - Array de archivos a subir
   * @param folderName - ID de la categoría
   * @returns Observable con array de URLs
   */
  uploadMultipleImages(files: File[], folderName: string): Observable<string[]> {
    const uploadPromises = files.map((file) =>
      from(
        this.http
          .post<CloudinaryResponse>(this.getUploadUrl(), this.createFormData(file, folderName))
          .pipe(retry({ count: 2, delay: 250 }))
          .toPromise(),
      ),
    );

    return from(Promise.all(uploadPromises.map((obs) => obs.toPromise()))).pipe(
      map((responses: Array<CloudinaryResponse | undefined>) =>
        responses.filter((res): res is CloudinaryResponse => !!res).map((res) => res.secure_url),
      ),
    );
  }

  private createFormData(file: File, folderName: string): FormData {
    const preset = this.getUploadPreset();

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', preset);
    formData.append('folder', (folderName || '').toString().trim() || 'general');

    // Defensa adicional: validamos presencia y valor no vacío.
    const uploadPresetValue = formData.get('upload_preset');
    if (!uploadPresetValue || !uploadPresetValue.toString().trim()) {
      throw new Error('No se pudo adjuntar upload_preset en la solicitud a Cloudinary.');
    }

    return formData;
  }
}
