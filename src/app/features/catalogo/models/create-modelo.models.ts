// Modelos para la creación de un nuevo modelo

export interface ColorDraftDTO {
  idColor: number;
  nombreColor: string;
  codigoHex: string;
  codigo: string; // Código del modelo-color
  photoFile: File | null;
  previewUrl: string | null;
  isSelected: boolean;
}

export interface CreateModeloPayloadDTO {
  nombreModelo: string;
  precio: number;
  idMarca: number;
  idCategoria: number;
  idEstilo: number;
  idGenero: number;
  colores: Array<{
    idColor: number;
    fotoUrl: string;
    codigo: string; // Código del modelo-color
  }>;
  idsTallas: number[];
}

export interface FormDraftState {
  nombreModelo: string;
  precio: number;
  idMarca: number | null;
  idCategoria: number | null;
  idEstilo: number | null;
  idGenero: number | null;
  idsTallasSelected: number[];
  coloresDraft: ColorDraftDTO[];
  activeColorIdForUpload: number | null;
}
