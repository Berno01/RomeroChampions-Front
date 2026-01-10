export interface ClienteDTO {
  id_cliente: number;
  nombre_completo: string;
  celular: string;
  lugar_trabajo: string | null;
  direccion_casa?: string | null;
  estado: string;
  creado_en?: string;
}

export interface CreateClienteDTO {
  nombre_completo: string;
  celular: string;
  lugar_trabajo: string | null;
  direccion_casa: string | null;
  registrado_por: number;
}
