export interface ResumenPrendaDTO {
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreCategoria: string;
  fotoPortada: string;
  precio: number;
  stockTotal: number;
  pocasUnidades: boolean;
  codigos: string[]; // Códigos del modelo-color
  tallas: string[]; // Tallas disponibles del modelo
}

export interface TallaDTO {
  idVariante: number;
  nombreTalla: string;
  stock: number;
}

export interface ColorDTO {
  nombreColor: string;
  codigoHex: string;
  fotoUrl: string;
  fotos?: string[];
  codigo?: string; // Código del modelo-color (ahora viene de modelo_color)
  tallas: TallaDTO[];
}

export interface DetallePrendaDTO {
  idModelo: number;
  nombreModelo: string;
  nombreMarca: string;
  nombreCategoria: string;
  nombreEstilo: string;
  nombreGenero?: string;
  precio: number;
  stockTotalSucursal: number;
  colores: ColorDTO[];
}
